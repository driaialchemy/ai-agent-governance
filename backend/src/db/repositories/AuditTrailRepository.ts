import { getDatabase, persistDatabase } from "../database";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action_type: string;
  agent_id?: string;
  version_id?: string;
  entity_type: string;
  entity_id: string;
  change_json?: string;
  created_by?: string;
  ip_address?: string;
  created_at?: string;
}

export class AuditTrailRepository {
  logAction(
    actionType: string,
    agentId: string | undefined,
    versionId: string | undefined,
    entityType: string,
    entityId: string,
    changeData?: any,
    createdBy?: string,
    ipAddress?: string
  ): AuditEntry {
    const db = getDatabase();
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const entry: AuditEntry = {
      id,
      timestamp: now,
      action_type: actionType,
      agent_id: agentId,
      version_id: versionId,
      entity_type: entityType,
      entity_id: entityId,
      change_json: changeData ? JSON.stringify(changeData) : undefined,
      created_by: createdBy,
      ip_address: ipAddress,
      created_at: now
    };

    db.audit_trail.push(entry);
    persistDatabase();

    return entry;
  }

  getAuditTrail(
    agentId?: string,
    versionId?: string,
    actionType?: string,
    limit: number = 1000
  ): AuditEntry[] {
    const db = getDatabase();

    let results = db.audit_trail;

    if (agentId) {
      results = results.filter(e => e.agent_id === agentId);
    }

    if (versionId) {
      results = results.filter(e => e.version_id === versionId);
    }

    if (actionType) {
      results = results.filter(e => e.action_type === actionType);
    }

    return results
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getAllAuditEntries(limit: number = 10000): AuditEntry[] {
    const db = getDatabase();
    return db.audit_trail
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getAuditEntriesByEntity(entityType: string, entityId: string): AuditEntry[] {
    const db = getDatabase();
    return db.audit_trail
      .filter(e => e.entity_type === entityType && e.entity_id === entityId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  clearAllAuditTrail(): void {
    const db = getDatabase();
    db.audit_trail = [];
    persistDatabase();
  }
}
