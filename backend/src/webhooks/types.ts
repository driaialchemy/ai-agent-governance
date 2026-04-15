import { AuditActionType, AuditLogEntry } from "../auditLog";

export type WebhookEventType = AuditActionType | "test_ping";

export interface WebhookSubscriber {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  createdAt: string;
}

export interface WebhookEvent {
  type: WebhookEventType;
}

export interface WebhookPayload {
  timestamp: string;
  eventType: WebhookEventType;
  data: AuditLogEntry | Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  subscriberId: string;
  url: string;
  eventType: WebhookEventType;
  status: "success" | "failed";
  httpStatus: number | null;
  attempts: number;
  lastError: string | null;
}
