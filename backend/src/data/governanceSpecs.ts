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
  },
  {
    specId: "spec-101",
    agentId: "agent-003",
    versionId: "ver-101",
    specVersion: "1.0.0",
    purpose: "Safe read-only repo scanning for Repo Safety Scanner Agent",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-101", "bench-102"],
    requiredPolicyCheckIds: ["policy-101", "policy-102"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["scan_repository"],
    prohibitedCapabilities: ["delete_files"],
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
    specId: "spec-102",
    agentId: "agent-003",
    versionId: "ver-102",
    specVersion: "1.1.0",
    purpose: "Restrictive spec for risky Repo Safety Scanner version",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-103", "bench-104"],
    requiredPolicyCheckIds: ["policy-103", "policy-104"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["scan_repository"],
    prohibitedCapabilities: ["delete_files"],
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
    specId: "spec-201",
    agentId: "agent-004",
    versionId: "ver-201",
    specVersion: "1.0.0",
    purpose: "Contract review with human approval required for production",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-201", "bench-202"],
    requiredPolicyCheckIds: ["policy-201", "policy-202"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["review_contract_clauses"],
    prohibitedCapabilities: ["execute_code"],
    dataAccessLevel: "sensitive",
    humanApprovalRequired: true,
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
    specId: "spec-202",
    agentId: "agent-004",
    versionId: "ver-202",
    specVersion: "1.1.0",
    purpose: "Contract review version missing benchmark data",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-205", "bench-206"],
    requiredPolicyCheckIds: ["policy-205", "policy-206"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["review_contract_clauses"],
    prohibitedCapabilities: ["execute_code"],
    dataAccessLevel: "sensitive",
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
    specId: "spec-203",
    agentId: "agent-004",
    versionId: "ver-203",
    specVersion: "1.2.0",
    purpose: "Contract review version with intentional policy failure",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-207", "bench-208"],
    requiredPolicyCheckIds: ["policy-207", "policy-208"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["review_contract_clauses"],
    prohibitedCapabilities: ["execute_code"],
    dataAccessLevel: "sensitive",
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
    specId: "spec-301",
    agentId: "agent-005",
    versionId: "ver-301",
    specVersion: "1.0.0",
    purpose: "Classify-only incident triage",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-301", "bench-302"],
    requiredPolicyCheckIds: ["policy-301", "policy-302"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["classify_incident"],
    prohibitedCapabilities: ["change_permissions"],
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
    specId: "spec-302",
    agentId: "agent-005",
    versionId: "ver-302",
    specVersion: "1.1.0",
    purpose: "Incident triage with restart_service and prior staging for production",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-303", "bench-304"],
    requiredPolicyCheckIds: ["policy-303", "policy-304"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["classify_incident", "restart_service"],
    prohibitedCapabilities: ["change_permissions"],
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
    specId: "spec-303",
    agentId: "agent-005",
    versionId: "ver-303",
    specVersion: "1.2.0",
    purpose: "Incident triage version with prohibited change_permissions capability",
    allowedEnvironments: ["staging", "production"],
    requiredBenchmarkIds: ["bench-305", "bench-306"],
    requiredPolicyCheckIds: ["policy-305", "policy-306"],
    minimumBenchmarkPassRate: 1.0,
    requiredCapabilities: ["classify_incident"],
    prohibitedCapabilities: ["change_permissions"],
    dataAccessLevel: "restricted",
    humanApprovalRequired: false,
    promotionRules: {
      stagingRequiresApproval: true,
      productionRequiresApproval: true,
      productionRequiresPriorStaging: true
    },
    rollbackRules: {
      rollbackAllowed: false,
      rollbackRequiresApprovedTarget: true
    },
    auditRequirements: { ...defaultAuditRequirements }
  }
  // ver-004 and ver-103 intentionally have no governance spec for missing-spec testing
];

export const governanceSpecData = {
  governanceSpecs
};
