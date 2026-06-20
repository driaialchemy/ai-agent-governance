// Demo scenario tests for dashboard-ready synthetic governance data
// Run with: npx tsx src/test-demo-scenarios.ts

import { evaluateVersionForApproval } from "./approval";
import { evaluateVersionForPromotion, performPromotion } from "./promotion";
import { evaluateVersionForRollback, performRollback } from "./rollback";
import { getAllAuditLogEntries } from "./auditLog";
import {
  validateSpecForVersion,
  validateSpecForPromotion,
  validateSpecForRollback
} from "./lib/specValidation";

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

console.log("DEMO SCENARIO TESTS");
console.log("===================\n");

// 1. Spec validation passes
console.log("SCENARIO 1: Spec validation passes");
const specPass = validateSpecForVersion("ver-101");
assertEquals(specPass.outcome, "passed", "ver-101 spec validation passes");
console.log("");

// 2. Spec validation fails - prohibited capability
console.log("SCENARIO 2: Spec validation fails (prohibited capability)");
const specFail = validateSpecForVersion("ver-102");
assertEquals(specFail.allowed, false, "ver-102 spec validation fails");
assert(
  specFail.reasons.some((reason) => reason.includes("delete_files")),
  "ver-102 failure mentions delete_files"
);
console.log("");

// 3. Missing spec
console.log("SCENARIO 3: Missing spec");
const missingSpec = validateSpecForVersion("ver-103");
assertEquals(missingSpec.outcome, "missing_spec", "ver-103 returns missing_spec");
const missingApproval = evaluateVersionForApproval("ver-103", false);
assertEquals(
  missingApproval.decision,
  "blocked_pending_remediation",
  "ver-103 approval blocked without spec"
);
console.log("");

// 4. Approval succeeds
console.log("SCENARIO 4: Approval succeeds");
const approved = evaluateVersionForApproval("ver-101", false);
assertEquals(approved.decision, "approved", "ver-101 is approved");
console.log("");

// 5. Approval blocked - missing benchmarks
console.log("SCENARIO 5: Approval blocked (missing benchmarks)");
const blockedBench = evaluateVersionForApproval("ver-202", false);
assertEquals(
  blockedBench.decision,
  "blocked_pending_remediation",
  "ver-202 blocked pending remediation"
);
assert(
  blockedBench.reason.includes("benchmark") ||
    blockedBench.reason.includes("Benchmark"),
  "ver-202 reason mentions missing benchmark data or spec benchmark requirement"
);
console.log("");

// 6. Approval rejected - policy failure
console.log("SCENARIO 6: Approval rejected (policy failure)");
const rejected = evaluateVersionForApproval("ver-203", false);
assertEquals(rejected.decision, "rejected", "ver-203 is rejected");
assert(rejected.reason.includes("policy"), "ver-203 reason mentions policy failure");
console.log("");

// 7. Promotion to staging succeeds
console.log("SCENARIO 7: Promotion to staging succeeds");
const stagingPromo = evaluateVersionForPromotion("ver-101", "staging", false);
assertEquals(stagingPromo.allowed, true, "ver-101 staging promotion allowed");
console.log("");

// 8. Production fails - prior staging required
console.log("SCENARIO 8: Production fails (prior staging required)");
const priorStaging = validateSpecForPromotion("ver-302", "production");
assertEquals(priorStaging.allowed, false, "ver-302 production requires prior staging");
assert(
  priorStaging.reasons.some((reason) => reason.includes("prior staging")),
  "ver-302 reason mentions prior staging"
);
console.log("");

// 8b. Production fails - human approval required
console.log("SCENARIO 8b: Production fails (human approval required)");
const humanApproval = validateSpecForPromotion("ver-201", "production");
assertEquals(humanApproval.allowed, false, "ver-201 production requires human approval");
assert(
  humanApproval.reasons.some((reason) => reason.includes("human approval")),
  "ver-201 reason mentions human approval"
);
const stagingContract = evaluateVersionForPromotion("ver-201", "staging", false);
assertEquals(stagingContract.allowed, true, "ver-201 staging promotion still allowed");
console.log("");

// 9. Rollback succeeds
console.log("SCENARIO 9: Rollback succeeds");
const rollbackOk = evaluateVersionForRollback("production", "ver-002", false);
assertEquals(rollbackOk.allowed, true, "rollback to ver-002 allowed");
console.log("");

// 10. Rollback fails
console.log("SCENARIO 10: Rollback fails");
const rollbackInvalidTarget = evaluateVersionForRollback("production", "ver-103", false);
assertEquals(rollbackInvalidTarget.allowed, false, "rollback to ver-103 denied");
const rollbackBadSpec = validateSpecForRollback("ver-303", "production");
assertEquals(rollbackBadSpec.allowed, false, "ver-303 rollback denied by spec");
const rollbackNeverDeployed = evaluateVersionForRollback("production", "ver-301", false);
assertEquals(
  rollbackNeverDeployed.allowed,
  false,
  "rollback to ver-301 denied when never deployed"
);
console.log("");

// 11. Audit log after POST actions
console.log("SCENARIO 11: Audit log after POST promotion and rollback");
const auditBefore = getAllAuditLogEntries().length;
const promoExec = performPromotion("ver-101", "staging");
assertEquals(promoExec.allowed, true, "ver-101 staging promotion executes");
const rollbackExec = performRollback("production", "ver-002");
assertEquals(rollbackExec.allowed, true, "production rollback executes");
const auditAfter = getAllAuditLogEntries();
assert(auditAfter.length > auditBefore, "audit log grows after POST actions");
assert(
  auditAfter.some((entry) => entry.actionType === "promotion_executed"),
  "audit log contains promotion_executed"
);
assert(
  auditAfter.some((entry) => entry.actionType === "rollback_executed"),
  "audit log contains rollback_executed"
);
console.log("");

// Incident triage classify-only approval
console.log("BONUS: Incident classify-only approval");
const incidentApproved = evaluateVersionForApproval("ver-301", false);
assertEquals(incidentApproved.decision, "approved", "ver-301 classify-only approved");
const incidentSpecFail = validateSpecForVersion("ver-303");
assertEquals(incidentSpecFail.allowed, false, "ver-303 spec fails on change_permissions");
console.log("");

console.log("===================");
console.log("TEST SUMMARY");
console.log("===================");
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.error("\n❌ DEMO SCENARIO TESTS FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL DEMO SCENARIO TESTS PASSED");
  process.exit(0);
}
