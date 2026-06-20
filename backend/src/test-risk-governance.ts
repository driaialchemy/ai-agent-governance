// Risk governance tests — validates all seven governance criteria
// Run with: npx tsx src/test-risk-governance.ts

import { riskPolicies } from "./data/riskPolicies";
import { AgentActivityReport } from "./specs/agentActivitySpec";
import { validatePaths } from "./lib/pathValidator";
import { validateEvidence } from "./lib/evidenceValidator";
import { classifyRisk } from "./lib/policyClassifier";
import {
  createApprovalRequest,
  approveRequest,
  clearApprovalRequests
} from "./lib/approvalGate";
import { validateTests, shouldBlockDeployment } from "./lib/testValidator";
import { generateRiskReport } from "./lib/riskReportGenerator";
import { clearActivityLog } from "./lib/activityLogger";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`✗ FAILED: ${testName}`);
    testsFailed++;
  }
}

function assertEquals<T>(actual: T, expected: T, testName: string): void {
  assert(actual === expected, testName);
}

console.log("RISK GOVERNANCE TESTS");
console.log("=====================\n");

const policy = riskPolicies[0];

// Criterion 1: Permitted folder validation
console.log("TEST GROUP: Path Validation (Criteria 1 & 2)");
console.log("---------------------------------------------");

const unpermittedReport: AgentActivityReport = {
  agentId: "agent-001",
  versionId: "ver-001",
  executionStartTime: new Date().toISOString(),
  executionEndTime: new Date().toISOString(),
  activities: [
    {
      id: "activity-1",
      agentId: "agent-001",
      versionId: "ver-001",
      timestamp: new Date().toISOString(),
      actionType: "file_access",
      path: "/node_modules/malicious/code.js",
      accessType: "read",
      description: "Accessed node_modules",
      evidence: { timestamp: new Date().toISOString() }
    }
  ],
  summary: { filesAccessed: [], foldersAccessed: [], testsRun: 0, testsPassed: 0, testsFailed: 0 }
};

const unpermittedRisks = validatePaths(unpermittedReport, policy);
assert(unpermittedRisks.length > 0, "detects agent accessing unpermitted folder");
assertEquals(unpermittedRisks[0].riskLevel, "high", "unpermitted folder classified as high risk");

const restrictedFileReport: AgentActivityReport = {
  agentId: "agent-001",
  versionId: "ver-001",
  executionStartTime: new Date().toISOString(),
  executionEndTime: new Date().toISOString(),
  activities: [
    {
      id: "activity-2",
      agentId: "agent-001",
      versionId: "ver-001",
      timestamp: new Date().toISOString(),
      actionType: "file_access",
      path: "/config/.env",
      accessType: "read",
      description: "Accessed .env",
      evidence: { timestamp: new Date().toISOString() }
    }
  ],
  summary: { filesAccessed: [], foldersAccessed: [], testsRun: 0, testsPassed: 0, testsFailed: 0 }
};

const restrictedRisks = validatePaths(restrictedFileReport, policy);
assert(restrictedRisks.length > 0, "detects agent touching restricted file");
assertEquals(restrictedRisks[0].category, "restricted_file", "restricted file category");
assertEquals(restrictedRisks[0].riskLevel, "critical", "restricted file is critical risk");

console.log("");

// Criterion 3: Evidence validation
console.log("TEST GROUP: Evidence Validation (Criterion 3)");
console.log("----------------------------------------------");

const completeFindings = [
  {
    findingId: "finding-1",
    description: "Unauthorized access",
    riskLevel: "high",
    evidence: {
      sourceFile: "/src/agent.ts",
      lineNumber: 42,
      auditEntryId: "audit-001",
      timestamp: new Date().toISOString()
    }
  }
];

const completeValidation = validateEvidence(completeFindings, policy);
assert(completeValidation.isValid, "validates complete evidence");

const incompleteFindings = [
  {
    findingId: "finding-2",
    description: "Unauthorized access",
    riskLevel: "high",
    evidence: {
      auditEntryId: "audit-001",
      timestamp: new Date().toISOString()
    }
  }
];

const incompleteValidation = validateEvidence(incompleteFindings, policy);
assert(!incompleteValidation.isValid, "detects missing evidence citation");
assert(incompleteValidation.missingEvidence.length > 0, "reports missing evidence fields");

console.log("");

// Criterion 4: Policy classification
console.log("TEST GROUP: Policy Classification (Criterion 4)");
console.log("----------------------------------------------");

const classified = classifyRisk("Unauthorized file access", "touchingRestrictedFile", policy);
assertEquals(classified.classifiedLevel, "critical", "classifies risk according to policy");
assert(classified.requiresApproval, "critical risk requires approval");

console.log("");

// Criterion 5: Human approval
console.log("TEST GROUP: Human Approval (Criterion 5)");
console.log("----------------------------------------");

clearApprovalRequests();

const risks = [{ id: "risk-1", description: "Critical finding", level: "critical" as const }];
const approvalRequest = createApprovalRequest("agent-001", "ver-001", risks, policy);
assertEquals(approvalRequest.status, "pending", "routes high/critical risk to human approval");
assert(approvalRequest.risks.length > 0, "approval request includes risks");

const approved = approveRequest(approvalRequest.id, "reviewer@company.com", "Reviewed and approved");
assertEquals(approved.status, "approved", "approves high-risk findings");
assertEquals(approved.approver, "reviewer@company.com", "records approver");

console.log("");

// Criterion 6: Test pass requirement
console.log("TEST GROUP: Test Validation (Criterion 6)");
console.log("-----------------------------------------");

const failingTestRisks = [
  {
    riskId: "test-risk-1",
    riskLevel: "high" as const,
    category: "failed_test" as const,
    testName: "deployment_test",
    testPassed: false,
    activity: {} as AgentActivityReport["activities"][0],
    evidence: {
      sourceActivity: "activity-1",
      timestamp: new Date().toISOString(),
      output: "Test failed"
    }
  }
];

assert(shouldBlockDeployment(failingTestRisks, policy), "blocks deployment if tests fail");
assert(!shouldBlockDeployment([], policy), "allows deployment when tests pass");

console.log("");

// Criterion 7: Spec mapping
console.log("TEST GROUP: Spec Mapping & Report (Criterion 7)");
console.log("-----------------------------------------------");

const emptyReport: AgentActivityReport = {
  agentId: "agent-001",
  versionId: "ver-001",
  executionStartTime: new Date().toISOString(),
  executionEndTime: new Date().toISOString(),
  activities: [],
  summary: { filesAccessed: [], foldersAccessed: [], testsRun: 0, testsPassed: 0, testsFailed: 0 }
};

const specReport = generateRiskReport(
  "agent-001",
  "ver-001",
  emptyReport,
  [],
  [],
  null,
  policy,
  true
);

assert(
  specReport.findings.every((f) => f.specMapping && f.specMapping.policyClause),
  "maps findings back to spec"
);

const passingTestsReport: AgentActivityReport = {
  agentId: "agent-001",
  versionId: "ver-001",
  executionStartTime: new Date().toISOString(),
  executionEndTime: new Date().toISOString(),
  activities: [],
  summary: { filesAccessed: [], foldersAccessed: [], testsRun: 5, testsPassed: 5, testsFailed: 0 }
};

const fullReport = generateRiskReport(
  "agent-001",
  "ver-001",
  passingTestsReport,
  [],
  [],
  null,
  policy,
  true
);

assert(!!fullReport.id, "generates complete risk report with id");
assert(!!fullReport.summary, "report includes summary");
assert(!!fullReport.deploymentRecommendation, "report includes deployment recommendation");
assertEquals(fullReport.summary.testsStatus, "all_passed", "report shows tests passed");

console.log("");
console.log("=========================");
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

clearActivityLog();
clearApprovalRequests();

if (testsFailed > 0) {
  console.log("\n❌ SOME RISK GOVERNANCE TESTS FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL RISK GOVERNANCE TESTS PASSED");
  process.exit(0);
}
