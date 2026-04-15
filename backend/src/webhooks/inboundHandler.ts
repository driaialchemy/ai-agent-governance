import { evaluateVersionForApproval } from "../approval";
import { performPromotion, PromotionTarget } from "../promotion";
import { performRollback } from "../rollback";
import { Environment } from "../data/deploymentState";

// Get the expected secret from environment variable or use default for prototype
const EXPECTED_SECRET = process.env.WEBHOOK_INBOUND_SECRET || "inbound-default-secret-change-me";

export function validateWebhookSecret(requestSecret: string | undefined, expectedSecret: string = EXPECTED_SECRET): boolean {
  if (!requestSecret) {
    return false;
  }
  return requestSecret === expectedSecret;
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
