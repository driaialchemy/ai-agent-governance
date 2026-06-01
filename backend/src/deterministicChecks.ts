// Deterministic validation checks
// Hard gates that fail on missing data, invalid ranges, or contradictory state

import { BenchmarkResult } from "./data/benchmarks";
import { PolicyCheckResult } from "./data/policyChecks";

export interface ValidationResult {
  passed: boolean;
  errors: string[];
}

export function validateBenchmarkData(benchmarks: BenchmarkResult[]): ValidationResult {
  const errors: string[] = [];

  if (benchmarks.length === 0) {
    errors.push("No benchmark data exists for this version");
  }

  for (const benchmark of benchmarks) {
    // Check score is within valid range
    if (benchmark.score < 0 || benchmark.score > benchmark.maxScore) {
      errors.push(
        `Benchmark '${benchmark.benchmarkName}' has invalid score: ${benchmark.score} (max: ${benchmark.maxScore})`
      );
    }

    // Check maxScore is positive
    if (benchmark.maxScore <= 0) {
      errors.push(
        `Benchmark '${benchmark.benchmarkName}' has invalid maxScore: ${benchmark.maxScore}`
      );
    }

    // Check passed flag is consistent with score (80% threshold)
    const passThreshold = benchmark.maxScore * 0.8;
    const expectedPass = benchmark.score >= passThreshold;

    if (benchmark.passed && !expectedPass) {
      errors.push(
        `Benchmark '${benchmark.benchmarkName}' marked as passed but score ${benchmark.score} is below threshold (${passThreshold})`
      );
    }

    if (!benchmark.passed && expectedPass) {
      errors.push(
        `Benchmark '${benchmark.benchmarkName}' marked as failed but score ${benchmark.score} meets/exceeds threshold (${passThreshold})`
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

export function validatePolicyCheckData(policyChecks: PolicyCheckResult[]): ValidationResult {
  const errors: string[] = [];

  if (policyChecks.length === 0) {
    errors.push("No policy check data exists for this version");
  }

  for (const check of policyChecks) {
    // Check severity is valid
    if (!["low", "medium", "high"].includes(check.severity)) {
      errors.push(
        `Policy check '${check.policyName}' has invalid severity: ${check.severity}`
      );
    }

    // Check that failed high-severity checks have meaningful notes
    if (!check.passed && check.severity === "high" && (!check.notes || check.notes.trim().length === 0)) {
      errors.push(
        `Policy check '${check.policyName}' failed with high severity but has no notes`
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

export function validateDataFreshness(
  benchmarks: BenchmarkResult[],
  policyChecks: PolicyCheckResult[],
  maxAgeDays = 30
): ValidationResult {
  const errors: string[] = [];
  const now = new Date();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  for (const benchmark of benchmarks) {
    const age = now.getTime() - new Date(benchmark.createdAt).getTime();
    if (age > maxAgeMs) {
      errors.push(
        `Benchmark '${benchmark.benchmarkName}' is stale (created ${Math.floor(age / (24 * 60 * 60 * 1000))} days ago)`
      );
    }
  }

  for (const check of policyChecks) {
    const age = now.getTime() - new Date(check.createdAt).getTime();
    if (age > maxAgeMs) {
      errors.push(
        `Policy check '${check.policyName}' is stale (created ${Math.floor(age / (24 * 60 * 60 * 1000))} days ago)`
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

export function validateAllData(
  benchmarks: BenchmarkResult[],
  policyChecks: PolicyCheckResult[]
): ValidationResult {
  const benchmarkValidation = validateBenchmarkData(benchmarks);
  const policyValidation = validatePolicyCheckData(policyChecks);
  const freshnessValidation = validateDataFreshness(benchmarks, policyChecks);

  const allErrors = [
    ...benchmarkValidation.errors,
    ...policyValidation.errors,
    ...freshnessValidation.errors
  ];

  return {
    passed: allErrors.length === 0,
    errors: allErrors
  };
}
