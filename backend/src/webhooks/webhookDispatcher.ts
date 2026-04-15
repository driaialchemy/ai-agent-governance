import * as crypto from "crypto";
import { AuditLogEntry } from "../auditLog";
import { WebhookEventType, WebhookPayload, WebhookDeliveryResult } from "./types";
import { getSubscribersForEvent } from "./webhookRegistry";

export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deliverWebhookToSubscriber(
  subscriberId: string,
  url: string,
  eventType: WebhookEventType,
  payload: WebhookPayload,
  secret: string
): Promise<WebhookDeliveryResult> {
  const maxAttempts = 3;
  const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

  let lastError: string | null = null;
  let httpStatus: number | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const payloadString = JSON.stringify(payload);
      const signature = generateSignature(payloadString, secret);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": signature
        },
        body: payloadString
      });

      httpStatus = response.status;

      if (response.ok) {
        console.log(`✓ Webhook delivered to ${subscriberId} (${url}) - status ${httpStatus} - attempt ${attempt + 1}/${maxAttempts}`);
        return {
          subscriberId,
          url,
          eventType,
          status: "success",
          httpStatus,
          attempts: attempt + 1,
          lastError: null
        };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;

      // Retry with backoff if not the last attempt
      if (attempt < maxAttempts - 1) {
        await delay(backoffDelays[attempt]);
      }

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      // Retry with backoff if not the last attempt
      if (attempt < maxAttempts - 1) {
        await delay(backoffDelays[attempt]);
      }
    }
  }

  console.log(`✗ Webhook failed for ${subscriberId} (${url}) - attempts ${maxAttempts}/${maxAttempts} - error: ${lastError}`);

  return {
    subscriberId,
    url,
    eventType,
    status: "failed",
    httpStatus,
    attempts: maxAttempts,
    lastError
  };
}

export async function dispatchWebhookEvent(
  eventType: WebhookEventType,
  auditEntry: AuditLogEntry | Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  const subscribers = getSubscribersForEvent(eventType);

  if (subscribers.length === 0) {
    console.log(`ℹ No subscribers for event type: ${eventType}`);
    return [];
  }

  console.log(`→ Dispatching ${eventType} to ${subscribers.length} subscriber(s)`);

  const payload: WebhookPayload = {
    timestamp: new Date().toISOString(),
    eventType,
    data: auditEntry
  };

  const deliveryPromises = subscribers.map((subscriber) =>
    deliverWebhookToSubscriber(
      subscriber.id,
      subscriber.url,
      eventType,
      payload,
      subscriber.secret
    )
  );

  const results = await Promise.allSettled(deliveryPromises);

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      // This shouldn't happen since deliverWebhookToSubscriber always resolves
      // but handle it just in case
      return {
        subscriberId: "unknown",
        url: "unknown",
        eventType,
        status: "failed" as const,
        httpStatus: null,
        attempts: 0,
        lastError: result.reason instanceof Error ? result.reason.message : String(result.reason)
      };
    }
  });
}
