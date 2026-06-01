import { getSubscribersForEvent, getAllSubscribers } from "./webhookRegistry";
import { generateSignature } from "./webhookDispatcher";
import { WebhookPayload } from "./types";

console.log("=== Webhook System Smoke Test ===\n");

// Test 1: Get all subscribers
console.log("1. All subscribers:");
const allSubscribers = getAllSubscribers();
console.log(`   Found ${allSubscribers.length} subscriber(s)`);
allSubscribers.forEach((sub) => {
  console.log(`   - ${sub.id}: ${sub.url}`);
  console.log(`     Events: ${sub.events.join(", ")}`);
});
console.log();

// Test 2: Get subscribers for specific event
console.log("2. Subscribers for 'promotion_executed':");
const promotionSubscribers = getSubscribersForEvent("promotion_executed");
console.log(`   Found ${promotionSubscribers.length} subscriber(s)`);
promotionSubscribers.forEach((sub) => {
  console.log(`   - ${sub.id}: ${sub.url}`);
});
console.log();

// Test 3: Get subscribers for another event
console.log("3. Subscribers for 'approval_evaluated':");
const approvalSubscribers = getSubscribersForEvent("approval_evaluated");
console.log(`   Found ${approvalSubscribers.length} subscriber(s)`);
approvalSubscribers.forEach((sub) => {
  console.log(`   - ${sub.id}: ${sub.url}`);
});
console.log();

// Test 4: Generate signature
console.log("4. Signature generation:");
const testPayload: WebhookPayload = {
  timestamp: "2026-04-15T10:00:00Z",
  eventType: "promotion_executed",
  data: {
    id: "audit-1",
    timestamp: "2026-04-15T10:00:00Z",
    actionType: "promotion_executed",
    versionId: "ver-001",
    environment: "production",
    outcome: "success",
    reason: "All checks passed",
    fromVersionId: "ver-002",
    toVersionId: "ver-001"
  }
};

const payloadString = JSON.stringify(testPayload);
const testSigningKey = process.env.WEBHOOK_SMOKE_TEST_SECRET || "placeholder-signing-key-for-local-smoke-test";
const signature = generateSignature(payloadString, testSigningKey);

console.log(`   Payload: ${payloadString.substring(0, 80)}...`);
console.log("   Signing key: [redacted]");
console.log(`   Signature: ${signature}`);
console.log();

console.log("=== Smoke Test Complete ===");
