import { getVersionById } from "./lib/registryLookup";
import { evaluateVersionForApproval } from "./approval";
import { validateSpecForRollback } from "./lib/specValidation";
import { addAuditLogEntry } from "./auditLog";
import {
  getCurrentDeployedVersionId,
  getPreviousDeployedVersionIds,
  updateDeployment,
  Environment
} from "./data/deploymentState";
import { dispatchWebhookEvent } from "./webhooks/webhookDispatcher";

export interface RollbackDecision {
  environment: Environment;
  currentVersionId: string | null;
  targetVersionId: string;
  allowed: boolean;
  reason: string;
}

export function evaluateVersionForRollback(
  environment: Environment,
  targetVersionId: string,
  logEvaluation = true
): RollbackDecision {
  const currentVersionId = getCurrentDeployedVersionId(environment);

  let result: RollbackDecision;

  if (!currentVersionId) {
    result = {
      environment,
      currentVersionId: null,
      targetVersionId,
      allowed: false,
      reason: `No version is currently deployed to ${environment}.`
    };
  } else if (currentVersionId === targetVersionId) {
    result = {
      environment,
      currentVersionId,
      targetVersionId,
      allowed: false,
      reason: "Target version is already the currently deployed version."
    };
  } else {
    const currentVersion = getVersionById(currentVersionId);
    const targetVersion = getVersionById(targetVersionId);

    if (!currentVersion) {
      result = {
        environment,
        currentVersionId,
        targetVersionId,
        allowed: false,
        reason: "Current deployed version does not exist in the registry."
      };
    } else if (!targetVersion) {
      result = {
        environment,
        currentVersionId,
        targetVersionId,
        allowed: false,
        reason: "Target rollback version does not exist in the registry."
      };
    } else if (currentVersion.agentId !== targetVersion.agentId) {
      result = {
        environment,
        currentVersionId,
        targetVersionId,
        allowed: false,
        reason: `Target version belongs to a different agent. Current agent: ${currentVersion.agentId}, Target agent: ${targetVersion.agentId}`
      };
    } else {
      const specValidation = validateSpecForRollback(targetVersionId, environment);

      if (!specValidation.allowed) {
        result = {
          environment,
          currentVersionId,
          targetVersionId,
          allowed: false,
          reason: specValidation.reasons.join(" ")
        };
      } else {
        const previousVersionIds = getPreviousDeployedVersionIds(environment);
        const isPreviouslyDeployed = previousVersionIds.includes(targetVersionId);

        if (!isPreviouslyDeployed) {
          result = {
            environment,
            currentVersionId,
            targetVersionId,
            allowed: false,
            reason: "Target version was never previously deployed to this environment."
          };
        } else {
          const approvalResult = evaluateVersionForApproval(targetVersionId, logEvaluation);

          if (approvalResult.decision !== "approved") {
            result = {
              environment,
              currentVersionId,
              targetVersionId,
              allowed: false,
              reason: `Target version is not eligible for rollback because approval status is '${approvalResult.decision}'. Reason: ${approvalResult.reason}`
            };
          } else {
            result = {
              environment,
              currentVersionId,
              targetVersionId,
              allowed: true,
              reason: `Rollback to previously deployed version ${targetVersionId} is allowed.`
            };
          }
        }
      }
    }
  }

  if (logEvaluation) {
    addAuditLogEntry({
      actionType: "rollback_evaluated",
      versionId: targetVersionId,
      environment,
      outcome: result.allowed ? "allowed" : "denied",
      reason: result.reason,
      fromVersionId: currentVersionId || undefined,
      toVersionId: targetVersionId
    });
  }

  return result;
}

export function performRollback(
  environment: Environment,
  targetVersionId: string
): RollbackDecision {
  const decision = evaluateVersionForRollback(environment, targetVersionId);

  if (decision.allowed) {
    updateDeployment(environment, targetVersionId);

    const auditEntry = addAuditLogEntry({
      actionType: "rollback_executed",
      versionId: targetVersionId,
      environment,
      outcome: "success",
      reason: `Rollback to version ${targetVersionId} in ${environment} completed successfully.`,
      fromVersionId: decision.currentVersionId || undefined,
      toVersionId: targetVersionId
    });

    try {
      dispatchWebhookEvent("rollback_executed", auditEntry).catch((err) => {
        console.error("Webhook dispatch error (non-blocking):", err);
      });
    } catch (err) {
      console.error("Webhook dispatch error (non-blocking):", err);
    }
  }

  return decision;
}
