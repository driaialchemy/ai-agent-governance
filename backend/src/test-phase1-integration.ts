// Phase 1 Integration Test
// Tests deterministic validation, evidence building, confidence scoring, and approval hardening
// Run with: npx tsx src/test-phase1-integration.ts

import { evaluateVersionForApproval } from "./approval";
import { evaluateVersionForPromotion, performPromotion } from "./promotion";
import { evaluateVersionForRollback, performRollback } from "./rollback";
import { getAllAuditLogEntries } from "./auditLog";
import { deploymentState } from "./data/deploymentState";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`✗ FAILED: ${testName}`);
    testsFailed++;
  }
}

function assertEquals<T>(actual: T, expected: T, testName: string): void {
  assert(actual === expected, testName);
}

console.log("PHASE 1 INTEGRATION TESTS");
console.log("=========================\n");

// Test 1: Approval with evidence and confidence
console.log("TEST GROUP: Approval Enhancement");
console.log("---------------------------------");

const approvalResult = evaluateVersionForApproval("ver-002", false);

assert(approvalResult.evidence !== undefined, "Approval result should include evidence");
assert(approvalResult.confidence !== undefined, "Approval result should include confidence");
assert(
  approvalResult.validationErrors !== undefined,
  "Approval result should include validation errors"
);

// Check evidence structure
assert(
  approvalResult.evidence.benchmarks !== undefined,
  "Evidence should include benchmark data"
);
assert(
  approvalResult.evidence.policies !== undefined,
  "Evidence should include policy data"
);
assert(
  approvalResult.evidence.collectedAt !== undefined,
  "Evidence should include collection timestamp"
);

// Check confidence structure
assert(approvalResult.confidence.score >= 0, "Confidence score should be >= 0");
assert(approvalResult.confidence.score <= 100, "Confidence score should be <= 100");
assert(
  ["LOW", "MEDIUM", "HIGH"].includes(approvalResult.confidence.level),
  "Confidence level should be LOW, MEDIUM, or HIGH"
);
assert(
  approvalResult.confidence.factors !== undefined,
  "Confidence should include factors"
);

// ver-002 should be approved with high confidence
assertEquals(approvalResult.decision, "approved", "ver-002 should be approved");
assert(
  approvalResult.confidence.level === "HIGH",
  "ver-002 should have HIGH confidence"
);

console.log("");

// Test 2: Confidence enforcement in promotion
console.log("TEST GROUP: Confidence Enforcement");
console.log("-----------------------------------");

// ver-002 should be allowed to staging (MEDIUM or HIGH confidence)
const stagingPromotion = evaluateVersionForPromotion("ver-002", "staging", false);
assertEquals(stagingPromotion.allowed, true, "HIGH confidence should allow staging promotion");
assert(
  stagingPromotion.confidence !== undefined,
  "Promotion decision should include confidence"
);

// ver-002 should be allowed to production (HIGH confidence)
const productionPromotion = evaluateVersionForPromotion("ver-002", "production", false);
assertEquals(
  productionPromotion.allowed,
  true,
  "HIGH confidence should allow production promotion"
);

// Test approval rejection blocking (ver-001 has failed policy checks)
const ver001Approval = evaluateVersionForApproval("ver-001", false);
assertEquals(
  ver001Approval.decision,
  "rejected",
  "ver-001 should be rejected due to failed policy checks"
);

const ver001ProductionPromotion = evaluateVersionForPromotion("ver-001", "production", false);
assertEquals(
  ver001ProductionPromotion.allowed,
  false,
  "Rejected approval should block production promotion"
);
assert(
  ver001ProductionPromotion.reason.includes("rejected"),
  "Rejection reason should mention approval rejection"
);

console.log("");

// Test 3: Evidence in audit log
console.log("TEST GROUP: Evidence in Audit Log");
console.log("----------------------------------");

const auditLogBefore = getAllAuditLogEntries().length;

// Perform a promotion to create audit entry
performPromotion("ver-003", "staging");

const auditLogAfter = getAllAuditLogEntries();
const promotionEntry = auditLogAfter.find(
  (e) => e.actionType === "promotion_executed" && e.versionId === "ver-003"
);

assert(promotionEntry !== undefined, "Promotion should create audit entry");
assert(promotionEntry?.evidence !== undefined, "Audit entry should include evidence");
assert(
  promotionEntry?.confidenceScore !== undefined,
  "Audit entry should include confidence score"
);
assert(
  promotionEntry?.confidenceLevel !== undefined,
  "Audit entry should include confidence level"
);
assert(
  typeof promotionEntry?.confidenceScore === "number",
  "Confidence score should be a number"
);
assert(
  promotionEntry?.confidenceScore! >= 0 && promotionEntry?.confidenceScore! <= 100,
  "Confidence score in audit should be 0-100"
);

console.log("");

// Test 4: Rollback with evidence
console.log("TEST GROUP: Rollback Enhancement");
console.log("---------------------------------");

// First promote ver-004 to production
performPromotion("ver-004", "production");

// Rollback to ver-003
const rollbackEvaluation = evaluateVersionForRollback("production", "ver-003", false);

assert(rollbackEvaluation.evidence !== undefined, "Rollback should include evidence");
assert(rollbackEvaluation.confidence !== undefined, "Rollback should include confidence");
assertEquals(rollbackEvaluation.allowed, true, "Rollback to ver-003 should be allowed");

// Perform rollback
const rollbackResult = performRollback("production", "ver-003");
assertEquals(rollbackResult.allowed, true, "Rollback execution should succeed");

const rollbackEntry = getAllAuditLogEntries().find(
  (e) => e.actionType === "rollback_executed" && e.toVersionId === "ver-003"
);

assert(rollbackEntry !== undefined, "Rollback should create audit entry");
assert(rollbackEntry?.evidence !== undefined, "Rollback audit should include evidence");
assert(
  rollbackEntry?.confidenceScore !== undefined,
  "Rollback audit should include confidence score"
);
assert(
  rollbackEntry?.confidenceLevel !== undefined,
  "Rollback audit should include confidence level"
);

console.log("");

// Test 5: Validation errors in approval
console.log("TEST GROUP: Validation Errors");
console.log("------------------------------");

// All current versions should pass validation (no errors)
const ver002Validation = evaluateVersionForApproval("ver-002", false);
assert(
  ver002Validation.validationErrors.length === 0,
  "ver-002 should have no validation errors"
);

const ver003Validation = evaluateVersionForApproval("ver-003", false);
assert(
  ver003Validation.validationErrors.length === 0,
  "ver-003 should have no validation errors"
);

console.log("");

// Test 6: Confidence factor breakdown
console.log("TEST GROUP: Confidence Factors");
console.log("-------------------------------");

const ver004Approval = evaluateVersionForApproval("ver-004", false);
const factors = ver004Approval.confidence.factors;

assert(factors.benchmarkScore >= 0, "Benchmark score factor should be >= 0");
assert(factors.benchmarkScore <= 100, "Benchmark score factor should be <= 100");
assert(factors.policyScore >= 0, "Policy score factor should be >= 0");
assert(factors.policyScore <= 100, "Policy score factor should be <= 100");
assert(factors.dataQualityScore >= 0, "Data quality score factor should be >= 0");
assert(factors.dataQualityScore <= 100, "Data quality score factor should be <= 100");
assert(
  factors.deploymentHistoryBonus >= 0,
  "Deployment history bonus should be >= 0"
);

console.log("");

// Test 7: Evidence detail checks
console.log("TEST GROUP: Evidence Details");
console.log("-----------------------------");

const evidence = ver004Approval.evidence;

assert(
  evidence.benchmarks.totalBenchmarks > 0,
  "Evidence should show total benchmarks"
);
assert(
  evidence.benchmarks.passedBenchmarks >= 0,
  "Evidence should show passed benchmarks"
);
assert(
  evidence.benchmarks.failedBenchmarks >= 0,
  "Evidence should show failed benchmarks"
);
assert(
  evidence.benchmarks.totalBenchmarks ===
    evidence.benchmarks.passedBenchmarks + evidence.benchmarks.failedBenchmarks,
  "Total benchmarks should equal passed + failed"
);

assert(
  evidence.policies.totalPolicyChecks > 0,
  "Evidence should show total policy checks"
);
assert(
  evidence.policies.passedPolicyChecks >= 0,
  "Evidence should show passed policy checks"
);
assert(
  evidence.policies.failedPolicyChecks >= 0,
  "Evidence should show failed policy checks"
);
assert(
  evidence.policies.totalPolicyChecks ===
    evidence.policies.passedPolicyChecks + evidence.policies.failedPolicyChecks,
  "Total policy checks should equal passed + failed"
);

console.log("");

// Test 8: Backward compatibility
console.log("TEST GROUP: Backward Compatibility");
console.log("-----------------------------------");

// Existing fields should still be present
assert(approvalResult.versionId !== undefined, "Should still have versionId");
assert(approvalResult.decision !== undefined, "Should still have decision");
assert(approvalResult.reason !== undefined, "Should still have reason");
assert(
  approvalResult.averageBenchmarkScore !== undefined,
  "Should still have averageBenchmarkScore"
);
assert(approvalResult.benchmarkPassed !== undefined, "Should still have benchmarkPassed");
assert(approvalResult.policyPassed !== undefined, "Should still have policyPassed");
assert(
  approvalResult.failedPolicyChecks !== undefined,
  "Should still have failedPolicyChecks"
);

console.log("");

// Summary
console.log("================================");
console.log("TEST SUMMARY");
console.log("================================");
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.error("\n❌ TESTS FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL TESTS PASSED");
  process.exit(0);
}
