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
import { validateAllData } from "./deterministicChecks";
import { buildEvidence, Evidence } from "./evidenceBuilder";
import { calculateConfidenceScore, ConfidenceScore } from "./confidence";

/**
 * Approval decision outcomes
 * - approved: Version passes all checks and is ready for promotion
 * - rejected: Version fails policy checks and cannot be promoted
 * - blocked_pending_remediation: Version has missing/invalid data or failed benchmarks
 */
export type ApprovalDecision =
  | "approved"
  | "rejected"
  | "blocked_pending_remediation";

/**
 * Result of evaluating a version for approval
 * This is the primary output for Zapier "Check Approval Status" actions
 */
export interface ApprovalResult {
  versionId: string;
  decision: ApprovalDecision;
  reason: string;
  averageBenchmarkScore: number | null;
  benchmarkPassed: boolean;
  policyPassed: boolean;
  failedPolicyChecks: string[];
  /** Structured evidence supporting the approval decision */
  evidence: Evidence;
  /** Confidence score and level (LOW/MEDIUM/HIGH) */
  confidence: ConfidenceScore;
  /** Any validation errors that blocked approval */
  validationErrors: string[];
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

export function evaluateVersionForApproval(versionId: string, logEvaluation = true): ApprovalResult {
  const benchmarkResults = getBenchmarkResultsByVersionId(versionId);
  const policyChecks = getPolicyCheckResultsByVersionId(versionId);

  // Step 1: Deterministic validation (hard gate)
  const validation = validateAllData(benchmarkResults, policyChecks);

  // Step 2: Build evidence
  const evidence = buildEvidence(benchmarkResults, policyChecks);

  // Step 3: Calculate confidence
  const confidence = calculateConfidenceScore(evidence, validation);

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

  // Deterministic validation failures block approval
  if (!validation.passed) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: `Validation failed: ${validation.errors.join("; ")}`,
      averageBenchmarkScore,
      benchmarkPassed: false,
      policyPassed: false,
      failedPolicyChecks,
      evidence,
      confidence,
      validationErrors: validation.errors
    };
  } else if (!hasBenchmarks && !hasPolicyChecks) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "No benchmark or policy check data exists for this version.",
      averageBenchmarkScore,
      benchmarkPassed: false,
      policyPassed: false,
      failedPolicyChecks,
      evidence,
      confidence,
      validationErrors: validation.errors
    };
  } else if (!hasBenchmarks) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "Benchmark data is missing for this version.",
      averageBenchmarkScore,
      benchmarkPassed: false,
      policyPassed,
      failedPolicyChecks,
      evidence,
      confidence,
      validationErrors: validation.errors
    };
  } else if (!hasPolicyChecks) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "Policy check data is missing for this version.",
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed: false,
      failedPolicyChecks,
      evidence,
      confidence,
      validationErrors: validation.errors
    };
  } else if (!policyPassed) {
    result = {
      versionId,
      decision: "rejected",
      reason: `Version failed policy checks: ${failedPolicyChecks.join(", ")}`,
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed,
      failedPolicyChecks,
      evidence,
      confidence,
      validationErrors: validation.errors
    };
  } else if (!benchmarkPassed) {
    result = {
      versionId,
      decision: "blocked_pending_remediation",
      reason: "Version did not pass all benchmark requirements.",
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed,
      failedPolicyChecks,
      evidence,
      confidence,
      validationErrors: validation.errors
    };
  } else {
    result = {
      versionId,
      decision: "approved",
      reason: "Version passed all benchmark and policy requirements.",
      averageBenchmarkScore,
      benchmarkPassed,
      policyPassed,
      failedPolicyChecks,
      evidence,
      confidence,
      validationErrors: validation.errors
    };
  }

  if (logEvaluation) {
    const auditEntry = addAuditLogEntry({
      actionType: "approval_evaluated",
      versionId,
      outcome: result.decision,
      reason: result.reason,
      evidence: result.evidence,
      confidenceScore: result.confidence.score,
      confidenceLevel: result.confidence.level
    });

    // Fire-and-forget webhook dispatch
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