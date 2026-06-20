import { RiskLevel, RiskPolicySpec } from "../specs/riskPolicySpec";
import { ApprovalRepository, ApprovalRequest as DbApprovalRequest } from "../db/repositories/ApprovalRepository";

export type ApprovalRequest = {
  id: string;
  agentId: string;
  versionId: string;
  policyId?: string;
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

const repo = new ApprovalRepository();

function mapDbApproval(dbRequest: DbApprovalRequest): ApprovalRequest {
  return {
    id: dbRequest.id,
    agentId: dbRequest.agent_id,
    versionId: dbRequest.version_id,
    policyId: dbRequest.policy_id,
    risks: dbRequest.risks.map((risk) => ({
      id: risk.id,
      description: risk.description,
      level: risk.level as RiskLevel,
    })),
    status: dbRequest.status,
    approver: dbRequest.approver,
    approvalTime: dbRequest.approval_time,
    notes: dbRequest.notes,
  };
}

export function createApprovalRequest(
  agentId: string,
  versionId: string,
  risks: { id: string; description: string; level: RiskLevel }[],
  policy: RiskPolicySpec
): ApprovalRequest {
  const highRisks = risks.filter((r) => policy.requiresHumanApprovalFor.includes(r.level));

  const dbRequest = repo.createApprovalRequest(agentId, versionId, policy.id, highRisks);

  return mapDbApproval(dbRequest);
}

export function approveRequest(
  requestId: string,
  approver: string,
  notes?: string
): ApprovalRequest {
  const dbRequest = repo.approveRequest(requestId, approver, notes);

  return mapDbApproval(dbRequest);
}

export function rejectRequest(
  requestId: string,
  approver: string,
  notes: string
): ApprovalRequest {
  const dbRequest = repo.rejectRequest(requestId, approver, notes);

  return mapDbApproval(dbRequest);
}

export function getApprovalRequest(requestId: string): ApprovalRequest | undefined {
  const dbRequest = repo.getApprovalRequest(requestId);
  if (!dbRequest) return undefined;

  return mapDbApproval(dbRequest);
}

export function getPendingApprovals(): ApprovalRequest[] {
  return repo.getPendingApprovals().map(mapDbApproval);
}

export function getAllApprovals(): ApprovalRequest[] {
  return repo.getAllApprovals().map(mapDbApproval);
}

export function clearApprovalRequests(): void {
  repo.clearAllApprovals();
}
