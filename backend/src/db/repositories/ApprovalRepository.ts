import { getDatabase, persistDatabase } from "../database";

export interface ApprovalRequest {
  id: string;
  agent_id: string;
  version_id: string;
  policy_id: string;
  risks: Array<{ id: string; description: string; level: string }>;
  status: "pending" | "approved" | "rejected";
  approver?: string;
  approval_time?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export class ApprovalRepository {
  createApprovalRequest(
    agentId: string,
    versionId: string,
    policyId: string,
    risks: Array<{ id: string; description: string; level: string }>
  ): ApprovalRequest {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = `approval-${Date.now()}`;

    const request: ApprovalRequest = {
      id,
      agent_id: agentId,
      version_id: versionId,
      policy_id: policyId,
      risks,
      status: "pending",
      created_at: now,
      updated_at: now
    };

    db.approval_requests.push(request);
    persistDatabase();

    return request;
  }

  approveRequest(requestId: string, approver: string, notes?: string): ApprovalRequest {
    const db = getDatabase();
    const request = db.approval_requests.find(r => r.id === requestId);

    if (!request || request.status !== "pending") {
      throw new Error("Approval request not found or already processed");
    }

    request.status = "approved";
    request.approver = approver;
    request.approval_time = new Date().toISOString();
    request.notes = notes;
    request.updated_at = new Date().toISOString();

    persistDatabase();
    return request;
  }

  rejectRequest(requestId: string, approver: string, notes: string): ApprovalRequest {
    const db = getDatabase();
    const request = db.approval_requests.find(r => r.id === requestId);

    if (!request || request.status !== "pending") {
      throw new Error("Approval request not found or already processed");
    }

    request.status = "rejected";
    request.approver = approver;
    request.approval_time = new Date().toISOString();
    request.notes = notes;
    request.updated_at = new Date().toISOString();

    persistDatabase();
    return request;
  }

  getApprovalRequest(requestId: string): ApprovalRequest | null {
    const db = getDatabase();
    return db.approval_requests.find(r => r.id === requestId) || null;
  }

  getPendingApprovals(): ApprovalRequest[] {
    const db = getDatabase();
    return db.approval_requests
      .filter(r => r.status === "pending")
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }

  getAllApprovals(): ApprovalRequest[] {
    const db = getDatabase();
    return db.approval_requests
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }

  clearAllApprovals(): void {
    const db = getDatabase();
    db.approval_requests = [];
    persistDatabase();
  }
}
