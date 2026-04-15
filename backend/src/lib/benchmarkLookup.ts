import { benchmarkResults, BenchmarkResult } from "../data/benchmarks";

export function getAllBenchmarkResults(): BenchmarkResult[] {
  return benchmarkResults;
}

export function getBenchmarkResultsByVersionId(versionId: string): BenchmarkResult[] {
  return benchmarkResults.filter((result) => result.versionId === versionId);
}

export function getAverageBenchmarkScoreByVersionId(versionId: string): number | null {
  const results = getBenchmarkResultsByVersionId(versionId);

  if (results.length === 0) {
    return null;
  }

  const total = results.reduce((sum, result) => sum + result.score, 0);
  return total / results.length;
}

export function didVersionPassBenchmarks(versionId: string): boolean {
  const results = getBenchmarkResultsByVersionId(versionId);

  if (results.length === 0) {
    return false;
  }

  return results.every((result) => result.passed);
}