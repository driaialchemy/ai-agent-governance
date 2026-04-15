import { getAllAgentVersions } from "./lib/registryLookup";
import { evaluateVersionForApproval } from "./approval";
import { evaluateVersionForPromotion } from "./promotion";
import { getAllAuditLogEntries } from "./auditLog";

const versions = getAllAgentVersions();

console.log("RUNNING AUDIT LOG TEST");
console.log("======================");
console.log("");

for (const version of versions) {
  evaluateVersionForApproval(version.id);
  evaluateVersionForPromotion(version.id, "staging");
  evaluateVersionForPromotion(version.id, "production");
}

console.log("AUDIT LOG ENTRIES");
console.log("=================");
console.log(JSON.stringify(getAllAuditLogEntries(), null, 2));