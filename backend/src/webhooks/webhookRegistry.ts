import { webhookSubscribers } from "../data/webhookSubscribers";
import { WebhookSubscriber, WebhookEventType } from "./types";

export function getAllSubscribers(): WebhookSubscriber[] {
  return webhookSubscribers;
}

export function getSubscriberById(id: string): WebhookSubscriber | null {
  return webhookSubscribers.find((sub) => sub.id === id) || null;
}

export function addSubscriber(
  url: string,
  events: WebhookEventType[],
  secret: string
): WebhookSubscriber {
  const nextId = webhookSubscribers.length + 1;
  const paddedId = String(nextId).padStart(3, "0");

  const newSubscriber: WebhookSubscriber = {
    id: `sub-${paddedId}`,
    url,
    events,
    secret,
    createdAt: new Date().toISOString()
  };

  webhookSubscribers.push(newSubscriber);
  return newSubscriber;
}

export function removeSubscriber(id: string): boolean {
  const index = webhookSubscribers.findIndex((sub) => sub.id === id);

  if (index === -1) {
    return false;
  }

  webhookSubscribers.splice(index, 1);
  return true;
}

export function getSubscribersForEvent(eventType: WebhookEventType): WebhookSubscriber[] {
  return webhookSubscribers.filter((sub) => sub.events.includes(eventType));
}
