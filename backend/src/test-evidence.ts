// Test evidence builder
// Run with: npx tsx src/test-evidence.ts

import {
  buildBenchmarkEvidence,
  buildPolicyEvidence,
  buildDeploymentEvidence,
  buildEvidence
} from "./evidenceBuilder";
import { BenchmarkResult } from "./data/benchmarks";
import { PolicyCheckResult } from "./data/policyChecks";

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

console.log("EVIDENCE BUILDER TESTS");
console.log("======================\n");

// Test 1: Benchmark evidence
console.log("TEST GROUP: Benchmark Evidence");
console.log("-------------------------------");

const benchmarks: BenchmarkResult[] = [
  {
    id: "bench-1",
    versionId: "ver-test",
    benchmarkName: "Benchmark 1",
    score: 90,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "bench-2",
    versionId: "ver-test",
    benchmarkName: "Benchmark 2",
    score: 75,
    maxScore: 100,
    passed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "bench-3",
    versionId: "ver-test",
    benchmarkName: "Benchmark 3",
    score: 85,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  }
];

const benchmarkEvidence = buildBenchmarkEvidence(benchmarks);

assert(benchmarkEvidence.totalBenchmarks === 3, "Should count all benchmarks");
assert(benchmarkEvidence.passedBenchmarks === 2, "Should count passed benchmarks");
assert(benchmarkEvidence.failedBenchmarks === 1, "Should count failed benchmarks");
assert(
  benchmarkEvidence.averageScore === (90 + 75 + 85) / 3,
  "Should calculate correct average score"
);
assert(
  benchmarkEvidence.benchmarkDetails.length === 3,
  "Should include all benchmark details"
);

console.log("");

// Test 2: Policy evidence
console.log("TEST GROUP: Policy Evidence");
console.log("----------------------------");

const policies: PolicyCheckResult[] = [
  {
    id: "policy-1",
    versionId: "ver-test",
    policyName: "Policy 1",
    passed: true,
    severity: "high",
    notes: "Passed",
    createdAt: new Date().toISOString()
  },
  {
    id: "policy-2",
    versionId: "ver-test",
    policyName: "Policy 2",
    passed: false,
    severity: "high",
    notes: "Failed high severity",
    createdAt: new Date().toISOString()
  },
  {
    id: "policy-3",
    versionId: "ver-test",
    policyName: "Policy 3",
    passed: false,
    severity: "medium",
    notes: "Failed medium severity",
    createdAt: new Date().toISOString()
  }
];

const policyEvidence = buildPolicyEvidence(policies);

assert(policyEvidence.totalPolicyChecks === 3, "Should count all policy checks");
assert(policyEvidence.passedPolicyChecks === 1, "Should count passed policy checks");
assert(policyEvidence.failedPolicyChecks === 2, "Should count failed policy checks");
assert(
  policyEvidence.highSeverityFailures === 1,
  "Should count high severity failures"
);
assert(
  policyEvidence.failedCheckDetails.length === 2,
  "Should include all failed check details"
);
assert(
  policyEvidence.failedCheckDetails[0]!.name === "Policy 2",
  "Should include correct failed check name"
);

console.log("");

// Test 3: Deployment evidence
console.log("TEST GROUP: Deployment Evidence");
console.log("--------------------------------");

const previousVersions = ["ver-001", "ver-002", "ver-001", "ver-003"];
const deploymentEvidence = buildDeploymentEvidence(previousVersions, "ver-001");

assert(
  deploymentEvidence.wasDeployedBefore === true,
  "Should detect previously deployed version"
);
assert(
  deploymentEvidence.deploymentCount === 2,
  "Should count correct number of deployments"
);

const newVersionEvidence = buildDeploymentEvidence(previousVersions, "ver-999");
assert(
  newVersionEvidence.wasDeployedBefore === false,
  "Should detect new version"
);
assert(
  newVersionEvidence.deploymentCount === 0,
  "Should show zero deployments for new version"
);

console.log("");

// Test 4: Combined evidence
console.log("TEST GROUP: Combined Evidence");
console.log("------------------------------");

const combinedEvidence = buildEvidence(benchmarks, policies, {
  previousVersionIds: previousVersions,
  versionId: "ver-001"
});

assert(combinedEvidence.benchmarks !== undefined, "Should include benchmark evidence");
assert(combinedEvidence.policies !== undefined, "Should include policy evidence");
assert(combinedEvidence.deployment !== undefined, "Should include deployment evidence");
assert(combinedEvidence.collectedAt !== undefined, "Should include collection timestamp");
assert(
  combinedEvidence.benchmarks.totalBenchmarks === 3,
  "Combined evidence should have correct benchmark count"
);
assert(
  combinedEvidence.policies.totalPolicyChecks === 3,
  "Combined evidence should have correct policy count"
);
assert(
  combinedEvidence.deployment?.wasDeployedBefore === true,
  "Combined evidence should have deployment info"
);

console.log("");

// Test 5: Evidence without deployment info
console.log("TEST GROUP: Evidence Without Deployment");
console.log("----------------------------------------");

const evidenceNoDeployment = buildEvidence(benchmarks, policies);

assert(
  evidenceNoDeployment.deployment === undefined,
  "Should not include deployment evidence when not provided"
);
assert(
  evidenceNoDeployment.benchmarks !== undefined,
  "Should still include benchmark evidence"
);
assert(
  evidenceNoDeployment.policies !== undefined,
  "Should still include policy evidence"
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
