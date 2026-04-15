import { getVersionById } from "./lib/registryLookup";
import { evaluateVersionForApproval } from "./approval";
import { addAuditLogEntry } from "./auditLog";
import {
  getCurrentDeployedVersionId,
  updateDeploymentForPromotion,
  Environment
} from "./data/deploymentState";
import { dispatchWebhookEvent } from "./webhooks/webhookDispatcher";

export type PromotionTarget = "staging" | "production";

export interface PromotionDecision {
  versionId: string;
  targetEnvironment: PromotionTarget;
  allowed: boolean;
  reason: string;
  approvalDecision: "approved" | "rejected" | "blocked_pending_remediation" | "unknown";
}

export function evaluateVersionForPromotion(
  versionId: string,
  targetEnvironment: PromotionTarget,
  logEvaluation = true
): PromotionDecision {
  const version = getVersionById(versionId);

  let result: PromotionDecision;

  if (!version) {
    result = {
      versionId,
      targetEnvironment,
      allowed: false,
      reason: "Version does not exist in the registry.",
      approvalDecision: "unknown"
    };
  } else {
    const approvalResult = evaluateVersionForApproval(versionId, logEvaluation);

    if (approvalResult.decision !== "approved") {
      result = {
        versionId,
        targetEnvironment,
        allowed: false,
        reason: `Version is not eligible for promotion because approval status is '${approvalResult.decision}'. Reason: ${approvalResult.reason}`,
        approvalDecision: approvalResult.decision
      };
    } else if (targetEnvironment === "staging") {
      result = {
        versionId,
        targetEnvironment,
        allowed: true,
        reason: "Version is approved and eligible for promotion to staging.",
        approvalDecision: approvalResult.decision
      };
    } else if (targetEnvironment === "production") {
      result = {
        versionId,
        targetEnvironment,
        allowed: true,
        reason: "Version is approved and eligible for promotion to production.",
        approvalDecision: approvalResult.decision
      };
    } else {
      result = {
        versionId,
        targetEnvironment,
        allowed: false,
        reason: "Unknown promotion target.",
        approvalDecision: approvalResult.decision
      };
    }
  }

  if (logEvaluation) {
    addAuditLogEntry({
      actionType: "promotion_evaluated",
      versionId,
      environment: targetEnvironment,
      outcome: result.allowed ? "allowed" : "denied",
      reason: result.reason
    });
  }

  return result;
}

export function performPromotion(
  versionId: string,
  targetEnvironment: PromotionTarget
): PromotionDecision {
  const decision = evaluateVersionForPromotion(versionId, targetEnvironment);

  if (decision.allowed) {
    const version = getVersionById(versionId);
    const currentVersionId = getCurrentDeployedVersionId(targetEnvironment as Environment);

    if (!version) {
      throw new Error(`Version ${versionId} not found during promotion execution.`);
    }

    updateDeploymentForPromotion(
      targetEnvironment as Environment,
      versionId,
      version.agentId
    );

    const auditEntry = addAuditLogEntry({
      actionType: "promotion_executed",
      versionId,
      environment: targetEnvironment,
      outcome: "success",
      reason: `Version ${versionId} successfully promoted to ${targetEnvironment}.`,
      fromVersionId: currentVersionId || undefined,
      toVersionId: versionId
    });

    // Fire-and-forget webhook dispatch
    try {
      dispatchWebhookEvent("promotion_executed", auditEntry).catch((err) => {
        console.error("Webhook dispatch error (non-blocking):", err);
      });
    } catch (err) {
      console.error("Webhook dispatch error (non-blocking):", err);
    }
  }

  return decision;
}