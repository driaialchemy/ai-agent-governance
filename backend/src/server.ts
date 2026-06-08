import "dotenv/config";
import express from "express";
import * as path from "node:path";
import {
  getAllAgents,
  getAgentById,
  getAllAgentVersions,
  getVersionsByAgentId,
  getVersionById
} from "./lib/registryLookup";
import {
  getBenchmarkResultsByVersionId,
  getAverageBenchmarkScoreByVersionId,
  didVersionPassBenchmarks
} from "./lib/benchmarkLookup";
import {
  getPolicyCheckResultsByVersionId,
  didVersionPassPolicyChecks,
  getFailedPolicyChecksByVersionId
} from "./lib/policyCheckLookup";
import { evaluateVersionForApproval } from "./approval";
import { evaluateVersionForPromotion, performPromotion, PromotionTarget } from "./promotion";
import {
  evaluateVersionForRollback,
  performRollback
} from "./rollback";
import {
  deploymentState,
  Environment
} from "./data/deploymentState";
import {
  getAllAuditLogEntries,
  getAuditLogEntriesByVersionId
} from "./auditLog";
import {
  getAllSubscribers,
  getSubscriberById,
  addSubscriber,
  removeSubscriber
} from "./webhooks/webhookRegistry";
import { dispatchWebhookEvent } from "./webhooks/webhookDispatcher";
import {
  validateWebhookSecret,
  handleInboundPromotion,
  handleInboundRollback,
  handleInboundApprovalCheck
} from "./webhooks/inboundHandler";
import {
  validateVersionExists,
  validateEnvironment,
  successResponse,
  errorResponse
} from "./apiHelpers";
import { validateRuntimeConfig } from "./config";
import { requireAdminAuth } from "./middleware/auth";
import { assertSafeWebhookUrl } from "./security/urlPolicy";
import { WebhookSubscriber } from "./webhooks/types";

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

validateRuntimeConfig();

type VersionParams = { versionId: string };
type VersionEnvironmentParams = { versionId: string; environment: string };
type RollbackParams = { environment: string; targetVersionId: string };
type WebhookIdParams = { id: string };

function redactSubscriber(subscriber: WebhookSubscriber): Omit<WebhookSubscriber, "secret"> {
  const { secret: _secret, ...safeSubscriber } = subscriber;
  return safeSubscriber;
}

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: { status: "ok" }
  });
});

// Registry routes

app.get("/agents", (_req, res) => {
  const agents = getAllAgents();
  res.json({
    success: true,
    data: agents
  });
});

app.get("/agents/:agentId", (req, res) => {
  const { agentId } = req.params;
  const agent = getAgentById(agentId);

  if (!agent) {
    res.status(404).json({
      success: false,
      message: `Agent with ID '${agentId}' not found.`
    });
    return;
  }

  res.json({
    success: true,
    data: agent
  });
});

app.get("/agents/:agentId/versions", (req, res) => {
  const { agentId } = req.params;
  const agent = getAgentById(agentId);

  if (!agent) {
    res.status(404).json({
      success: false,
      message: `Agent with ID '${agentId}' not found.`
    });
    return;
  }

  const versions = getVersionsByAgentId(agentId);
  res.json({
    success: true,
    data: versions
  });
});

app.get("/versions", (_req, res) => {
  const versions = getAllAgentVersions();
  res.json({
    success: true,
    data: versions
  });
});

app.get("/versions/:versionId", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  res.json({
    success: true,
    data: version
  });
});

// Benchmark routes

app.get("/versions/:versionId/benchmarks", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  const benchmarks = getBenchmarkResultsByVersionId(versionId);
  res.json({
    success: true,
    data: benchmarks
  });
});

app.get("/versions/:versionId/benchmarks/summary", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  const averageScore = getAverageBenchmarkScoreByVersionId(versionId);
  const passedAllBenchmarks = didVersionPassBenchmarks(versionId);

  res.json({
    success: true,
    data: {
      versionId,
      averageScore,
      passedAllBenchmarks
    }
  });
});

// Policy check routes

app.get("/versions/:versionId/policy-checks", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  const policyChecks = getPolicyCheckResultsByVersionId(versionId);
  res.json({
    success: true,
    data: policyChecks
  });
});

app.get("/versions/:versionId/policy-checks/summary", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  const passedAllPolicyChecks = didVersionPassPolicyChecks(versionId);
  const failedChecks = getFailedPolicyChecksByVersionId(versionId);

  res.json({
    success: true,
    data: {
      versionId,
      passedAllPolicyChecks,
      failedChecks
    }
  });
});

// Approval route

app.get("/versions/:versionId/approval", (req, res) => {
  const { versionId } = req.params as VersionParams;

  // Validate version exists
  const validation = validateVersionExists(versionId);
  if (!validation.found) {
    res.status(validation.statusCode).json(validation.response);
    return;
  }

  // GET route is read-only - don't log evaluation to audit
  const approvalResult = evaluateVersionForApproval(versionId, false);
  res.json(successResponse(approvalResult));
});

// Promotion route

app.get("/versions/:versionId/promotion/:environment", (req, res) => {
  const { versionId, environment } = req.params as VersionEnvironmentParams;

  // Validate inputs
  const envValidation = validateEnvironment(environment);
  if (!envValidation.found) {
    res.status(envValidation.statusCode).json(envValidation.response);
    return;
  }

  const versionValidation = validateVersionExists(versionId);
  if (!versionValidation.found) {
    res.status(versionValidation.statusCode).json(versionValidation.response);
    return;
  }

  // GET route is read-only - don't log evaluation to audit
  const promotionResult = evaluateVersionForPromotion(
    versionId,
    environment as PromotionTarget,
    false
  );

  res.json(successResponse(promotionResult));
});

app.post("/versions/:versionId/promotion/:environment", requireAdminAuth, (req, res) => {
  const { versionId, environment } = req.params as VersionEnvironmentParams;

  // Validate inputs
  const envValidation = validateEnvironment(environment);
  if (!envValidation.found) {
    res.status(envValidation.statusCode).json(envValidation.response);
    return;
  }

  const versionValidation = validateVersionExists(versionId);
  if (!versionValidation.found) {
    res.status(versionValidation.statusCode).json(versionValidation.response);
    return;
  }

  const promotionResult = performPromotion(
    versionId,
    environment as PromotionTarget
  );

  if (!promotionResult.allowed) {
    res.status(400).json(errorResponse(promotionResult.reason, promotionResult));
    return;
  }

  res.json(
    successResponse(
      promotionResult,
      `Version ${versionId} successfully promoted to ${environment}.`
    )
  );
});

// Rollback routes

app.get("/deployments", (_req, res) => {
  res.json({
    success: true,
    data: deploymentState
  });
});

app.get("/rollback/:environment/:targetVersionId", (req, res) => {
  const { environment, targetVersionId } = req.params as RollbackParams;

  if (environment !== "staging" && environment !== "production") {
    res.status(400).json({
      success: false,
      message: `Invalid environment '${environment}'. Must be 'staging' or 'production'.`
    });
    return;
  }

  // GET route is read-only - don't log evaluation to audit
  const rollbackEvaluation = evaluateVersionForRollback(
    environment as Environment,
    targetVersionId,
    false
  );

  res.json({
    success: true,
    data: rollbackEvaluation
  });
});

app.post("/rollback/:environment/:targetVersionId", requireAdminAuth, (req, res) => {
  const { environment, targetVersionId } = req.params as RollbackParams;

  if (environment !== "staging" && environment !== "production") {
    res.status(400).json({
      success: false,
      message: `Invalid environment '${environment}'. Must be 'staging' or 'production'.`
    });
    return;
  }

  const rollbackResult = performRollback(
    environment as Environment,
    targetVersionId
  );

  if (!rollbackResult.allowed) {
    res.status(400).json({
      success: false,
      message: rollbackResult.reason,
      data: rollbackResult
    });
    return;
  }

  res.json({
    success: true,
    message: `Rollback to version ${targetVersionId} in ${environment} completed successfully.`,
    data: rollbackResult
  });
});

// Audit log routes

app.get("/audit-log", (_req, res) => {
  const auditEntries = getAllAuditLogEntries();
  res.json({
    success: true,
    data: auditEntries
  });
});

app.get("/audit-log/version/:versionId", (req, res) => {
  const { versionId } = req.params as VersionParams;
  const auditEntries = getAuditLogEntriesByVersionId(versionId);
  res.json({
    success: true,
    data: auditEntries
  });
});

// --- Webhook Management Endpoints ---

app.get("/webhooks", (_req, res) => {
  const subscribers = getAllSubscribers().map(redactSubscriber);
  res.json({
    success: true,
    data: subscribers
  });
});

app.post("/webhooks/subscribe", requireAdminAuth, async (req, res) => {
  const { url, events, secret } = req.body;

  if (!url || !events || !secret) {
    res.status(400).json({
      success: false,
      message: "Missing required fields: url, events, secret"
    });
    return;
  }

  if (!Array.isArray(events) || events.length === 0) {
    res.status(400).json({
      success: false,
      message: "Field 'events' must be a non-empty array"
    });
    return;
  }

  try {
    await assertSafeWebhookUrl(url);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Unsafe webhook URL"
    });
    return;
  }

  const subscriber = addSubscriber(url, events, secret);
  res.json({
    success: true,
    data: redactSubscriber(subscriber)
  });
});

app.delete("/webhooks/:id", requireAdminAuth, (req, res) => {
  const { id } = req.params as WebhookIdParams;
  const removed = removeSubscriber(id);

  if (!removed) {
    res.status(404).json({
      success: false,
      message: "Subscriber not found"
    });
    return;
  }

  res.json({
    success: true,
    message: "Subscriber removed"
  });
});

app.post("/webhooks/test/:id", requireAdminAuth, async (req, res) => {
  const { id } = req.params as WebhookIdParams;
  const subscriber = getSubscriberById(id);

  if (!subscriber) {
    res.status(404).json({
      success: false,
      message: "Subscriber not found"
    });
    return;
  }

  const testData = {
    message: "Test ping from AI Agent Registry"
  };

  try {
    const results = await dispatchWebhookEvent("test_ping", testData);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during test"
    });
  }
});

// --- Inbound Webhook Endpoints ---

app.post("/webhooks/actions/check-approval", (req, res) => {
  const requestSecret = req.headers["x-webhook-secret"] as string | undefined;

  if (!validateWebhookSecret(requestSecret)) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or missing webhook secret"
    });
    return;
  }

  const { versionId } = req.body;

  if (!versionId) {
    res.status(400).json({
      success: false,
      message: "Missing required field: versionId"
    });
    return;
  }

  const result = handleInboundApprovalCheck(versionId);
  res.json(result);
});

app.post("/webhooks/actions/promote", (req, res) => {
  const requestSecret = req.headers["x-webhook-secret"] as string | undefined;

  if (!validateWebhookSecret(requestSecret)) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or missing webhook secret"
    });
    return;
  }

  const { versionId, environment } = req.body;

  if (!versionId || !environment) {
    res.status(400).json({
      success: false,
      message: "Missing required fields: versionId, environment"
    });
    return;
  }

  if (environment !== "staging" && environment !== "production") {
    res.status(400).json({
      success: false,
      message: `Invalid environment '${environment}'. Must be 'staging' or 'production'.`
    });
    return;
  }

  const result = handleInboundPromotion(versionId, environment);

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

app.post("/webhooks/actions/rollback", (req, res) => {
  const requestSecret = req.headers["x-webhook-secret"] as string | undefined;

  if (!validateWebhookSecret(requestSecret)) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or missing webhook secret"
    });
    return;
  }

  const { environment, targetVersionId } = req.body;

  if (!environment || !targetVersionId) {
    res.status(400).json({
      success: false,
      message: "Missing required fields: environment, targetVersionId"
    });
    return;
  }

  if (environment !== "staging" && environment !== "production") {
    res.status(400).json({
      success: false,
      message: `Invalid environment '${environment}'. Must be 'staging' or 'production'.`
    });
    return;
  }

  const result = handleInboundRollback(environment, targetVersionId);

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
