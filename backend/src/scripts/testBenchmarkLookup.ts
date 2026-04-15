import {
  getAllBenchmarkResults,
  getBenchmarkResultsByVersionId,
  getAverageBenchmarkScoreByVersionId,
  didVersionPassBenchmarks
} from "../lib/benchmarkLookup";

console.log("TEST 1: All benchmark results");
console.log(JSON.stringify(getAllBenchmarkResults(), null, 2));
console.log("");

console.log("TEST 2: Benchmark results for ver-001");
console.log(JSON.stringify(getBenchmarkResultsByVersionId("ver-001"), null, 2));
console.log("");

console.log("TEST 3: Average benchmark score for ver-001");
console.log(getAverageBenchmarkScoreByVersionId("ver-001"));
console.log("");

console.log("TEST 4: Did ver-001 pass all benchmarks?");
console.log(didVersionPassBenchmarks("ver-001"));
console.log("");

console.log("TEST 5: Benchmark results for ver-002");
console.log(JSON.stringify(getBenchmarkResultsByVersionId("ver-002"), null, 2));
console.log("");

console.log("TEST 6: Average benchmark score for ver-002");
console.log(getAverageBenchmarkScoreByVersionId("ver-002"));
console.log("");

console.log("TEST 7: Did ver-002 pass all benchmarks?");
console.log(didVersionPassBenchmarks("ver-002"));
console.log("");