// Test script for promotion API endpoints
// Run this after starting the server with: npx tsx src/server.ts

const BASE_URL = "http://localhost:3000";

async function testPromotionAPI() {
  console.log("PROMOTION API ENDPOINT TESTS");
  console.log("============================");
  console.log("");

  // Test 1: Check initial deployment state
  console.log("TEST 1: Check initial deployment state");
  console.log("---------------------------------------");
  const deploymentsResponse = await fetch(`${BASE_URL}/deployments`);
  const deploymentsData = await deploymentsResponse.json();
  console.log(`Status: ${deploymentsResponse.status}`);
  console.log(JSON.stringify(deploymentsData, null, 2));
  console.log("");

  // Test 2: Evaluate promotion (GET - read-only)
  console.log("TEST 2: Evaluate promotion for ver-002 to staging (GET)");
  console.log("--------------------------------------------------------");
  const evalResponse = await fetch(`${BASE_URL}/versions/ver-002/promotion/staging`);
  const evalData = await evalResponse.json();
  console.log(`Status: ${evalResponse.status}`);
  console.log(JSON.stringify(evalData, null, 2));
  console.log("");

  // Test 3: Execute promotion (POST - mutates state)
  console.log("TEST 3: Execute promotion for ver-002 to staging (POST)");
  console.log("--------------------------------------------------------");
  const promotionResponse = await fetch(`${BASE_URL}/versions/ver-002/promotion/staging`, {
    method: "POST"
  });
  const promotionData = await promotionResponse.json();
  console.log(`Status: ${promotionResponse.status}`);
  console.log(JSON.stringify(promotionData, null, 2));
  console.log("");

  // Test 4: Check deployment state after promotion
  console.log("TEST 4: Check deployment state after promotion");
  console.log("-----------------------------------------------");
  const deploymentsAfterResponse = await fetch(`${BASE_URL}/deployments`);
  const deploymentsAfterData = await deploymentsAfterResponse.json();
  console.log(`Status: ${deploymentsAfterResponse.status}`);
  console.log(JSON.stringify(deploymentsAfterData, null, 2));
  console.log("");

  // Test 5: Check audit log for promotion actions
  console.log("TEST 5: Check audit log for promotion actions");
  console.log("----------------------------------------------");
  const auditResponse = await fetch(`${BASE_URL}/audit-log`);
  const auditData = await auditResponse.json();
  console.log(`Status: ${auditResponse.status}`);
  console.log(`Total audit entries: ${auditData.data.length}`);
  console.log("");
  console.log("Promotion-related entries:");
  const promotionEntries = auditData.data.filter((entry: any) =>
    entry.actionType === "promotion_executed" || entry.actionType === "promotion_evaluated"
  );
  console.log(JSON.stringify(promotionEntries, null, 2));
  console.log("");

  // Test 6: Denied promotion (version not approved)
  console.log("TEST 6: Denied promotion for ver-001 to production (POST)");
  console.log("----------------------------------------------------------");
  const deniedResponse = await fetch(`${BASE_URL}/versions/ver-001/promotion/production`, {
    method: "POST"
  });
  const deniedData = await deniedResponse.json();
  console.log(`Status: ${deniedResponse.status}`);
  console.log(JSON.stringify(deniedData, null, 2));
  console.log("");

  // Test 7: Invalid environment
  console.log("TEST 7: Invalid environment test");
  console.log("---------------------------------");
  const invalidResponse = await fetch(`${BASE_URL}/versions/ver-002/promotion/invalid`, {
    method: "POST"
  });
  const invalidData = await invalidResponse.json();
  console.log(`Status: ${invalidResponse.status}`);
  console.log(JSON.stringify(invalidData, null, 2));
  console.log("");

  console.log("=".repeat(60));
  console.log("ALL PROMOTION API TESTS COMPLETED");
  console.log("=".repeat(60));
}

testPromotionAPI().catch(console.error);
