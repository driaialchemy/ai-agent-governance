import { getVersionById } from "./lib/registryLookup";
import { evaluateVersionForApproval } from "./approval";
import { addAuditLogEntry } from "./auditLog";
import {
  getCurrentDeployedVersionId,
  updateDeploymentForPromotion,
  Environment
} from "./data/deploymentState";
import { dispatchWebhookEvent } from "./webhooks/webhookDispatcher";
import { meetsConfidenceRequirement, ConfidenceScore } from "./confidence";
import { Evidence } from "./evidenceBuilder";

/**
 * Valid promotion target environments
 */
export type PromotionTarget = "staging" | "production";

/**
 * Result of evaluating or performing a promotion
 * This is the primary output for Zapier "Promote Version" actions
 *
 * @property allowed - Whether the promotion is permitted
 * @property reason - Human-readable explanation of the decision
 * @property evidence - Structured evidence supporting the decision (if available)
 * @property confidence - Confidence score and level (if available)
 */
export interface PromotionDecision {
  versionId: string;
  targetEnvironment: PromotionTarget;
  allowed: boolean;
  reason: string;
  approvalDecision: "approved" | "rejected" | "blocked_pending_remediation" | "unknown";
  evidence?: Evidence;
  confidence?: ConfidenceScore;
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
        approvalDecision: approvalResult.decision,
        evidence: approvalResult.evidence,
        confidence: approvalResult.confidence
      };
    } else {
      // Check confidence requirement for target environment
      const meetsConfidence = meetsConfidenceRequirement(
        approvalResult.confidence,
        targetEnvironment
      );

      if (!meetsConfidence) {
        result = {
          versionId,
          targetEnvironment,
          allowed: false,
          reason: `Version has ${approvalResult.confidence.level} confidence (score: ${approvalResult.confidence.score}), but ${targetEnvironment} requires ${targetEnvironment === "production" ? "HIGH (≥80)" : "MEDIUM (≥50)"} confidence.`,
          approvalDecision: approvalResult.decision,
          evidence: approvalResult.evidence,
          confidence: approvalResult.confidence
        };
      } else if (targetEnvironment === "staging") {
        result = {
          versionId,
          targetEnvironment,
          allowed: true,
          reason: `Version is approved with ${approvalResult.confidence.level} confidence and eligible for promotion to staging.`,
          approvalDecision: approvalResult.decision,
          evidence: approvalResult.evidence,
          confidence: approvalResult.confidence
        };
      } else if (targetEnvironment === "production") {
        result = {
          versionId,
          targetEnvironment,
          allowed: true,
          reason: `Version is approved with ${approvalResult.confidence.level} confidence and eligible for promotion to production.`,
          approvalDecision: approvalResult.decision,
          evidence: approvalResult.evidence,
          confidence: approvalResult.confidence
        };
      } else {
        result = {
          versionId,
          targetEnvironment,
          allowed: false,
          reason: "Unknown promotion target.",
          approvalDecision: approvalResult.decision,
          evidence: approvalResult.evidence,
          confidence: approvalResult.confidence
        };
      }
    }
  }

  if (logEvaluation) {
    addAuditLogEntry({
      actionType: "promotion_evaluated",
      versionId,
      environment: targetEnvironment,
      outcome: result.allowed ? "allowed" : "denied",
      reason: result.reason,
      evidence: result.evidence,
      confidenceScore: result.confidence?.score,
      confidenceLevel: result.confidence?.level
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
      toVersionId: versionId,
      evidence: decision.evidence,
      confidenceScore: decision.confidence?.score,
      confidenceLevel: decision.confidence?.level
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