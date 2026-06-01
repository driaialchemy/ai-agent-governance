export type BenchmarkResult = {
  id: string;
  versionId: string;
  benchmarkName: string;
  score: number;
  maxScore: number;
  passed: boolean;
  createdAt: string;
};

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const benchmarkResults: BenchmarkResult[] = [
  {
    id: "bench-001",
    versionId: "ver-001",
    benchmarkName: "Policy Classification Accuracy",
    score: 78,
    maxScore: 100,
    passed: false,
    createdAt: daysAgo(4)
  },
  {
    id: "bench-002",
    versionId: "ver-001",
    benchmarkName: "Risk Flag Consistency",
    score: 81,
    maxScore: 100,
    passed: true,
    createdAt: daysAgo(4)
  },
  {
    id: "bench-003",
    versionId: "ver-002",
    benchmarkName: "Benchmark Summary Accuracy",
    score: 91,
    maxScore: 100,
    passed: true,
    createdAt: daysAgo(3)
  },
  {
    id: "bench-004",
    versionId: "ver-002",
    benchmarkName: "Benchmark Summary Consistency",
    score: 89,
    maxScore: 100,
    passed: true,
    createdAt: daysAgo(3)
  },
  {
    id: "bench-005",
    versionId: "ver-003",
    benchmarkName: "Benchmark Summary Accuracy",
    score: 93,
    maxScore: 100,
    passed: true,
    createdAt: daysAgo(2)
  },
  {
    id: "bench-006",
    versionId: "ver-003",
    benchmarkName: "Benchmark Summary Consistency",
    score: 92,
    maxScore: 100,
    passed: true,
    createdAt: daysAgo(2)
  },
  {
    id: "bench-007",
    versionId: "ver-004",
    benchmarkName: "Benchmark Summary Accuracy",
    score: 95,
    maxScore: 100,
    passed: true,
    createdAt: daysAgo(1)
  },
  {
    id: "bench-008",
    versionId: "ver-004",
    benchmarkName: "Benchmark Summary Consistency",
    score: 94,
    maxScore: 100,
    passed: true,
    createdAt: daysAgo(1)
  }
];
