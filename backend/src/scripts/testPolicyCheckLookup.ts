import {
  getAllPolicyCheckResults,
  getPolicyCheckResultsByVersionId,
  didVersionPassPolicyChecks,
  getFailedPolicyChecksByVersionId
} from "../lib/policyCheckLookup";

console.log("TEST 1: All policy check results");
console.log(JSON.stringify(getAllPolicyCheckResults(), null, 2));
console.log("");

console.log("TEST 2: Policy checks for ver-001");
console.log(JSON.stringify(getPolicyCheckResultsByVersionId("ver-001"), null, 2));
console.log("");

console.log("TEST 3: Did ver-001 pass all policy checks?");
console.log(didVersionPassPolicyChecks("ver-001"));
console.log("");

console.log("TEST 4: Failed policy checks for ver-001");
console.log(JSON.stringify(getFailedPolicyChecksByVersionId("ver-001"), null, 2));
console.log("");

console.log("TEST 5: Policy checks for ver-002");
console.log(JSON.stringify(getPolicyCheckResultsByVersionId("ver-002"), null, 2));
console.log("");

console.log("TEST 6: Did ver-002 pass all policy checks?");
console.log(didVersionPassPolicyChecks("ver-002"));
console.log("");

console.log("TEST 7: Failed policy checks for ver-002");
console.log(JSON.stringify(getFailedPolicyChecksByVersionId("ver-002"), null, 2));
console.log("");