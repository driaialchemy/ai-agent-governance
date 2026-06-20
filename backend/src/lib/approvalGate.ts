import { RiskLevel, RiskPolicySpec } from "../specs/riskPolicySpec";

export type ApprovalRequest = {
  id: string;
  agentId: string;
  versionId: string;
  risks: {
    id: string;
    description: string;
    level: RiskLevel;
  }[];
  status: "pending" | "approved" | "rejected";
  approver?: string;
  approvalTime?: string;
  notes?: string;
};

const approvalRequests: Map<string, ApprovalRequest> = new Map();

export function createApprovalRequest(
  agentId: string,
  versionId: string,
  risks: { id: string; description: string; level: RiskLevel }[],
  policy: RiskPolicySpec
): ApprovalRequest {
  const highRisks = risks.filter((r) => policy.requiresHumanApprovalFor.includes(r.level));

  const request: ApprovalRequest = {
    id: `approval-${Date.now()}`,
    agentId,
    versionId,
    risks: highRisks,
    status: "pending"
  };

  approvalRequests.set(request.id, request);
  return request;
}

export function approveRequest(
  requestId: string,
  approver: string,
  notes?: string
): ApprovalRequest {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error("Approval request not found");
  }

  request.status = "approved";
  request.approver = approver;
  request.approvalTime = new Date().toISOString();
  request.notes = notes;

  return request;
}

export function rejectRequest(
  requestId: string,
  approver: string,
  notes: string
): ApprovalRequest {
  const request = approvalRequests.get(requestId);
  if (!request) {
    throw new Error("Approval request not found");
  }

  request.status = "rejected";
  request.approver = approver;
  request.approvalTime = new Date().toISOString();
  request.notes = notes;

  return request;
}

export function getApprovalRequest(requestId: string): ApprovalRequest | undefined {
  return approvalRequests.get(requestId);
}

export function getPendingApprovals(): ApprovalRequest[] {
  return Array.from(approvalRequests.values()).filter((r) => r.status === "pending");
}

export function clearApprovalRequests(): void {
  approvalRequests.clear();
}
