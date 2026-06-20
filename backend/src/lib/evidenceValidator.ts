import { RiskPolicySpec } from "../specs/riskPolicySpec";

export type RiskFinding = {
  findingId: string;
  description: string;
  riskLevel: string;
  evidence: {
    sourceFile?: string;
    lineNumber?: number;
    auditEntryId?: string;
    timestamp: string;
  };
};

export type EvidenceValidation = {
  isValid: boolean;
  missingEvidence: string[];
  findings: RiskFinding[];
};

export function validateEvidence(
  findings: RiskFinding[],
  policy: RiskPolicySpec
): EvidenceValidation {
  const missingEvidence: string[] = [];

  for (const finding of findings) {
    const evidence = finding.evidence;

    if (policy.evidenceRequired.mustCiteSourceFile && !evidence.sourceFile) {
      missingEvidence.push(`Finding ${finding.findingId} missing source file`);
    }

    if (policy.evidenceRequired.mustCiteLineNumber && evidence.lineNumber === undefined) {
      missingEvidence.push(`Finding ${finding.findingId} missing line number`);
    }

    if (policy.evidenceRequired.mustLinkToAuditEntry && !evidence.auditEntryId) {
      missingEvidence.push(`Finding ${finding.findingId} missing audit entry link`);
    }
  }

  return {
    isValid: missingEvidence.length === 0,
    missingEvidence,
    findings
  };
}
