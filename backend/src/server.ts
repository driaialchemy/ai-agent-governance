import "dotenv/config";
import express from "express";
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
  getAllGovernanceSpecs,
  getGovernanceSpecById,
  getGovernanceSpecForVersion
} from "./lib/specLookup";
import { validateSpecForVersion } from "./lib/specValidation";
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
import { riskPolicies, getRiskPolicyById } from "./data/riskPolicies";
import { logActivity, getActivityByAgent } from "./lib/activityLogger";
import { validatePaths } from "./lib/pathValidator";
import { validateTests } from "./lib/testValidator";
import { generateRiskReport } from "./lib/riskReportGenerator";
import {
  createApprovalRequest,
  approveRequest,
  rejectRequest,
  getApprovalRequest,
  getPendingApprovals
} from "./lib/approvalGate";

const app = express();
app.use(express.json());

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

// Spec routes

app.get("/specs", (_req, res) => {
  const specs = getAllGovernanceSpecs();
  res.json({
    success: true,
    data: specs
  });
});

app.get("/specs/:specId", (req, res) => {
  const { specId } = req.params;
  const spec = getGovernanceSpecById(specId);

  if (!spec) {
    res.status(404).json({
      success: false,
      message: `Governance spec with ID '${specId}' not found.`
    });
    return;
  }

  res.json({
    success: true,
    data: spec
  });
});

app.get("/versions/:versionId/spec", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  const spec = getGovernanceSpecForVersion(versionId);

  if (!spec) {
    res.status(404).json({
      success: false,
      message: `No governance spec found for version '${versionId}'.`
    });
    return;
  }

  res.json({
    success: true,
    data: spec
  });
});

app.get("/versions/:versionId/spec-validation", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  const validationResult = validateSpecForVersion(versionId);
  res.json({
    success: true,
    data: validationResult
  });
});

// Approval route

app.get("/versions/:versionId/approval", (req, res) => {
  const { versionId } = req.params;
  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  // GET route is read-only - don't log evaluation to audit
  const approvalResult = evaluateVersionForApproval(versionId, false);
  res.json({
    success: true,
    data: approvalResult
  });
});

// Promotion route

app.get("/versions/:versionId/promotion/:environment", (req, res) => {
  const { versionId, environment } = req.params;

  if (environment !== "staging" && environment !== "production") {
    res.status(400).json({
      success: false,
      message: `Invalid environment '${environment}'. Must be 'staging' or 'production'.`
    });
    return;
  }

  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  // GET route is read-only - don't log evaluation to audit
  const promotionResult = evaluateVersionForPromotion(
    versionId,
    environment as PromotionTarget,
    false
  );

  res.json({
    success: true,
    data: promotionResult
  });
});

app.post("/versions/:versionId/promotion/:environment", (req, res) => {
  const { versionId, environment } = req.params;

  if (environment !== "staging" && environment !== "production") {
    res.status(400).json({
      success: false,
      message: `Invalid environment '${environment}'. Must be 'staging' or 'production'.`
    });
    return;
  }

  const version = getVersionById(versionId);

  if (!version) {
    res.status(404).json({
      success: false,
      message: `Version with ID '${versionId}' not found.`
    });
    return;
  }

  const promotionResult = performPromotion(
    versionId,
    environment as PromotionTarget
  );

  if (!promotionResult.allowed) {
    res.status(400).json({
      success: false,
      message: promotionResult.reason,
      data: promotionResult
    });
    return;
  }

  res.json({
    success: true,
    message: `Version ${versionId} successfully promoted to ${environment}.`,
    data: promotionResult
  });
});

// Rollback routes

app.get("/deployments", (_req, res) => {
  res.json({
    success: true,
    data: deploymentState
  });
});

app.get("/rollback/:environment/:targetVersionId", (req, res) => {
  const { environment, targetVersionId } = req.params;

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

app.post("/rollback/:environment/:targetVersionId", (req, res) => {
  const { environment, targetVersionId } = req.params;

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
  const { versionId } = req.params;
  const auditEntries = getAuditLogEntriesByVersionId(versionId);
  res.json({
    success: true,
    data: auditEntries
  });
});

// --- Webhook Management Endpoints ---

app.get("/webhooks", (_req, res) => {
  const subscribers = getAllSubscribers();
  res.json({
    success: true,
    data: subscribers
  });
});

app.post("/webhooks/subscribe", (req, res) => {
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

  const subscriber = addSubscriber(url, events, secret);
  res.json({
    success: true,
    data: subscriber
  });
});

app.delete("/webhooks/:id", (req, res) => {
  const { id } = req.params;
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

app.post("/webhooks/test/:id", async (req, res) => {
  const { id } = req.params;
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

// --- Risk Governance Endpoints ---

app.get("/risk-policies", (_req, res) => {
  res.json({
    success: true,
    data: riskPolicies
  });
});

app.get("/risk-policies/:id", (req, res) => {
  const policy = getRiskPolicyById(req.params.id);

  if (!policy) {
    res.status(404).json({
      success: false,
      message: "Policy not found"
    });
    return;
  }

  res.json({
    success: true,
    data: policy
  });
});

app.post("/agents/:id/activity", (req, res) => {
  const { id: agentId } = req.params;
  const activityData = req.body.activity ?? req.body;

  if (!activityData?.actionType) {
    res.status(400).json({
      success: false,
      message: "Activity required"
    });
    return;
  }

  const logged = logActivity({
    ...activityData,
    agentId: activityData.agentId || agentId,
    versionId: activityData.versionId || "",
    description: activityData.description || "",
    evidence: activityData.evidence || { timestamp: new Date().toISOString() },
    timestamp: activityData.timestamp || new Date().toISOString()
  });

  res.json({
    success: true,
    data: logged
  });
});

app.get("/agents/:id/activity-report", (req, res) => {
  const report = getActivityByAgent(req.params.id);
  res.json({
    success: true,
    data: report
  });
});

app.post("/agents/:id/assess-risks", (req, res) => {
  const { policyId } = req.body;
  const policy = getRiskPolicyById(policyId);

  if (!policy) {
    res.status(404).json({
      success: false,
      message: "Policy not found"
    });
    return;
  }

  const activityReport = getActivityByAgent(req.params.id);
  const pathRisks = validatePaths(activityReport, policy);
  const testRisks = validateTests(activityReport, policy);

  res.json({
    success: true,
    data: {
      pathRisks,
      testRisks,
      totalRisks: pathRisks.length + testRisks.length
    }
  });
});

app.post("/agents/:id/generate-report", (req, res) => {
  const { policyId, versionId, approvalRequestId } = req.body;
  const policy = getRiskPolicyById(policyId);

  if (!policy) {
    res.status(404).json({
      success: false,
      message: "Policy not found"
    });
    return;
  }

  const activityReport = getActivityByAgent(req.params.id);
  const pathRisks = validatePaths(activityReport, policy);
  const testRisks = validateTests(activityReport, policy);

  let approvalRequest = approvalRequestId
    ? getApprovalRequest(approvalRequestId) ?? null
    : null;

  const highCriticalRisks = [...pathRisks, ...testRisks]
    .filter((r) => policy.requiresHumanApprovalFor.includes(r.riskLevel))
    .map((r) => ({
      id: r.riskId,
      description: "category" in r ? `${r.category}: ${r.path || r.testName}` : r.riskId,
      level: r.riskLevel
    }));

  if (!approvalRequest && highCriticalRisks.length > 0) {
    approvalRequest = createApprovalRequest(
      req.params.id,
      versionId || activityReport.versionId,
      highCriticalRisks,
      policy
    );
  }

  const report = generateRiskReport(
    req.params.id,
    versionId || activityReport.versionId,
    activityReport,
    pathRisks,
    testRisks,
    approvalRequest,
    policy,
    true
  );

  res.json({
    success: true,
    data: report
  });
});

app.get("/approvals/pending", (_req, res) => {
  const pending = getPendingApprovals();
  res.json({
    success: true,
    data: pending
  });
});

app.post("/approvals/request", (req, res) => {
  const { agentId, versionId, risks, policyId } = req.body;
  const policy = getRiskPolicyById(policyId);

  if (!policy) {
    res.status(404).json({
      success: false,
      message: "Policy not found"
    });
    return;
  }

  if (!agentId || !versionId || !risks) {
    res.status(400).json({
      success: false,
      message: "Missing required fields: agentId, versionId, risks"
    });
    return;
  }

  const request = createApprovalRequest(agentId, versionId, risks, policy);
  res.json({
    success: true,
    data: request
  });
});

app.post("/approvals/:id/approve", (req, res) => {
  const { approver, notes } = req.body;

  if (!approver) {
    res.status(400).json({
      success: false,
      message: "Approver required"
    });
    return;
  }

  try {
    const request = approveRequest(req.params.id, approver, notes);
    res.json({
      success: true,
      message: "Approval granted",
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Approval failed"
    });
  }
});

app.post("/approvals/:id/reject", (req, res) => {
  const { approver, notes } = req.body;

  if (!approver || !notes) {
    res.status(400).json({
      success: false,
      message: "Approver and rejection notes required"
    });
    return;
  }

  try {
    const request = rejectRequest(req.params.id, approver, notes);
    res.json({
      success: true,
      message: "Approval rejected",
      data: request
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Rejection failed"
    });
  }
});

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});