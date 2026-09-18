import { getRiskPolicyById } from "../data/riskPolicies";
import { RiskPolicySpec } from "../specs/riskPolicySpec";

export interface BlockingDecision {
  allowed: boolean;
  violation?: string;
  violatedPolicy?: string;
  escalationId?: string;
}

type ActivityPayload = {
  agentId?: string;
  actionType?: string;
  path?: string;
  testPassed?: boolean;
  riskLevel?: string;
  evidence?: {
    sourceFile?: string;
    lineNumber?: number;
  };
  result?: {
    success?: boolean;
    output?: Record<string, unknown>;
    data?: Record<string, unknown>;
  };
};

function getRiskLevel(activity: ActivityPayload): string | undefined {
  const output = activity.result?.output ?? activity.result?.data;
  if (typeof output?.riskLevel === "string") {
    return output.riskLevel;
  }
  return activity.riskLevel;
}

function checkRestrictedPath(
  path: string | undefined,
  policy: RiskPolicySpec
): BlockingDecision | null {
  if (!path) {
    return null;
  }

  for (const restrictedFile of policy.restrictedFiles) {
    if (path.endsWith(restrictedFile) || path.includes(`/${restrictedFile}`)) {
      return {
        allowed: false,
        violation: `Activity touched restricted file: ${restrictedFile}`,
        violatedPolicy: policy.id,
      };
    }
  }

  for (const restrictedFolder of policy.restrictedFolders) {
    if (path.includes(restrictedFolder)) {
      return {
        allowed: false,
        violation: `Activity touched restricted folder: ${restrictedFolder}`,
        violatedPolicy: policy.id,
      };
    }
  }

  return null;
}

export function evaluateActivityForBlocking(
  activity: ActivityPayload,
  policyId = "policy-001"
): BlockingDecision {
  const policy = getRiskPolicyById(policyId);
  if (!policy) {
    return { allowed: true };
  }

  const sourcePath = activity.evidence?.sourceFile || activity.path;
  const restrictedDecision = checkRestrictedPath(sourcePath, policy);
  if (restrictedDecision) {
    return restrictedDecision;
  }

  if (policy.deploymentBlocks.blockIfTestsFail) {
    const testsFailed =
      activity.actionType === "test_run" &&
      (activity.testPassed === false || activity.result?.success === false);

    if (testsFailed) {
      return {
        allowed: false,
        violation: "Tests failed - deployment blocked",
        violatedPolicy: policy.id,
      };
    }
  }

  const riskLevel = getRiskLevel(activity);
  if (riskLevel && ["high", "critical"].includes(riskLevel)) {
    const missingEvidence =
      (policy.evidenceRequired.mustCiteSourceFile && !activity.evidence?.sourceFile) ||
      (policy.evidenceRequired.mustCiteLineNumber && !activity.evidence?.lineNumber);

    if (missingEvidence) {
      return {
        allowed: false,
        violation: "High-risk activity missing required evidence",
        violatedPolicy: policy.id,
      };
    }
  }

  if (riskLevel === "critical") {
    return {
      allowed: false,
      violation: "CRITICAL risk - requires human approval",
      violatedPolicy: policy.id,
    };
  }

  return { allowed: true };
}
