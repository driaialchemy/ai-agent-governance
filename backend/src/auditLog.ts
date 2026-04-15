export type AuditActionType =
  | "approval_evaluated"
  | "promotion_evaluated"
  | "promotion_executed"
  | "rollback_evaluated"
  | "rollback_executed";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType: AuditActionType;
  versionId: string;
  environment?: "staging" | "production";
  outcome: string;
  reason: string;
  fromVersionId?: string;
  toVersionId?: string;
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