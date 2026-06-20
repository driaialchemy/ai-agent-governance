import { RiskPolicySpec, RiskLevel } from "../specs/riskPolicySpec";
import { AgentActivity, AgentActivityReport } from "../specs/agentActivitySpec";

export type TestRisk = {
  riskId: string;
  riskLevel: RiskLevel;
  category: "failed_test";
  testName: string;
  testPassed: boolean;
  activity: AgentActivity;
  evidence: {
    sourceActivity: string;
    timestamp: string;
    output: string;
  };
};

export function validateTests(
  activityReport: AgentActivityReport,
  policy: RiskPolicySpec
): TestRisk[] {
  const risks: TestRisk[] = [];

  const testRuns = activityReport.activities.filter((a) => a.actionType === "test_run");

  for (const activity of testRuns) {
    if (!activity.testPassed) {
      risks.push({
        riskId: `test-risk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        riskLevel: policy.riskClassification.failedTests,
        category: "failed_test",
        testName: activity.testName || "unknown",
        testPassed: false,
        activity,
        evidence: {
          sourceActivity: activity.id,
          timestamp: activity.timestamp,
          output: activity.testOutput || ""
        }
      });
    }
  }

  return risks;
}

export function shouldBlockDeployment(
  testRisks: TestRisk[],
  policy: RiskPolicySpec
): boolean {
  if (!policy.deploymentBlocks.blockIfTestsFail) {
    return false;
  }

  return testRisks.length > 0;
}
