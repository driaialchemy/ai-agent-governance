import { evaluateVersionForRollback } from "./rollback";
import { getAllAuditLogEntries } from "./auditLog";
import { getCurrentDeployedVersionId } from "./data/deploymentState";

console.log("ROLLBACK TEST RESULTS");
console.log("=====================");
console.log("");

console.log("INITIAL STATE");
console.log("-------------");
console.log("Staging current version:", getCurrentDeployedVersionId("staging"));
console.log("Production current version:", getCurrentDeployedVersionId("production"));
console.log("");
console.log("==================================================");
console.log("");

console.log("TEST 1: SUCCESSFUL ROLLBACK");
console.log("----------------------------");
console.log("Attempting to rollback production from ver-003 to ver-002");
console.log("");

const successfulRollback = evaluateVersionForRollback("production", "ver-002");
console.log(JSON.stringify(successfulRollback, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("TEST 2: DENIED ROLLBACK - NEVER DEPLOYED");
console.log("-----------------------------------------");
console.log("Attempting to rollback production to ver-001 (never deployed there)");
console.log("");

const neverDeployedRollback = evaluateVersionForRollback("production", "ver-001");
console.log(JSON.stringify(neverDeployedRollback, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("TEST 3: DENIED ROLLBACK - SAME VERSION");
console.log("---------------------------------------");
console.log("Attempting to rollback production to ver-003 (already deployed)");
console.log("");

const sameVersionRollback = evaluateVersionForRollback("production", "ver-003");
console.log(JSON.stringify(sameVersionRollback, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("TEST 4: DENIED ROLLBACK - NEVER DEPLOYED (SAME AGENT)");
console.log("------------------------------------------------------");
console.log("Attempting to rollback production to ver-004 (same agent, never deployed)");
console.log("");

const neverDeployedSameAgentRollback = evaluateVersionForRollback("production", "ver-004");
console.log(JSON.stringify(neverDeployedSameAgentRollback, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("TEST 5: DENIED ROLLBACK - DIFFERENT AGENT");
console.log("------------------------------------------");
console.log("Attempting to rollback staging to ver-002 (different agent)");
console.log("");

const differentAgentRollback = evaluateVersionForRollback("staging", "ver-002");
console.log(JSON.stringify(differentAgentRollback, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("AUDIT LOG ENTRIES");
console.log("-----------------");

const auditEntries = getAllAuditLogEntries();
const rollbackEntries = auditEntries.filter(
  (entry) => entry.actionType === "rollback_evaluated"
);

console.log(`Total rollback audit entries: ${rollbackEntries.length}`);
console.log("");

for (const entry of rollbackEntries) {
  console.log(JSON.stringify(entry, null, 2));
  console.log("");
}
