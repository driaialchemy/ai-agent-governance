import { getDatabase, persistDatabase } from "../database";

export interface RiskReport {
  id: string;
  agent_id: string;
  version_id: string;
  policy_id: string;
  generated_at: string;
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
  created_at?: string;
  updated_at?: string;
}

export class RiskReportRepository {
  saveReport(report: RiskReport): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    const storedReport: RiskReport = {
      ...report,
      created_at: now,
      updated_at: now
    };

    db.risk_reports.push(storedReport);
    persistDatabase();
  }

  getRiskReport(reportId: string): RiskReport | null {
    const db = getDatabase();
    return db.risk_reports.find(r => r.id === reportId) || null;
  }

  getRiskReportsByAgent(agentId: string): RiskReport[] {
    const db = getDatabase();
    return db.risk_reports
      .filter(r => r.agent_id === agentId)
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
  }

  getRiskReportsByVersion(versionId: string): RiskReport[] {
    const db = getDatabase();
    return db.risk_reports
      .filter(r => r.version_id === versionId)
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
  }

  getAllRiskReports(): RiskReport[] {
    const db = getDatabase();
    return db.risk_reports
      .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
  }

  updateReportApprovalStatus(reportId: string, status: string): void {
    const db = getDatabase();
    const report = db.risk_reports.find(r => r.id === reportId);
    if (report) {
      report.approval.status = status as any;
      report.updated_at = new Date().toISOString();
      persistDatabase();
    }
  }

  clearAllReports(): void {
    const db = getDatabase();
    db.risk_reports = [];
    persistDatabase();
  }
}
