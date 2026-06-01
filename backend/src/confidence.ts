// Confidence scoring
// Calculates confidence scores (0-100) and defines enforcement thresholds

import { Evidence } from "./evidenceBuilder";
import { ValidationResult } from "./deterministicChecks";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ConfidenceScore {
  score: number; // 0-100
  level: ConfidenceLevel;
  factors: {
    benchmarkScore: number;
    policyScore: number;
    dataQualityScore: number;
    deploymentHistoryBonus: number;
  };
}

// Thresholds for confidence levels
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50
} as const;

// Minimum confidence requirements for promotion
export const PROMOTION_REQUIREMENTS = {
  production: CONFIDENCE_THRESHOLDS.HIGH,
  staging: CONFIDENCE_THRESHOLDS.MEDIUM
} as const;

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) {
    return "HIGH";
  } else if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return "MEDIUM";
  } else {
    return "LOW";
  }
}

function calculateBenchmarkScore(evidence: Evidence): number {
  const { benchmarks } = evidence;

  if (benchmarks.totalBenchmarks === 0) {
    return 0;
  }

  // Base score on pass rate
  const passRate = benchmarks.passedBenchmarks / benchmarks.totalBenchmarks;

  // Adjust by average score if available
  let score = passRate * 100;

  if (benchmarks.averageScore !== null) {
    // Average the pass rate with normalized average score
    const normalizedAvg = benchmarks.averageScore; // Already 0-100 typically
    score = (score + normalizedAvg) / 2;
  }

  return Math.min(100, Math.max(0, score));
}

function calculatePolicyScore(evidence: Evidence): number {
  const { policies } = evidence;

  if (policies.totalPolicyChecks === 0) {
    return 0;
  }

  // Base score on pass rate
  const passRate = policies.passedPolicyChecks / policies.totalPolicyChecks;
  let score = passRate * 100;

  // Penalize high-severity failures more heavily
  if (policies.highSeverityFailures > 0) {
    const severityPenalty = policies.highSeverityFailures * 20;
    score = Math.max(0, score - severityPenalty);
  }

  return Math.min(100, Math.max(0, score));
}

function calculateDataQualityScore(validation: ValidationResult): number {
  // If validation passed, full score
  if (validation.passed) {
    return 100;
  }

  // If validation failed, penalize based on number of errors
  const errorPenalty = Math.min(100, validation.errors.length * 25);
  return Math.max(0, 100 - errorPenalty);
}

function calculateDeploymentHistoryBonus(evidence: Evidence): number {
  if (!evidence.deployment) {
    return 0;
  }

  // Bonus for versions that have been deployed before (proven stability)
  if (evidence.deployment.wasDeployedBefore) {
    return Math.min(10, evidence.deployment.deploymentCount * 2);
  }

  return 0;
}

export function calculateConfidenceScore(
  evidence: Evidence,
  validation: ValidationResult
): ConfidenceScore {
  const benchmarkScore = calculateBenchmarkScore(evidence);
  const policyScore = calculatePolicyScore(evidence);
  const dataQualityScore = calculateDataQualityScore(validation);
  const deploymentHistoryBonus = calculateDeploymentHistoryBonus(evidence);

  // Weighted average with deployment bonus
  // Benchmark: 35%, Policy: 35%, Data Quality: 30%, Deployment: +bonus
  const baseScore =
    benchmarkScore * 0.35 + policyScore * 0.35 + dataQualityScore * 0.3;

  const finalScore = Math.min(100, Math.max(0, baseScore + deploymentHistoryBonus));

  return {
    score: Math.round(finalScore),
    level: getConfidenceLevel(finalScore),
    factors: {
      benchmarkScore: Math.round(benchmarkScore),
      policyScore: Math.round(policyScore),
      dataQualityScore: Math.round(dataQualityScore),
      deploymentHistoryBonus: Math.round(deploymentHistoryBonus)
    }
  };
}

export function meetsConfidenceRequirement(
  confidence: ConfidenceScore,
  environment: "staging" | "production"
): boolean {
  const required = PROMOTION_REQUIREMENTS[environment];
  return confidence.score >= required;
}
