// Test confidence scoring
// Run with: npx tsx src/test-confidence.ts

import {
  calculateConfidenceScore,
  meetsConfidenceRequirement,
  CONFIDENCE_THRESHOLDS,
  PROMOTION_REQUIREMENTS
} from "./confidence";
import { buildEvidence } from "./evidenceBuilder";
import { validateAllData } from "./deterministicChecks";
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

console.log("CONFIDENCE SCORING TESTS");
console.log("========================\n");

// Test 1: High confidence (all passed, valid data)
console.log("TEST GROUP: High Confidence");
console.log("---------------------------");

const highConfidenceBenchmarks: BenchmarkResult[] = [
  {
    id: "b1",
    versionId: "ver-test",
    benchmarkName: "Benchmark 1",
    score: 95,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "b2",
    versionId: "ver-test",
    benchmarkName: "Benchmark 2",
    score: 92,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  }
];

const highConfidencePolicies: PolicyCheckResult[] = [
  {
    id: "p1",
    versionId: "ver-test",
    policyName: "Policy 1",
    passed: true,
    severity: "high",
    notes: "All good",
    createdAt: new Date().toISOString()
  },
  {
    id: "p2",
    versionId: "ver-test",
    policyName: "Policy 2",
    passed: true,
    severity: "medium",
    notes: "All good",
    createdAt: new Date().toISOString()
  }
];

const highEvidence = buildEvidence(highConfidenceBenchmarks, highConfidencePolicies);
const highValidation = validateAllData(highConfidenceBenchmarks, highConfidencePolicies);
const highConfidence = calculateConfidenceScore(highEvidence, highValidation);

assert(highConfidence.score >= CONFIDENCE_THRESHOLDS.HIGH, "Should have HIGH confidence score (≥80)");
assert(highConfidence.level === "HIGH", "Should be classified as HIGH");
assert(
  meetsConfidenceRequirement(highConfidence, "production"),
  "HIGH confidence should meet production requirement"
);
assert(
  meetsConfidenceRequirement(highConfidence, "staging"),
  "HIGH confidence should meet staging requirement"
);

console.log("");

// Test 2: Medium confidence (some failures)
console.log("TEST GROUP: Medium Confidence");
console.log("-----------------------------");

const mediumConfidenceBenchmarks: BenchmarkResult[] = [
  {
    id: "b1",
    versionId: "ver-test",
    benchmarkName: "Benchmark 1",
    score: 85,
    maxScore: 100,
    passed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "b2",
    versionId: "ver-test",
    benchmarkName: "Benchmark 2",
    score: 70,
    maxScore: 100,
    passed: false,
    createdAt: new Date().toISOString()
  }
];

const mediumConfidencePolicies: PolicyCheckResult[] = [
  {
    id: "p1",
    versionId: "ver-test",
    policyName: "Policy 1",
    passed: true,
    severity: "high",
    notes: "Passed",
    createdAt: new Date().toISOString()
  },
  {
    id: "p2",
    versionId: "ver-test",
    policyName: "Policy 2",
    passed: false,
    severity: "low",
    notes: "Minor issue",
    createdAt: new Date().toISOString()
  }
];

const mediumEvidence = buildEvidence(mediumConfidenceBenchmarks, mediumConfidencePolicies);
const mediumValidation = validateAllData(mediumConfidenceBenchmarks, mediumConfidencePolicies);
const mediumConfidence = calculateConfidenceScore(mediumEvidence, mediumValidation);

assert(
  mediumConfidence.score >= CONFIDENCE_THRESHOLDS.MEDIUM && mediumConfidence.score < CONFIDENCE_THRESHOLDS.HIGH,
  "Should have MEDIUM confidence score (50-79)"
);
assert(mediumConfidence.level === "MEDIUM", "Should be classified as MEDIUM");
assert(
  !meetsConfidenceRequirement(mediumConfidence, "production"),
  "MEDIUM confidence should NOT meet production requirement"
);
assert(
  meetsConfidenceRequirement(mediumConfidence, "staging"),
  "MEDIUM confidence should meet staging requirement"
);

console.log("");

// Test 3: Low confidence (many failures or high severity failures)
console.log("TEST GROUP: Low Confidence");
console.log("--------------------------");

const lowConfidenceBenchmarks: BenchmarkResult[] = [
  {
    id: "b1",
    versionId: "ver-test",
    benchmarkName: "Benchmark 1",
    score: 60,
    maxScore: 100,
    passed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "b2",
    versionId: "ver-test",
    benchmarkName: "Benchmark 2",
    score: 55,
    maxScore: 100,
    passed: false,
    createdAt: new Date().toISOString()
  }
];

const lowConfidencePolicies: PolicyCheckResult[] = [
  {
    id: "p1",
    versionId: "ver-test",
    policyName: "Policy 1",
    passed: false,
    severity: "high",
    notes: "Critical failure",
    createdAt: new Date().toISOString()
  },
  {
    id: "p2",
    versionId: "ver-test",
    policyName: "Policy 2",
    passed: false,
    severity: "high",
    notes: "Another critical issue",
    createdAt: new Date().toISOString()
  }
];

const lowEvidence = buildEvidence(lowConfidenceBenchmarks, lowConfidencePolicies);
const lowValidation = validateAllData(lowConfidenceBenchmarks, lowConfidencePolicies);
const lowConfidence = calculateConfidenceScore(lowEvidence, lowValidation);

assert(lowConfidence.score < CONFIDENCE_THRESHOLDS.MEDIUM, "Should have LOW confidence score (<50)");
assert(lowConfidence.level === "LOW", "Should be classified as LOW");
assert(
  !meetsConfidenceRequirement(lowConfidence, "production"),
  "LOW confidence should NOT meet production requirement"
);
assert(
  !meetsConfidenceRequirement(lowConfidence, "staging"),
  "LOW confidence should NOT meet staging requirement"
);

console.log("");

// Test 4: Deployment history bonus
console.log("TEST GROUP: Deployment History Bonus");
console.log("-------------------------------------");

const evidenceWithDeployment = buildEvidence(highConfidenceBenchmarks, highConfidencePolicies, {
  previousVersionIds: ["ver-test", "ver-test"],
  versionId: "ver-test"
});

const confidenceWithDeployment = calculateConfidenceScore(evidenceWithDeployment, highValidation);

assert(
  confidenceWithDeployment.factors.deploymentHistoryBonus > 0,
  "Should have deployment history bonus"
);
assert(
  confidenceWithDeployment.score >= highConfidence.score,
  "Deployment history should increase confidence score"
);

console.log("");

// Test 5: Confidence factors
console.log("TEST GROUP: Confidence Factors");
console.log("-------------------------------");

assert(
  highConfidence.factors.benchmarkScore !== undefined,
  "Should include benchmark score factor"
);
assert(
  highConfidence.factors.policyScore !== undefined,
  "Should include policy score factor"
);
assert(
  highConfidence.factors.dataQualityScore !== undefined,
  "Should include data quality score factor"
);
assert(
  highConfidence.factors.deploymentHistoryBonus !== undefined,
  "Should include deployment history bonus factor"
);
assert(
  highConfidence.factors.benchmarkScore >= 0 && highConfidence.factors.benchmarkScore <= 100,
  "Benchmark score should be 0-100"
);
assert(
  highConfidence.factors.policyScore >= 0 && highConfidence.factors.policyScore <= 100,
  "Policy score should be 0-100"
);

console.log("");

// Test 6: Thresholds
console.log("TEST GROUP: Confidence Thresholds");
console.log("----------------------------------");

assert(CONFIDENCE_THRESHOLDS.HIGH === 80, "HIGH threshold should be 80");
assert(CONFIDENCE_THRESHOLDS.MEDIUM === 50, "MEDIUM threshold should be 50");
assert(
  PROMOTION_REQUIREMENTS.production === 80,
  "Production should require HIGH confidence (80)"
);
assert(
  PROMOTION_REQUIREMENTS.staging === 50,
  "Staging should require MEDIUM confidence (50)"
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
