/**
 * Types of governance actions that can be audited
 * These map directly to potential Zapier trigger events
 */
export type AuditActionType =
  | "approval_evaluated"
  | "promotion_evaluated"
  | "promotion_executed"
  | "rollback_evaluated"
  | "rollback_executed";

/**
 * Audit log entry for governance actions
 * This is the primary output for Zapier trigger events
 *
 * Trigger events:
 * - approval_evaluated: When a version is checked for approval
 * - promotion_evaluated: When a promotion eligibility is checked
 * - promotion_executed: When a version is successfully promoted
 * - rollback_evaluated: When a rollback eligibility is checked
 * - rollback_executed: When a rollback is successfully performed
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  versionId: string;
  environment?: "staging" | "production" | undefined;
  outcome: string;
  reason: string;
  /** For state changes: the version being replaced */
  fromVersionId?: string | undefined;
  /** For state changes: the version being deployed */
  toVersionId?: string | undefined;
  /** Structured evidence object supporting the decision */
  evidence?: unknown | undefined;
  /** Confidence score (0-100) */
  confidenceScore?: number | undefined;
  /** Confidence level (LOW/MEDIUM/HIGH) */
  confidenceLevel?: "LOW" | "MEDIUM" | "HIGH" | undefined;
}

const auditLog: AuditLogEntry[] = [];

export function addAuditLogEntry(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    id: `audit-${auditLog.length + 1}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  auditLog.push(newEntry);
  return newEntry;
}

export function getAllAuditLogEntries(): AuditLogEntry[] {
  return auditLog;
}

export function getAuditLogEntriesByVersionId(versionId: string): AuditLogEntry[] {
  return auditLog.filter((entry) => entry.versionId === versionId);
}
