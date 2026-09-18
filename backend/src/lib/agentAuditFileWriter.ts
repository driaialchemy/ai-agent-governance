import fs from "fs";
import path from "path";

const DEFAULT_AUDIT_DIR = "C:\\Users\\msell\\OneDrive\\AIAlchemy\\agentauditlog";

export interface AgentAuditRecord {
  activityId: string;
  agentId: string;
  actionType: string;
  timestamp: string;
  description: string;
  activity: Record<string, unknown>;
  allowed: boolean;
  violation?: string;
  violatedPolicy?: string;
  escalationId?: string;
}

function auditLogDir(): string {
  return process.env.AGENT_AUDIT_LOG_DIR || DEFAULT_AUDIT_DIR;
}

function safeTimestampForFilename(isoTimestamp: string): string {
  return isoTimestamp.replace(/[:.]/g, "-");
}

function formatJsonBlock(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function writeAgentAuditDocument(record: AgentAuditRecord): string {
  const dir = auditLogDir();
  fs.mkdirSync(dir, { recursive: true });

  const stamp = safeTimestampForFilename(record.timestamp);
  const filename = `${stamp}_${record.agentId}_${record.activityId}.md`;
  const filePath = path.join(dir, filename);

  const lines = [
    "# Agent Activity Audit Log",
    "",
    `**Recorded at:** ${record.timestamp}`,
    `**Agent ID:** ${record.agentId}`,
    `**Activity ID:** ${record.activityId}`,
    `**Action type:** ${record.actionType}`,
    `**Governor allowed:** ${record.allowed ? "yes" : "no"}`,
    "",
    "## Description",
    "",
    record.description || "(none)",
    "",
    "## Activity payload",
    "",
    "```json",
    formatJsonBlock(record.activity),
    "```",
    "",
    "## Governor decision",
    "",
    `- **Allowed:** ${record.allowed}`,
    `- **Violation:** ${record.violation ?? "none"}`,
    `- **Violated policy:** ${record.violatedPolicy ?? "none"}`,
    `- **Escalation ID:** ${record.escalationId ?? "none"}`,
    ""
  ];

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  return filePath;
}

export function getAgentAuditLogDir(): string {
  return auditLogDir();
}
