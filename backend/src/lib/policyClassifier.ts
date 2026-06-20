import { RiskLevel, RiskPolicySpec } from "../specs/riskPolicySpec";

export type ClassifiedRisk = {
  id: string;
  originalFinding: string;
  classifiedLevel: RiskLevel;
  policyClause: string;
  reasoning: string;
  requiresApproval: boolean;
};

export function classifyRisk(
  finding: string,
  riskType: keyof RiskPolicySpec["riskClassification"],
  policy: RiskPolicySpec
): ClassifiedRisk {
  const level = policy.riskClassification[riskType];
  const requiresApproval = policy.requiresHumanApprovalFor.includes(level);

  return {
    id: `classified-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    originalFinding: finding,
    classifiedLevel: level,
    policyClause: `${policy.id}:${riskType}`,
    reasoning: `Risk classified as ${level} per policy ${policy.id}`,
    requiresApproval
  };
}
