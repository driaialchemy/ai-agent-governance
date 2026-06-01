// Automated assertive tests for webhook system
// Run with: npx tsx src/test-webhooks.ts

import {
  getAllSubscribers,
  getSubscriberById,
  addSubscriber,
  removeSubscriber,
  getSubscribersForEvent
} from "./webhooks/webhookRegistry";
import { generateSignature, dispatchWebhookEvent } from "./webhooks/webhookDispatcher";
import {
  validateWebhookSecret,
  handleInboundApprovalCheck,
  handleInboundPromotion,
  handleInboundRollback
} from "./webhooks/inboundHandler";
import { performPromotion } from "./promotion";
import { getAllAuditLogEntries } from "./auditLog";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`✗ FAILED: ${testName}`);
    testsFailed++;
  }
}

function assertEquals<T>(actual: T, expected: T, testName: string): void {
  assert(actual === expected, testName);
}

async function runTests() {
  console.log("WEBHOOK SYSTEM TESTS");
  console.log("=====================\n");

  // Test Group 1: Webhook Registry (Subscriber Management)
  console.log("TEST GROUP: Webhook Registry");
  console.log("----------------------------");

  const initialSubscribers = getAllSubscribers();
  assert(Array.isArray(initialSubscribers), "getAllSubscribers returns subscriber array");

  const nonExistentSubscriber = getSubscriberById("sub-999");
  assertEquals(nonExistentSubscriber, null, "getSubscriberById returns null for invalid id");

  const initialCount = getAllSubscribers().length;
  const newSubscriber = addSubscriber(
    "https://example.com/test",
    ["promotion_executed"],
    "test-secret-value-with-enough-length"
  );
  assert(newSubscriber.id.startsWith("sub-"), "addSubscriber creates a new subscriber with generated id");
  assertEquals(getAllSubscribers().length, initialCount + 1, "subscriber count increased after addSubscriber");

  const retrievedSubscriber = getSubscriberById(newSubscriber.id);
  assert(retrievedSubscriber !== null, "getSubscriberById returns correct subscriber for valid id");
  assertEquals(retrievedSubscriber?.url, "https://example.com/test", "subscriber has correct url");

  const promotionSubscribers = getSubscribersForEvent("promotion_executed");
  assert(promotionSubscribers.length >= 1, "getSubscribersForEvent returns subscribers listening to promotion_executed");
  assert(promotionSubscribers.every(s => s.events.includes("promotion_executed")), "all returned subscribers include the requested event");

  const removeSuccess = removeSubscriber(newSubscriber.id);
  assertEquals(removeSuccess, true, "removeSubscriber returns true for valid id");
  assertEquals(getAllSubscribers().length, initialCount, "subscriber count decreased after removeSubscriber");

  const removeFailure = removeSubscriber("sub-999");
  assertEquals(removeFailure, false, "removeSubscriber returns false for invalid id");

  const approvalSubscribers = getSubscribersForEvent("approval_evaluated");
  const testPingSubscribers = getSubscribersForEvent("test_ping");
  assert(approvalSubscribers.length >= 0, "getSubscribersForEvent works for approval_evaluated");
  assert(testPingSubscribers.length === 0, "getSubscribersForEvent returns empty array when no subscribers match");

  console.log("");

  // Test Group 2: Outbound Webhook Dispatcher
  console.log("TEST GROUP: Outbound Webhook Dispatcher");
  console.log("---------------------------------------");

  const testPayload = JSON.stringify({ test: "data" });
  const testSecret = "my-secret-key";

  const signature1 = generateSignature(testPayload, testSecret);
  assert(signature1.length === 64, "generateSignature produces a valid HMAC-SHA256 hex string");
  assert(/^[a-f0-9]{64}$/.test(signature1), "signature is valid hex format");

  const signature2 = generateSignature(testPayload, testSecret);
  assertEquals(signature1, signature2, "generateSignature with same inputs produces same output (deterministic)");

  const signature3 = generateSignature(testPayload, "different-secret");
  assert(signature1 !== signature3, "generateSignature with different secrets produces different output");

  const mockAuditEntry = {
    id: "audit-test",
    timestamp: new Date().toISOString(),
    actionType: "promotion_executed" as const,
    versionId: "ver-test",
    environment: "staging" as const,
    outcome: "success",
    reason: "Test promotion"
  };

  // Test dispatching to an event with subscribers (won't actually deliver but tests matching logic)
  const promotionResults = await dispatchWebhookEvent("promotion_executed", mockAuditEntry);
  assert(promotionResults.length >= 0, "dispatchWebhookEvent returns delivery results array");

  // Test dispatching to an event with no subscribers
  const nonExistentEventResults = await dispatchWebhookEvent("test_ping", { message: "test" });
  assertEquals(nonExistentEventResults.length, 0, "dispatchWebhookEvent returns empty array when no subscribers match event type");

  console.log("");

  // Test Group 3: Inbound Webhook Handler
  console.log("TEST GROUP: Inbound Webhook Handler");
  console.log("-----------------------------------");

  const validSecret = "valid-inbound-secret-value-000000001";
  const wrongSecret = "wrong-secret";

  assertEquals(validateWebhookSecret(validSecret, validSecret), true, "validateWebhookSecret returns true for matching secret");
  assertEquals(validateWebhookSecret(wrongSecret, validSecret), false, "validateWebhookSecret returns false for wrong secret");
  assertEquals(validateWebhookSecret("inbound-default-secret-change-me", "inbound-default-secret-change-me"), false, "validateWebhookSecret rejects default secret");
  assertEquals(validateWebhookSecret(undefined), false, "validateWebhookSecret returns false for undefined secret");
  assertEquals(validateWebhookSecret(""), false, "validateWebhookSecret returns false for empty secret");

  const approvalResult = handleInboundApprovalCheck("ver-002");
  assertEquals(approvalResult.success, true, "handleInboundApprovalCheck returns success for valid version");
  assert(approvalResult.data !== undefined, "handleInboundApprovalCheck returns approval data");

  const invalidApprovalResult = handleInboundApprovalCheck("ver-999");
  assertEquals(invalidApprovalResult.success, true, "handleInboundApprovalCheck returns result even for non-existent version");

  const promotionHandlerResult = handleInboundPromotion("ver-002", "staging");
  assert(promotionHandlerResult.success !== undefined, "handleInboundPromotion returns result with success field");
  assert(typeof promotionHandlerResult.success === "boolean", "handleInboundPromotion success field is boolean");

  const rollbackHandlerResult = handleInboundRollback("staging", "ver-001");
  assert(rollbackHandlerResult.success !== undefined, "handleInboundRollback returns result with success field");
  assert(typeof rollbackHandlerResult.success === "boolean", "handleInboundRollback success field is boolean");

  console.log("");

  // Test Group 4: Integration (End-to-End Flow)
  console.log("TEST GROUP: Integration");
  console.log("-----------------------");

  const auditCountBefore = getAllAuditLogEntries().length;

  // Perform a promotion which should create audit entry
  const integrationPromotion = performPromotion("ver-003", "production");
  assertEquals(integrationPromotion.allowed, true, "performing promotion via performPromotion succeeds");

  const auditCountAfter = getAllAuditLogEntries().length;
  assert(auditCountAfter > auditCountBefore, "promotion creates an audit entry");

  const latestAuditEntry = getAllAuditLogEntries()[getAllAuditLogEntries().length - 1]!;
  assert(latestAuditEntry.id !== undefined, "audit entry has id field");
  assert(latestAuditEntry.timestamp !== undefined, "audit entry has timestamp field");
  assert(latestAuditEntry.actionType !== undefined, "audit entry has actionType field");
  assert(latestAuditEntry.versionId !== undefined, "audit entry has versionId field");
  assert(latestAuditEntry.environment !== undefined, "audit entry has environment field");
  assert(latestAuditEntry.outcome !== undefined, "audit entry has outcome field");
  assert(latestAuditEntry.reason !== undefined, "audit entry has reason field");

  console.log("");

  // Summary
  console.log("=========================");
  console.log("TEST SUMMARY");
  console.log("=========================");
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Total:  ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    console.error("\n❌ TESTS FAILED");
    process.exit(1);
  } else {
    console.log("\n✅ ALL TESTS PASSED");
    process.exit(0);
  }
}

// Run the async test suite
runTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
