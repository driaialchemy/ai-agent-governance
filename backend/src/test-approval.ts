import { getAllAgentVersions } from "./lib/registryLookup";
import { evaluateVersionForApproval } from "./approval";

const versions = getAllAgentVersions();

console.log("APPROVAL TEST RESULTS");
console.log("=====================");

for (const version of versions) {
  const result = evaluateVersionForApproval(version.id);
  console.log(JSON.stringify(result, null, 2));
}