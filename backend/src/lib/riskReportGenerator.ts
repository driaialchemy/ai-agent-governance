import { RiskPolicySpec } from "../specs/riskPolicySpec";
import { AgentActivityReport } from "../specs/agentActivitySpec";
import { ApprovalRequest } from "./approvalGate";
import { PathRisk } from "./pathValidator";
import { TestRisk } from "./testValidator";
import { RiskFinding, validateEvidence } from "./evidenceValidator";
import { shouldBlockDeployment } from "./testValidator";
import { RiskReportRepository, RiskReport as DbRiskReport } from "../db/repositories/RiskReportRepository";

export type RiskReport = {
  id: string;
  agentId: string;
  versionId: string;
  policyId: string;
  generatedAt: string;

  summary: {
    totalRisks: number;
    risksByLevel: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    testsStatus: "all_passed" | "some_failed" | "not_run";
    pathValidation: "passed" | "failed";
    evidenceValidation: "passed" | "failed";
  };

  findings: Array<{
    findingId: string;
    category: string;
    riskLevel: string;
    description: string;
    evidence: {
      sourceFile?: string;
      lineNumber?: number;
      auditEntryId: string;
      timestamp: string;
    };
    specMapping: {
      policyClause: string;
      requirement: string;
      status: "compliant" | "violation";
    };
  }>;

  approval: {
    required: boolean;
    status: "pending" | "approved" | "rejected" | "not_required";
    approvalRequestId?: string;
    approver?: string;
    approvalTime?: string;
  };

  deploymentRecommendation: {
    canDeploy: boolean;
    blockedBy: string[];
    recommendedActions: string[];
  };
};

function buildFindingsFromRisks(
  pathRisks: PathRisk[],
  testRisks: TestRisk[],
  policy: RiskPolicySpec
): RiskReport["findings"] {
  const allRisks = [...pathRisks, ...testRisks];

  return allRisks.map((risk) => {
    const category = "category" in risk ? risk.category : "unclassified";
    const description =
      category === "failed_test"
        ? `failed_test: ${(risk as TestRisk).testName}`
        : `${category}: ${(risk as PathRisk).path || (risk as TestRisk).testName}`;

    const specClauseKey =
      category === "restricted_file"
        ? "touchingRestrictedFile"
        : category === "failed_test"
          ? "failedTests"
          : "accessingUnpermittedFolder";

    return {
      findingId: risk.riskId,
      category,
      riskLevel: risk.riskLevel,
      description,
      evidence: {
        sourceFile: risk.evidence && "sourceFile" in risk.evidence ? risk.evidence.sourceFile : undefined,
        lineNumber: risk.evidence && "lineNumber" in risk.evidence ? risk.evidence.lineNumber : undefined,
        auditEntryId: risk.evidence?.sourceActivity || "",
        timestamp: risk.evidence?.timestamp || new Date().toISOString()
      },
      specMapping: {
        policyClause: `${policy.id}:${specClauseKey}`,
        requirement: `Compliance check against ${policy.name}`,
        status:
          risk.riskLevel === "critical" || risk.riskLevel === "high"
            ? ("violation" as const)
            : ("compliant" as const)
      }
    };
  });
}

const reportRepo = new RiskReportRepository();

function toDbReport(report: RiskReport): DbRiskReport {
  return {
    id: report.id,
    agent_id: report.agentId,
    version_id: report.versionId,
    policy_id: report.policyId,
    generated_at: report.generatedAt,
    summary: report.summary,
    findings: report.findings,
    approval: report.approval,
    deploymentRecommendation: report.deploymentRecommendation,
  };
}

function fromDbReport(report: DbRiskReport): RiskReport {
  return {
    id: report.id,
    agentId: report.agent_id,
    versionId: report.version_id,
    policyId: report.policy_id,
    generatedAt: report.generated_at,
    summary: report.summary,
    findings: report.findings,
    approval: report.approval,
    deploymentRecommendation: report.deploymentRecommendation,
  };
}

export function generateRiskReport(
  agentId: string,
  versionId: string,
  activityReport: AgentActivityReport,
  pathRisks: PathRisk[],
  testRisks: TestRisk[],
  approvalRequest: ApprovalRequest | null,
  policy: RiskPolicySpec,
  specValidationPassed: boolean = true
): RiskReport {
  const allRisks = [...pathRisks, ...testRisks];

  const risksByLevel = {
    critical: allRisks.filter((r) => r.riskLevel === "critical").length,
    high: allRisks.filter((r) => r.riskLevel === "high").length,
    medium: allRisks.filter((r) => r.riskLevel === "medium").length,
    low: allRisks.filter((r) => r.riskLevel === "low").length
  };

  const testsStatus =
    activityReport.summary.testsFailed > 0
      ? "some_failed"
      : activityReport.summary.testsRun > 0
        ? "all_passed"
        : "not_run";

  const findings = buildFindingsFromRisks(pathRisks, testRisks, policy);

  const evidenceFindings: RiskFinding[] = findings.map((f) => ({
    findingId: f.findingId,
    description: f.description,
    riskLevel: f.riskLevel,
    evidence: {
      sourceFile: f.evidence.sourceFile,
      lineNumber: f.evidence.lineNumber,
      auditEntryId: f.evidence.auditEntryId,
      timestamp: f.evidence.timestamp
    }
  }));

  const evidenceValidation = validateEvidence(evidenceFindings, policy);

  const blockedBy: string[] = [];

  if (shouldBlockDeployment(testRisks, policy)) {
    blockedBy.push("Failed tests");
  }

  if (policy.deploymentBlocks.blockIfHighRiskUnresolved && risksByLevel.high > 0) {
    blockedBy.push("Unresolved high-risk findings");
  }

  if (policy.deploymentBlocks.blockIfHighRiskUnresolved && risksByLevel.critical > 0) {
    blockedBy.push("Critical risk findings");
  }

  if (approvalRequest?.status === "rejected") {
    blockedBy.push("Approval request rejected");
  }

  if (approvalRequest?.status === "pending") {
    blockedBy.push("Approval pending for high/critical risks");
  }

  if (policy.deploymentBlocks.requireSpecValidation && !specValidationPassed) {
    blockedBy.push("Spec validation missing or failed");
  }

  if (!evidenceValidation.isValid) {
    blockedBy.push("Missing evidence citations");
  }

  const approvalRequired = risksByLevel.critical > 0 || risksByLevel.high > 0;

  let approvalStatus: RiskReport["approval"]["status"] = "not_required";
  if (approvalRequired) {
    approvalStatus = approvalRequest?.status ?? "pending";
  }

  const canDeploy =
    blockedBy.length === 0 &&
    (!approvalRequired || approvalRequest?.status === "approved");

  const report: RiskReport = {
    id: `report-${Date.now()}`,
    agentId,
    versionId,
    policyId: policy.id,
    generatedAt: new Date().toISOString(),

    summary: {
      totalRisks: allRisks.length,
      risksByLevel,
      testsStatus,
      pathValidation: pathRisks.length === 0 ? "passed" : "failed",
      evidenceValidation: evidenceValidation.isValid ? "passed" : "failed"
    },

    findings,

    approval: {
      required: approvalRequired,
      status: approvalStatus,
      approvalRequestId: approvalRequest?.id,
      approver: approvalRequest?.approver,
      approvalTime: approvalRequest?.approvalTime
    },

    deploymentRecommendation: {
      canDeploy,
      blockedBy,
      recommendedActions:
        blockedBy.length === 0
          ? ["Ready for deployment"]
          : blockedBy.map((b) => `Resolve: ${b}`)
    }
  };

  // Persist to database
  reportRepo.saveReport(toDbReport(report));

  return report;
}

export function getRiskReport(reportId: string): RiskReport | null {
  const report = reportRepo.getRiskReport(reportId);
  return report ? fromDbReport(report) : null;
}

export function getRiskReportsByAgent(agentId: string): RiskReport[] {
  return reportRepo.getRiskReportsByAgent(agentId).map(fromDbReport);
}

export function getRiskReportsByVersion(versionId: string): RiskReport[] {
  return reportRepo.getRiskReportsByVersion(versionId).map(fromDbReport);
}

export function getAllRiskReports(): RiskReport[] {
  return reportRepo.getAllRiskReports().map(fromDbReport);
}

export function clearAllReports(): void {
  reportRepo.clearAllReports();
}
