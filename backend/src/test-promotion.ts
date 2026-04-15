import { getAllAgentVersions } from "./lib/registryLookup";
import { evaluateVersionForPromotion } from "./promotion";

const versions = getAllAgentVersions();

console.log("PROMOTION TEST RESULTS");
console.log("======================");
console.log("");

for (const version of versions) {
  const stagingResult = evaluateVersionForPromotion(version.id, "staging");
  const productionResult = evaluateVersionForPromotion(version.id, "production");

  console.log("STAGING:");
  console.log(JSON.stringify(stagingResult, null, 2));
  console.log("");

  console.log("PRODUCTION:");
  console.log(JSON.stringify(productionResult, null, 2));
  console.log("");
  console.log("--------------------------------------------------");
}