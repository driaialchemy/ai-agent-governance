export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskPolicySpec = {
  id: string;
  name: string;
  version: string;

  permittedFolders: string[];
  restrictedFolders: string[];
  restrictedFiles: string[];

  riskClassification: {
    touchingRestrictedFile: RiskLevel;
    accessingUnpermittedFolder: RiskLevel;
    missingEvidence: RiskLevel;
    failedTests: RiskLevel;
    noHumanApproval: RiskLevel;
  };

  requiresHumanApprovalFor: RiskLevel[];

  evidenceRequired: {
    mustCiteSourceFile: boolean;
    mustCiteLineNumber: boolean;
    mustLinkToAuditEntry: boolean;
  };

  deploymentBlocks: {
    blockIfTestsFail: boolean;
    blockIfHighRiskUnresolved: boolean;
    requireSpecValidation: boolean;
  };
};
