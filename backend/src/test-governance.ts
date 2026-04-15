// Minimal assertive tests for governance workflow
// Run with: npx tsx src/test-governance.ts

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

console.log("GOVERNANCE WORKFLOW TESTS");
console.log("=========================\n");

// Test 1: Approval evaluation
console.log("TEST GROUP: Approval Evaluation");
console.log("--------------------------------");

const approvedVersion = evaluateVersionForApproval("ver-002", false);
assertEquals(approvedVersion.decision, "approved", "ver-002 should be approved");
assertEquals(approvedVersion.benchmarkPassed, true, "ver-002 benchmarks should pass");
assertEquals(approvedVersion.policyPassed, true, "ver-002 policies should pass");

const rejectedVersion = evaluateVersionForApproval("ver-001", false);
assertEquals(rejectedVersion.decision, "rejected", "ver-001 should be rejected");
assertEquals(rejectedVersion.policyPassed, false, "ver-001 policies should fail");
assert(rejectedVersion.failedPolicyChecks.length > 0, "ver-001 should have failed checks");

console.log("");

// Test 2: Promotion evaluation and execution
console.log("TEST GROUP: Promotion");
console.log("---------------------");

// Clear audit log for this test
const auditLogBefore = getAllAuditLogEntries().length;

// Test evaluation (should NOT log to audit with logEvaluation=false)
const promotionEval = evaluateVersionForPromotion("ver-002", "staging", false);
assertEquals(promotionEval.allowed, true, "ver-002 promotion to staging should be allowed");

const auditAfterEval = getAllAuditLogEntries().length;
assertEquals(auditAfterEval, auditLogBefore, "GET-style evaluation should not create audit entries");

// Test execution (should log both evaluation and execution)
const initialStagingVersion = deploymentState.find(d => d.environment === "staging")?.currentVersionId;

const promotionResult = performPromotion("ver-002", "staging");
assertEquals(promotionResult.allowed, true, "ver-002 promotion execution should succeed");

const finalStagingVersion = deploymentState.find(d => d.environment === "staging")?.currentVersionId;
assertEquals(finalStagingVersion, "ver-002", "staging should now have ver-002 deployed");

const auditAfterExec = getAllAuditLogEntries();
const promotionExecutedEntry = auditAfterExec.find(e => e.actionType === "promotion_executed");
assert(promotionExecutedEntry !== undefined, "promotion execution should create audit entry");
assert(promotionExecutedEntry?.fromVersionId !== undefined, "promotion audit should include fromVersionId");
assertEquals(promotionExecutedEntry?.toVersionId, "ver-002", "promotion audit should have correct toVersionId");

console.log("");

// Test 3: Rollback evaluation and execution
console.log("TEST GROUP: Rollback");
console.log("--------------------");

// First promote ver-003 to production so we have history to rollback from
performPromotion("ver-003", "production");
const prodAfterPromotion = deploymentState.find(d => d.environment === "production")?.currentVersionId;
assertEquals(prodAfterPromotion, "ver-003", "production should have ver-003");

const auditBeforeRollback = getAllAuditLogEntries().length;

// Test rollback evaluation (should NOT log with logEvaluation=false)
const rollbackEval = evaluateVersionForRollback("production", "ver-002", false);
assertEquals(rollbackEval.allowed, true, "rollback to ver-002 should be allowed");

const auditAfterRollbackEval = getAllAuditLogEntries().length;
assertEquals(auditAfterRollbackEval, auditBeforeRollback, "GET-style rollback evaluation should not create audit entries");

// Test rollback execution (should log both evaluation and execution)
const rollbackResult = performRollback("production", "ver-002");
assertEquals(rollbackResult.allowed, true, "rollback execution should succeed");

const prodAfterRollback = deploymentState.find(d => d.environment === "production")?.currentVersionId;
assertEquals(prodAfterRollback, "ver-002", "production should be rolled back to ver-002");

const auditAfterRollbackExec = getAllAuditLogEntries();
const rollbackExecutedEntry = auditAfterRollbackExec.find(e => e.actionType === "rollback_executed");
assert(rollbackExecutedEntry !== undefined, "rollback execution should create audit entry");
assertEquals(rollbackExecutedEntry?.fromVersionId, "ver-003", "rollback audit should have correct fromVersionId");
assertEquals(rollbackExecutedEntry?.toVersionId, "ver-002", "rollback audit should have correct toVersionId");

console.log("");

// Test 4: Audit logging
console.log("TEST GROUP: Audit Logging");
console.log("-------------------------");

const allAuditEntries = getAllAuditLogEntries();
assert(allAuditEntries.length > 0, "audit log should contain entries");

const hasEvaluatedEntries = allAuditEntries.some(e => e.actionType.includes("_evaluated"));
const hasExecutedEntries = allAuditEntries.some(e => e.actionType.includes("_executed"));

assert(hasEvaluatedEntries, "audit log should contain evaluation entries");
assert(hasExecutedEntries, "audit log should contain execution entries");

const promotionExecutedEntries = allAuditEntries.filter(e => e.actionType === "promotion_executed");
const rollbackExecutedEntries = allAuditEntries.filter(e => e.actionType === "rollback_executed");

assert(promotionExecutedEntries.length > 0, "audit log should contain promotion_executed entries");
assert(rollbackExecutedEntries.length > 0, "audit log should contain rollback_executed entries");

console.log("");

// Test 5: Denied promotion
console.log("TEST GROUP: Denied Actions");
console.log("--------------------------");

const deniedPromotion = performPromotion("ver-001", "production");
assertEquals(deniedPromotion.allowed, false, "ver-001 promotion should be denied");
assert(deniedPromotion.reason.includes("rejected"), "denied promotion should include reason");

console.log("");

// Summary
console.log("=========================");
console.log("TEST SUMMARY");
console.log("=========================");
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
