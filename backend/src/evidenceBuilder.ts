// Evidence builder
// Collects and structures evidence from benchmarks, policy checks, and deployment history

import { BenchmarkResult } from "./data/benchmarks";
import { PolicyCheckResult } from "./data/policyChecks";

export interface BenchmarkEvidence {
  totalBenchmarks: number;
  passedBenchmarks: number;
  failedBenchmarks: number;
  averageScore: number | null;
  benchmarkDetails: Array<{
    name: string;
    score: number;
    maxScore: number;
    passed: boolean;
  }>;
}

export interface PolicyEvidence {
  totalPolicyChecks: number;
  passedPolicyChecks: number;
  failedPolicyChecks: number;
  highSeverityFailures: number;
  failedCheckDetails: Array<{
    name: string;
    severity: string;
    notes: string;
  }>;
}

export interface DeploymentEvidence {
  wasDeployedBefore: boolean;
  deploymentCount: number;
  environments: string[];
}

export interface Evidence {
  benchmarks: BenchmarkEvidence;
  policies: PolicyEvidence;
  deployment?: DeploymentEvidence;
  collectedAt: string;
}

export function buildBenchmarkEvidence(benchmarks: BenchmarkResult[]): BenchmarkEvidence {
  const passed = benchmarks.filter((b) => b.passed);
  const failed = benchmarks.filter((b) => !b.passed);

  const averageScore =
    benchmarks.length > 0
      ? benchmarks.reduce((sum, b) => sum + b.score, 0) / benchmarks.length
      : null;

  return {
    totalBenchmarks: benchmarks.length,
    passedBenchmarks: passed.length,
    failedBenchmarks: failed.length,
    averageScore,
    benchmarkDetails: benchmarks.map((b) => ({
      name: b.benchmarkName,
      score: b.score,
      maxScore: b.maxScore,
      passed: b.passed
    }))
  };
}

export function buildPolicyEvidence(policyChecks: PolicyCheckResult[]): PolicyEvidence {
  const passed = policyChecks.filter((p) => p.passed);
  const failed = policyChecks.filter((p) => !p.passed);
  const highSeverityFailures = failed.filter((p) => p.severity === "high").length;

  return {
    totalPolicyChecks: policyChecks.length,
    passedPolicyChecks: passed.length,
    failedPolicyChecks: failed.length,
    highSeverityFailures,
    failedCheckDetails: failed.map((p) => ({
      name: p.policyName,
      severity: p.severity,
      notes: p.notes
    }))
  };
}

export function buildDeploymentEvidence(
  previousVersionIds: string[],
  versionId: string
): DeploymentEvidence {
  const wasDeployedBefore = previousVersionIds.includes(versionId);
  const deploymentCount = previousVersionIds.filter((id) => id === versionId).length;

  return {
    wasDeployedBefore,
    deploymentCount,
    environments: [] // Will be populated by caller if needed
  };
}

export function buildEvidence(
  benchmarks: BenchmarkResult[],
  policyChecks: PolicyCheckResult[],
  deploymentInfo?: {
    previousVersionIds: string[];
    versionId: string;
  }
): Evidence {
  const evidence: Evidence = {
    benchmarks: buildBenchmarkEvidence(benchmarks),
    policies: buildPolicyEvidence(policyChecks),
    collectedAt: new Date().toISOString()
  };

  if (deploymentInfo) {
    evidence.deployment = buildDeploymentEvidence(
      deploymentInfo.previousVersionIds,
      deploymentInfo.versionId
    );
  }

  return evidence;
}
