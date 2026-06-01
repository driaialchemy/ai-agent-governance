import { evaluateVersionForApproval } from "../approval";
import { performPromotion, PromotionTarget } from "../promotion";
import { performRollback } from "../rollback";
import { Environment } from "../data/deploymentState";
import { constantTimeEqual, isMissingOrRejectedSecret } from "../security/secrets";

export function validateWebhookSecret(requestSecret: string | undefined, expectedSecret = process.env.WEBHOOK_INBOUND_SECRET): boolean {
  if (!requestSecret) {
    return false;
  }
  if (typeof expectedSecret !== "string" || isMissingOrRejectedSecret(expectedSecret)) {
    return false;
  }
  return constantTimeEqual(requestSecret, expectedSecret);
}

export function handleInboundPromotion(
  versionId: string,
  environment: string
): { success: boolean; data?: unknown; message?: string } {
  try {
    const result = performPromotion(versionId, environment as PromotionTarget);

    if (result.allowed) {
      return {
        success: true,
        data: result,
        message: `Version ${versionId} successfully promoted to ${environment}.`
      };
    } else {
      return {
        success: false,
        data: result,
        message: result.reason
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during promotion"
    };
  }
}

export function handleInboundRollback(
  environment: string,
  targetVersionId: string
): { success: boolean; data?: unknown; message?: string } {
  try {
    const result = performRollback(environment as Environment, targetVersionId);

    if (result.allowed) {
      return {
        success: true,
        data: result,
        message: `Rollback to version ${targetVersionId} in ${environment} completed successfully.`
      };
    } else {
      return {
        success: false,
        data: result,
        message: result.reason
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during rollback"
    };
  }
}

export function handleInboundApprovalCheck(
  versionId: string
): { success: boolean; data?: unknown; message?: string } {
  try {
    const result = evaluateVersionForApproval(versionId, true);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error during approval check"
    };
  }
}
