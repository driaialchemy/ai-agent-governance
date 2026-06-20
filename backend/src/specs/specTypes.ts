export type GovernanceEnvironment = "staging" | "production";

export type DataAccessLevel = "public" | "internal" | "sensitive" | "restricted";

export type SpecValidationOutcome = "passed" | "failed" | "missing_spec";

export interface PromotionRules {
  stagingRequiresApproval: boolean;
  productionRequiresApproval: boolean;
  productionRequiresPriorStaging: boolean;
}

export interface RollbackRules {
  rollbackAllowed: boolean;
  rollbackRequiresApprovedTarget: boolean;
}

export interface AuditRequirements {
  logApprovalEvaluation: boolean;
  logPromotionEvaluation: boolean;
  logPromotionExecution: boolean;
  logRollbackEvaluation: boolean;
  logRollbackExecution: boolean;
  logSpecValidation: boolean;
}

export interface GovernanceSpec {
  specId: string;
  agentId: string;
  versionId: string;
  specVersion: string;
  purpose: string;
  allowedEnvironments: GovernanceEnvironment[];
  requiredBenchmarkIds: string[];
  requiredPolicyCheckIds: string[];
  minimumBenchmarkPassRate: number;
  requiredCapabilities: string[];
  prohibitedCapabilities: string[];
  dataAccessLevel: DataAccessLevel;
  humanApprovalRequired: boolean;
  promotionRules: PromotionRules;
  rollbackRules: RollbackRules;
  auditRequirements: AuditRequirements;
}

export interface SpecValidationResult {
  allowed: boolean;
  outcome: SpecValidationOutcome;
  reasons: string[];
  specId?: string;
  specVersion?: string;
}
