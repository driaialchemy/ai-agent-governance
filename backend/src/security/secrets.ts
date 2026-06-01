import * as crypto from "crypto";

export const REJECTED_SECRET_VALUES = new Set([
  "inbound-default-secret-change-me",
  "change-me",
  "changeme",
  "default",
  "secret",
  "test-secret",
  "password"
]);

export function isMissingOrRejectedSecret(value: string | undefined, minLength = 32): boolean {
  if (!value || value.trim().length < minLength) {
    return true;
  }
  return REJECTED_SECRET_VALUES.has(value.trim().toLowerCase());
}

export function constantTimeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
