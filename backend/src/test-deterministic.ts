// Test deterministic validation checks
// Run with: npx tsx src/test-deterministic.ts

import {
  validateBenchmarkData,
  validatePolicyCheckData,
  validateDataFreshness,
  validateAllData
} from "./deterministicChecks";
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

console.log("DETERMINISTIC VALIDATION TESTS");
console.log("================================\n");

// Test 1: Missing benchmark data
console.log("TEST GROUP: Benchmark Validation");
console.log("---------------------------------");

const noBenchmarks: BenchmarkResult[] = [];
const noBenchmarksResult = validateBenchmarkData(noBenchmarks);
assert(!noBenchmarksResult.passed, "Empty benchmarks should fail validation");
assert(
  noBenchmarksResult.errors.some((e) => e.includes("No benchmark data")),
  "Should report missing benchmark data"
);

// Test 2: Invalid score range
const invalidScoreBenchmarks: BenchmarkResult[] = [
  {
    id: "bench-test-1",
    versionId: "ver-test",
    benchmarkName: "Test Benchmark",
    score: 150,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  }
];
const invalidScoreResult = validateBenchmarkData(invalidScoreBenchmarks);
assert(!invalidScoreResult.passed, "Invalid score should fail validation");
assert(
  invalidScoreResult.errors.some((e) => e.includes("invalid score")),
  "Should report invalid score range"
);

// Test 3: Valid benchmarks
const validBenchmarks: BenchmarkResult[] = [
  {
    id: "bench-test-2",
    versionId: "ver-test",
    benchmarkName: "Valid Benchmark",
    score: 85,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  }
];
const validBenchmarkResult = validateBenchmarkData(validBenchmarks);
assert(validBenchmarkResult.passed, "Valid benchmarks should pass validation");
assert(validBenchmarkResult.errors.length === 0, "Valid benchmarks should have no errors");

console.log("");

// Test 4: Missing policy data
console.log("TEST GROUP: Policy Validation");
console.log("------------------------------");

const noPolicies: PolicyCheckResult[] = [];
const noPoliciesResult = validatePolicyCheckData(noPolicies);
assert(!noPoliciesResult.passed, "Empty policy checks should fail validation");
assert(
  noPoliciesResult.errors.some((e) => e.includes("No policy check data")),
  "Should report missing policy data"
);

// Test 5: Invalid severity
const invalidSeverityPolicies: PolicyCheckResult[] = [
  {
    id: "policy-test-1",
    versionId: "ver-test",
    policyName: "Test Policy",
    passed: true,
    severity: "critical" as any, // Invalid severity
    notes: "Test notes",
    createdAt: new Date().toISOString()
  }
];
const invalidSeverityResult = validatePolicyCheckData(invalidSeverityPolicies);
assert(!invalidSeverityResult.passed, "Invalid severity should fail validation");
assert(
  invalidSeverityResult.errors.some((e) => e.includes("invalid severity")),
  "Should report invalid severity"
);

// Test 6: Valid policies
const validPolicies: PolicyCheckResult[] = [
  {
    id: "policy-test-2",
    versionId: "ver-test",
    policyName: "Valid Policy",
    passed: true,
    severity: "high",
    notes: "All good",
    createdAt: new Date().toISOString()
  }
];
const validPolicyResult = validatePolicyCheckData(validPolicies);
assert(validPolicyResult.passed, "Valid policy checks should pass validation");
assert(validPolicyResult.errors.length === 0, "Valid policies should have no errors");

console.log("");

// Test 7: Data freshness
console.log("TEST GROUP: Data Freshness");
console.log("--------------------------");

const staleBenchmarks: BenchmarkResult[] = [
  {
    id: "bench-test-3",
    versionId: "ver-test",
    benchmarkName: "Stale Benchmark",
    score: 85,
    maxScore: 100,
    passed: true,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days ago
  }
];
const stalePolicies: PolicyCheckResult[] = [];
const staleResult = validateDataFreshness(staleBenchmarks, stalePolicies);
assert(!staleResult.passed, "Stale data should fail freshness check");
assert(
  staleResult.errors.some((e) => e.includes("stale")),
  "Should report stale data"
);

const freshBenchmarks: BenchmarkResult[] = [
  {
    id: "bench-test-4",
    versionId: "ver-test",
    benchmarkName: "Fresh Benchmark",
    score: 85,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  }
];
const freshPolicies: PolicyCheckResult[] = [
  {
    id: "policy-test-3",
    versionId: "ver-test",
    policyName: "Fresh Policy",
    passed: true,
    severity: "high",
    notes: "Recent check",
    createdAt: new Date().toISOString()
  }
];
const freshResult = validateDataFreshness(freshBenchmarks, freshPolicies);
assert(freshResult.passed, "Fresh data should pass freshness check");

console.log("");

// Test 8: Combined validation
console.log("TEST GROUP: Combined Validation");
console.log("--------------------------------");

const allValidResult = validateAllData(validBenchmarks, validPolicies);
assert(allValidResult.passed, "All valid data should pass combined validation");

const mixedInvalidResult = validateAllData(invalidScoreBenchmarks, validPolicies);
assert(!mixedInvalidResult.passed, "Mixed invalid data should fail combined validation");

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
