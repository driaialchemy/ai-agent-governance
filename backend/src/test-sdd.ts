// Spec-Driven Development (SDD) governance tests
// Run with: npx tsx src/test-sdd.ts

import { evaluateVersionForApproval } from "./approval";
import { evaluateVersionForPromotion } from "./promotion";
import { evaluateVersionForRollback } from "./rollback";
import { getAllAuditLogEntries } from "./auditLog";
import {
  getAllGovernanceSpecs,
  getGovernanceSpecById,
  getGovernanceSpecForVersion,
  getGovernanceSpecsForAgent
} from "./lib/specLookup";
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

console.log("SPEC-DRIVEN GOVERNANCE TESTS");
console.log("============================\n");

// Test 1: Valid governance spec passes validation
console.log("TEST GROUP: Spec Validation");
console.log("---------------------------");

const validSpecResult = validateSpecForVersion("ver-002");
assertEquals(validSpecResult.outcome, "passed", "ver-002 spec validation should pass");
assertEquals(validSpecResult.allowed, true, "ver-002 spec validation should be allowed");
assertEquals(validSpecResult.specId, "spec-002", "ver-002 should use spec-002");

console.log("");

// Test 2: Missing spec returns missing_spec
const missingSpecResult = validateSpecForVersion("ver-004");
assertEquals(missingSpecResult.outcome, "missing_spec", "ver-004 should return missing_spec");
assertEquals(missingSpecResult.allowed, false, "ver-004 spec validation should not be allowed");
assert(
  missingSpecResult.reasons.some((reason) => reason.includes("ver-004")),
  "missing spec reason should mention ver-004"
);

console.log("");

// Test 3: Missing spec blocks approval
const missingSpecApproval = evaluateVersionForApproval("ver-004", false);
assertEquals(
  missingSpecApproval.decision,
  "blocked_pending_remediation",
  "ver-004 approval should be blocked_pending_remediation without spec"
);
assert(
  missingSpecApproval.reason.includes("No governance spec found"),
  "blocked approval should mention missing spec"
);

console.log("");

// Test 4: Restrictive spec fails validation for disallowed promotion
const restrictivePromotion = validateSpecForPromotion("ver-001", "production");
assertEquals(restrictivePromotion.outcome, "failed", "ver-001 production promotion spec check should fail");
assertEquals(restrictivePromotion.allowed, false, "ver-001 production promotion should not be allowed");
assert(
  restrictivePromotion.reasons.some((reason) => reason.includes("production")),
  "restrictive spec reason should mention production"
);

console.log("");

// Test 5: Promotion to disallowed environment fails
const disallowedPromotion = evaluateVersionForPromotion("ver-001", "production", false);
assertEquals(disallowedPromotion.allowed, false, "ver-001 promotion to production should be denied");
assert(
  disallowedPromotion.reason.includes("production") ||
    disallowedPromotion.reason.includes("approval"),
  "denied promotion should include environment or approval reason"
);

console.log("");

// Test 6: Production promotion fails when prior staging required
const priorStagingCheck = validateSpecForPromotion("ver-002", "production");
assertEquals(priorStagingCheck.allowed, false, "ver-002 production should require prior staging");
assert(
  priorStagingCheck.reasons.some((reason) => reason.includes("prior staging")),
  "prior staging reason should be present"
);

console.log("");

// Test 7: Rollback fails when spec disallows rollback
const rollbackSpecCheck = validateSpecForRollback("ver-003", "production");
assertEquals(rollbackSpecCheck.allowed, false, "ver-003 rollback should be denied by spec");
assert(
  rollbackSpecCheck.reasons.some((reason) => reason.includes("does not allow rollback")),
  "rollback denial should mention rollback not allowed"
);

const rollbackEval = evaluateVersionForRollback("production", "ver-003", false);
assertEquals(rollbackEval.allowed, false, "rollback evaluation to ver-003 should be denied");

console.log("");

// Test 8: Spec lookup functions
console.log("TEST GROUP: Spec Lookup");
console.log("-----------------------");

const allSpecs = getAllGovernanceSpecs();
assert(allSpecs.length >= 3, "should have at least 3 governance specs");

const specById = getGovernanceSpecById("spec-002");
assert(specById !== undefined, "getGovernanceSpecById should find spec-002");
assertEquals(specById?.versionId, "ver-002", "spec-002 should belong to ver-002");

const specForVersion = getGovernanceSpecForVersion("ver-003");
assertEquals(specForVersion?.specId, "spec-003", "ver-003 should map to spec-003");

const agentSpecs = getGovernanceSpecsForAgent("agent-002");
assert(agentSpecs.length >= 2, "agent-002 should have at least 2 specs");

assert(getGovernanceSpecById("spec-missing") === undefined, "unknown spec id should return undefined");
assert(getGovernanceSpecForVersion("ver-004") === undefined, "ver-004 should have no spec");

console.log("");

// Test 9: Spec data shape sanity check (API pattern uses same lookup functions)
console.log("TEST GROUP: Spec Data Access");
console.log("----------------------------");

assert(
  allSpecs.every((spec) => spec.requiredBenchmarkIds.length > 0),
  "all specs should define required benchmarks"
);
assert(
  allSpecs.every((spec) => spec.allowedEnvironments.length > 0),
  "all specs should define allowed environments"
);

console.log("");

// Test 10: GET-style spec validation does not mutate audit logs
console.log("TEST GROUP: Read-Only Spec Validation");
console.log("-------------------------------------");

const auditBeforeValidation = getAllAuditLogEntries().length;
validateSpecForVersion("ver-002");
validateSpecForVersion("ver-004");
evaluateVersionForApproval("ver-002", false);
evaluateVersionForPromotion("ver-002", "staging", false);

const auditAfterValidation = getAllAuditLogEntries().length;
assertEquals(
  auditAfterValidation,
  auditBeforeValidation,
  "spec validation with logEvaluation=false should not mutate audit log"
);

console.log("");

// Summary
console.log("============================");
console.log("TEST SUMMARY");
console.log("============================");
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.error("\n❌ SDD TESTS FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL SDD TESTS PASSED");
  process.exit(0);
}
