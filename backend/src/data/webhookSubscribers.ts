import { WebhookSubscriber } from "../webhooks/types";

export const webhookSubscribers: WebhookSubscriber[] = [
  {
    id: "sub-001",
    url: "https://hooks.zapier.com/example/promotion",
    events: ["promotion_executed", "rollback_executed"],
    secret: "zapier-test-secret-001",
    createdAt: "2026-04-15T09:00:00Z"
  },
  {
    id: "sub-002",
    url: "https://hooks.zapier.com/example/all-events",
    events: ["promotion_executed", "rollback_executed", "approval_evaluated"],
    secret: "zapier-test-secret-002",
    createdAt: "2026-04-15T09:05:00Z"
  }
];
