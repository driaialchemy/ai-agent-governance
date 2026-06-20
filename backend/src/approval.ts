import { getGovernanceSpecForVersion } from "./lib/specLookup";
import { validateSpecForVersion } from "./lib/specValidation";
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

import { addAuditLogEntry } from "./auditLog";
import { dispatchWebhookEvent } from "./webhooks/webhookDispatcher";

export type ApprovalDecision =
  | "approved"
  | "rejected"
  | "blocked_pending_remediation";

export interface ApprovalResult {
  versionId: string;
  decision: ApprovalDecision;
  reason: string;
  averageBenchmarkScore: number | null;
  benchmarkPassed: boolean;
  policyPassed: boolean;
  failedPolicyChecks: string[];
}

function getPolicyCheckName(check: unknown): string {
  const obj = check as Record<string, unknown>;
  const possibleName =
    obj["policyName"] ??
    obj["checkName"] ??
    obj["name"] ??
    obj["id"] ??
    "unknown_policy_check";

  return String(possibleName);
}

function logSpecValidationAudit(
  versionId: string,
  logEvaluation: boolean
): void {
  if (!logEvaluation) {
    return;
  }

  const specValidation = validateSpecForVersion(versionId);
  const spec = getGovernanceSpecForVersion(versionId);
  const shouldLogSpecValidation = spec?.auditRequirements.logSpecValidation ?? true;

  if (!shouldLogSpecValidation) {
    return;
  }

  if (specValidation.outcome === "missing_spec") {
    addAuditLogEntry({
      actionType: "spec_missing",
      versionId,
      outcome: "missing_spec",
      reason: specValidation.reasons.join(" ")
    });
    return;
  }

  if (specValidation.outcome === "failed") {
    addAuditLogEntry({
      actionType: "spec_validation_failed",
      versionId,
      outcome: "failed",
      reason: specValidation.reasons.join(" "),
      specId: specValidation.specId,
      specVersion: specValidation.specVersion
    });
    return;
  }

  addAuditLogEntry({
    actionType: "spec_validated",
    versionId,
    outcome: "passed",
    reason: specValidation.reasons.join(" "),
    specId: specValidation.specId,
    specVersion: specValidation.specVersion
  });
}

export function evaluateVersionForApproval(versionId: string, logEvaluation = true): ApprovalResult {
  const specValidation = validateSpecForVersion(versionId);

  if (logEvaluation) {
    logSpecValidationAudit(versionId, logEvaluation);
  }

  if (!specValidation.allowed) {
    const result: ApprovalResult = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: specValidation.reasons.join(" "),
      averageBenchmarkScore: null,
      benchmarkPassed: false,
      policyPassed: false,
      failedPolicyChecks: []
    };

    if (logEvaluation) {
      const auditEntry = addAuditLogEntry({
        actionType: "approval_evaluated",
        versionId,
        outcome: result.decision,
        reason: result.reason,
        specId: specValidation.specId,
        specVersion: specValidation.specVersion
      });

      try {
        dispatchWebhookEvent("approval_evaluated", auditEntry).catch((err) => {
          console.error("Webhook dispatch error (non-blocking):", err);
        });
      } catch (err) {
        console.error("Webhook dispatch error (non-blocking):", err);
      }
    }

    return result;
  }

  const benchmarkResults = getBenchmarkResultsByVersionId(versionId);
  const policyChecks = getPolicyCheckResultsByVersionId(versionId);

  const hasBenchmarks = benchmarkResults.length > 0;
  const hasPolicyChecks = policyChecks.length > 0;

  const benchmarkPassed = hasBenchmarks
    ? didVersionPassBenchmarks(versionId)
    : false;

  const policyPassed = hasPolicyChecks
    ? didVersionPassPolicyChecks(versionId)
    : false;

  const averageBenchmarkScore = hasBenchmarks
    ? getAverageBenchmarkScoreByVersionId(versionId)
    : null;

  const failedPolicyChecks = hasPolicyChecks
    ? getFailedPolicyChecksByVersionId(versionId).map(getPolicyCheckName)
    : [];

  let result: ApprovalResult;

  if (!hasBenchmarks && !hasPolicyChecks) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "No benchmark or policy check data exists for this version.",
      averageBenchmarkScore,
      benchmarkPassed: false,
      policyPassed: false,
      failedPolicyChecks
    };
  } else if (!hasBenchmarks) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "Benchmark data is missing for this version.",
      averageBenchmarkScore,
      benchmarkPassed: false,
      policyPassed,
      failedPolicyChecks
    };
  } else if (!hasPolicyChecks) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "Policy check data is missing for this version.",
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed: false,
      failedPolicyChecks
    };
  } else if (!policyPassed) {
    result = {
      versionId,
      decision: "rejected",
      reason: `Version failed policy checks: ${failedPolicyChecks.join(", ")}`,
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed,
      failedPolicyChecks
    };
  } else if (!benchmarkPassed) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "Version did not pass all benchmark requirements.",
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed,
      failedPolicyChecks
    };
  } else {
    result = {
      versionId,
      decision: "approved",
      reason: "Version passed all benchmark and policy requirements.",
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed,
      failedPolicyChecks
    };
  }

  if (logEvaluation) {
    const auditEntry = addAuditLogEntry({
      actionType: "approval_evaluated",
      versionId,
      outcome: result.decision,
      reason: result.reason,
      specId: specValidation.specId,
      specVersion: specValidation.specVersion
    });

    try {
      dispatchWebhookEvent("approval_evaluated", auditEntry).catch((err) => {
        console.error("Webhook dispatch error (non-blocking):", err);
      });
    } catch (err) {
      console.error("Webhook dispatch error (non-blocking):", err);
    }
  }

  return result;
}
