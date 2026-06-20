import { GovernanceSpec } from "../specs/specTypes";

const defaultAuditRequirements = {
  logApprovalEvaluation: true,
  logPromotionEvaluation: true,
  logPromotionExecution: true,
  logRollbackEvaluation: true,
  logRollbackExecution: true,
  logSpecValidation: true
};

export const governanceSpecs: GovernanceSpec[] = [
  {
    specId: "spec-001",
    agentId: "agent-001",
    versionId: "ver-001",
    specVersion: "1.0.0",
    purpose: "Governance rules for Policy Review Agent v1.0.0",
    allowedEnvironments: ["staging"],
    requiredBenchmarkIds: ["bench-001", "bench-002"],
    requiredPolicyCheckIds: ["policy-001", "policy-002"],
    minimumBenchmarkPassRate: 0.5,
    requiredCapabilities: ["review_policy_text"],
    prohibitedCapabilities: ["execute_code"],
    dataAccessLevel: "internal",
    humanApprovalRequired: false,
    promotionRules: {
      stagingRequiresApproval: true,
      productionRequiresApproval: true,
      productionRequiresPriorStaging: true
    },
    rollbackRules: {
      rollbackAllowed: true,
      rollbackRequiresApprovedTarget: true
    },
    auditRequirements: { ...defaultAuditRequirements }
  },
  {
    specId: "spec-002",
    agentId: "agent-002",
    versionId: "ver-002",
    specVersion: "1.0.0",
    purpose: "Governance rules for Benchmark Summary Agent v1.0.0",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-003", "bench-004"],
    requiredPolicyCheckIds: ["policy-003", "policy-004"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["summarize_benchmarks"],
    prohibitedCapabilities: ["execute_code"],
    dataAccessLevel: "internal",
    humanApprovalRequired: false,
    promotionRules: {
      stagingRequiresApproval: true,
      productionRequiresApproval: true,
      productionRequiresPriorStaging: true
    },
    rollbackRules: {
      rollbackAllowed: true,
      rollbackRequiresApprovedTarget: true
    },
    auditRequirements: { ...defaultAuditRequirements }
  },
  {
    specId: "spec-003",
    agentId: "agent-002",
    versionId: "ver-003",
    specVersion: "1.1.0",
    purpose: "Restrictive governance rules for Benchmark Summary Agent v1.1.0",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-005", "bench-006"],
    requiredPolicyCheckIds: ["policy-005", "policy-006"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["summarize_benchmarks"],
    prohibitedCapabilities: ["execute_code"],
    dataAccessLevel: "sensitive",
    humanApprovalRequired: false,
    promotionRules: {
      stagingRequiresApproval: true,
      productionRequiresApproval: true,
      productionRequiresPriorStaging: false
    },
    rollbackRules: {
      rollbackAllowed: false,
      rollbackRequiresApprovedTarget: true
    },
    auditRequirements: { ...defaultAuditRequirements }
  }
  // ver-004 intentionally has no governance spec for missing-spec testing
];

export const governanceSpecData = {
  governanceSpecs
};
