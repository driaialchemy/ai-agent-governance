import { getDatabase, persistDatabase } from "../database";

export interface Escalation {
  id: string;
  timestamp: string;
  agentId: string;
  violation: string;
  violatedPolicy: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending_review" | "overridden";
  approvedBy?: string;
  overriddenReason?: string;
  overriddenAt?: string;
  createdAt: string;
}

export class EscalationRepository {
  create(input: Omit<Escalation, "id" | "createdAt"> & { id?: string }): Escalation {
    const db = getDatabase();
    const now = new Date().toISOString();
    const escalation: Escalation = {
      id: input.id || `esc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: input.timestamp || now,
      agentId: input.agentId,
      violation: input.violation,
      violatedPolicy: input.violatedPolicy,
      severity: input.severity,
      status: input.status,
      createdAt: now,
    };

    if (!db.escalations) {
      db.escalations = [];
    }

    db.escalations.push(escalation);
    persistDatabase();
    return escalation;
  }

  getById(id: string): Escalation | null {
    const db = getDatabase();
    return db.escalations?.find((item) => item.id === id) || null;
  }

  getPending(): Escalation[] {
    const db = getDatabase();
    return (db.escalations || []).filter((item) => item.status === "pending_review");
  }

  getAll(): Escalation[] {
    const db = getDatabase();
    return db.escalations || [];
  }

  update(escalation: Escalation): Escalation {
    const db = getDatabase();
    const index = db.escalations?.findIndex((item) => item.id === escalation.id) ?? -1;
    if (index >= 0 && db.escalations) {
      db.escalations[index] = escalation;
      persistDatabase();
    }
    return escalation;
  }
}
