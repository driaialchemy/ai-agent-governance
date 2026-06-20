import { RiskPolicySpec } from "../specs/riskPolicySpec";

export const riskPolicies: RiskPolicySpec[] = [
  {
    id: "policy-001",
    name: "Production Agent Governance",
    version: "1.0.0",

    permittedFolders: [
      "/src",
      "/src/data",
      "/src/lib",
      "/tests",
      "/config"
    ],

    restrictedFolders: [
      "/node_modules",
      "/credentials",
      "/secrets",
      "/.env"
    ],

    restrictedFiles: [
      ".env",
      ".env.local",
      "credentials.json",
      "private-key.pem",
      "secrets.yaml"
    ],

    riskClassification: {
      touchingRestrictedFile: "critical",
      accessingUnpermittedFolder: "high",
      missingEvidence: "medium",
      failedTests: "high",
      noHumanApproval: "critical"
    },

    requiresHumanApprovalFor: ["high", "critical"],

    evidenceRequired: {
      mustCiteSourceFile: true,
      mustCiteLineNumber: true,
      mustLinkToAuditEntry: true
    },

    deploymentBlocks: {
      blockIfTestsFail: true,
      blockIfHighRiskUnresolved: true,
      requireSpecValidation: true
    }
  }
];

export function getRiskPolicyById(id: string): RiskPolicySpec | undefined {
  return riskPolicies.find((p) => p.id === id);
}
