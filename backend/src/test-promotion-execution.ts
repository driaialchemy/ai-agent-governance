import { performPromotion } from "./promotion";
import { getAllAuditLogEntries } from "./auditLog";
import { deploymentState } from "./data/deploymentState";

console.log("PROMOTION EXECUTION TEST");
console.log("========================");
console.log("");

console.log("INITIAL DEPLOYMENT STATE");
console.log("------------------------");
console.log(JSON.stringify(deploymentState, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("TEST 1: SUCCESSFUL PROMOTION");
console.log("----------------------------");
console.log("Promoting ver-004 to staging");
console.log("");

const successfulPromotion = performPromotion("ver-004", "staging");
console.log(JSON.stringify(successfulPromotion, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("DEPLOYMENT STATE AFTER SUCCESSFUL PROMOTION");
console.log("-------------------------------------------");
console.log(JSON.stringify(deploymentState, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("TEST 2: DENIED PROMOTION");
console.log("------------------------");
console.log("Attempting to promote ver-001 to production (should fail - policy check failed)");
console.log("");

const deniedPromotion = performPromotion("ver-001", "production");
console.log(JSON.stringify(deniedPromotion, null, 2));
console.log("");
console.log("==================================================");
console.log("");

console.log("AUDIT LOG ENTRIES - PROMOTION ACTIONS");
console.log("--------------------------------------");

const auditEntries = getAllAuditLogEntries();
const promotionExecutedEntries = auditEntries.filter(
  (entry) => entry.actionType === "promotion_executed"
);

console.log(`Total promotion execution audit entries: ${promotionExecutedEntries.length}`);
console.log("");

for (const entry of promotionExecutedEntries) {
  console.log(JSON.stringify(entry, null, 2));
  console.log("");
}

console.log("ALL AUDIT ENTRIES (INCLUDING EVALUATIONS)");
console.log("-----------------------------------------");
console.log(`Total audit entries: ${auditEntries.length}`);
console.log("");

for (const entry of auditEntries) {
  console.log(JSON.stringify(entry, null, 2));
  console.log("");
}
