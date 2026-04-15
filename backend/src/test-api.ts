// Simple test script to verify API endpoints
// Run this after starting the server

const BASE_URL = "http://localhost:3000";

async function testEndpoint(method: string, path: string, description: string) {
  console.log(`\n${description}`);
  console.log(`${method} ${path}`);
  console.log("-".repeat(60));

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

async function runTests() {
  console.log("API ENDPOINT TESTS");
  console.log("==================");

  // Registry tests
  await testEndpoint("GET", "/agents", "TEST 1: Get all agents");
  await testEndpoint("GET", "/agents/agent-001", "TEST 2: Get specific agent");
  await testEndpoint("GET", "/agents/agent-001/versions", "TEST 3: Get versions for agent");
  await testEndpoint("GET", "/versions", "TEST 4: Get all versions");
  await testEndpoint("GET", "/versions/ver-002", "TEST 5: Get specific version");

  // Benchmark tests
  await testEndpoint("GET", "/versions/ver-002/benchmarks", "TEST 6: Get benchmarks for version");
  await testEndpoint("GET", "/versions/ver-002/benchmarks/summary", "TEST 7: Get benchmark summary");

  // Policy check tests
  await testEndpoint("GET", "/versions/ver-002/policy-checks", "TEST 8: Get policy checks for version");
  await testEndpoint("GET", "/versions/ver-002/policy-checks/summary", "TEST 9: Get policy check summary");

  // Approval test
  await testEndpoint("GET", "/versions/ver-002/approval", "TEST 10: Get approval evaluation");

  // Promotion test
  await testEndpoint("GET", "/versions/ver-002/promotion/staging", "TEST 11: Get promotion evaluation for staging");

  // Deployment state
  await testEndpoint("GET", "/deployments", "TEST 12: Get current deployments");

  // Rollback evaluation (read-only)
  await testEndpoint("GET", "/rollback/production/ver-002", "TEST 13: Evaluate rollback to ver-002");

  // Audit log
  await testEndpoint("GET", "/audit-log", "TEST 14: Get all audit log entries");
  await testEndpoint("GET", "/audit-log/version/ver-002", "TEST 15: Get audit log for specific version");

  // Error cases
  await testEndpoint("GET", "/versions/invalid-id", "TEST 16: Test 404 - Invalid version ID");
  await testEndpoint("GET", "/versions/ver-002/promotion/invalid", "TEST 17: Test 400 - Invalid environment");

  console.log("\n" + "=".repeat(60));
  console.log("ALL TESTS COMPLETED");
  console.log("=".repeat(60));
}

runTests();
