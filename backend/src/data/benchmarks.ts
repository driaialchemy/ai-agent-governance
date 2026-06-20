export type BenchmarkResult = {
  id: string;
  versionId: string;
  benchmarkName: string;
  score: number;
  maxScore: number;
  passed: boolean;
  createdAt: string;
};

export const benchmarkResults: BenchmarkResult[] = [
  {
    id: "bench-001",
    versionId: "ver-001",
    benchmarkName: "Policy Classification Accuracy",
    score: 78,
    maxScore: 100,
    passed: false,
    createdAt: "2026-04-11T10:00:00Z"
  },
  {
    id: "bench-002",
    versionId: "ver-001",
    benchmarkName: "Risk Flag Consistency",
    score: 81,
    maxScore: 100,
    passed: true,
    createdAt: "2026-04-11T10:05:00Z"
  },
  {
    id: "bench-003",
    versionId: "ver-002",
    benchmarkName: "Benchmark Summary Accuracy",
    score: 91,
    maxScore: 100,
    passed: true,
    createdAt: "2026-04-11T10:10:00Z"
  },
  {
    id: "bench-004",
    versionId: "ver-002",
    benchmarkName: "Benchmark Summary Consistency",
    score: 89,
    maxScore: 100,
    passed: true,
    createdAt: "2026-04-11T10:15:00Z"
  },
  {
    id: "bench-005",
    versionId: "ver-003",
    benchmarkName: "Benchmark Summary Accuracy",
    score: 93,
    maxScore: 100,
    passed: true,
    createdAt: "2026-04-12T14:30:00Z"
  },
  {
    id: "bench-006",
    versionId: "ver-003",
    benchmarkName: "Benchmark Summary Consistency",
    score: 92,
    maxScore: 100,
    passed: true,
    createdAt: "2026-04-12T14:35:00Z"
  },
  {
    id: "bench-007",
    versionId: "ver-004",
    benchmarkName: "Benchmark Summary Accuracy",
    score: 95,
    maxScore: 100,
    passed: true,
    createdAt: "2026-04-13T08:30:00Z"
  },
  {
    id: "bench-008",
    versionId: "ver-004",
    benchmarkName: "Benchmark Summary Consistency",
    score: 94,
    maxScore: 100,
    passed: true,
    createdAt: "2026-04-13T08:35:00Z"
  },
  {
    id: "bench-101",
    versionId: "ver-101",
    benchmarkName: "Risky File Detection Accuracy",
    score: 94,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T10:20:00Z"
  },
  {
    id: "bench-102",
    versionId: "ver-101",
    benchmarkName: "Missing README Detection",
    score: 92,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T10:25:00Z"
  },
  {
    id: "bench-103",
    versionId: "ver-102",
    benchmarkName: "Risky File Detection Accuracy",
    score: 90,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T10:30:00Z"
  },
  {
    id: "bench-104",
    versionId: "ver-102",
    benchmarkName: "Missing Test Detection",
    score: 88,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T10:35:00Z"
  },
  {
    id: "bench-201",
    versionId: "ver-201",
    benchmarkName: "Risky Clause Identification",
    score: 93,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T11:20:00Z"
  },
  {
    id: "bench-202",
    versionId: "ver-201",
    benchmarkName: "Evidence Summary Quality",
    score: 91,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T11:25:00Z"
  },
  {
    id: "bench-207",
    versionId: "ver-203",
    benchmarkName: "Risky Clause Identification",
    score: 89,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T11:40:00Z"
  },
  {
    id: "bench-208",
    versionId: "ver-203",
    benchmarkName: "Evidence Summary Quality",
    score: 87,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T11:45:00Z"
  },
  {
    id: "bench-301",
    versionId: "ver-301",
    benchmarkName: "Severity Classification Accuracy",
    score: 92,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T12:20:00Z"
  },
  {
    id: "bench-302",
    versionId: "ver-301",
    benchmarkName: "Next Step Recommendation Quality",
    score: 90,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T12:25:00Z"
  },
  {
    id: "bench-303",
    versionId: "ver-302",
    benchmarkName: "Severity Classification Accuracy",
    score: 91,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T12:30:00Z"
  },
  {
    id: "bench-304",
    versionId: "ver-302",
    benchmarkName: "Next Step Recommendation Quality",
    score: 89,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T12:35:00Z"
  },
  {
    id: "bench-305",
    versionId: "ver-303",
    benchmarkName: "Severity Classification Accuracy",
    score: 90,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T12:40:00Z"
  },
  {
    id: "bench-306",
    versionId: "ver-303",
    benchmarkName: "Next Step Recommendation Quality",
    score: 88,
    maxScore: 100,
    passed: true,
    createdAt: "2026-06-01T12:45:00Z"
  }
  // ver-202 intentionally has no benchmark results
];
