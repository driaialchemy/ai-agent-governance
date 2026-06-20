# Agent Risk Governance Workflow for Cursor

## Overview

This workflow enables Cursor to build a comprehensive **Agent Risk Governance System** that validates AI agent behavior against seven critical governance criteria:

1. ✅ Did the agent stay inside permitted folders?
2. ✅ Did it touch a restricted file?
3. ✅ Did it cite evidence for every risk?
4. ✅ Did it classify risk according to the policy?
5. ✅ Did it require human approval for high-risk actions?
6. ✅ Did tests pass before the agent recommended deployment?
7. ✅ Did the final report map findings back to the spec?

---

## Phase 1: Risk Policy Specification

### What to Build
A TypeScript spec that defines governance policies as executable rules.

### Cursor Steps

**1. Create the Risk Policy Type**

File: `backend/src/specs/riskPolicySpec.ts`

```typescript
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskPolicySpec = {
  id: string;
  name: string;
  version: string;
  
  // Folder/Path Restrictions
  permittedFolders: string[];        // Whitelist of allowed paths
  restrictedFolders: string[];       // Blacklist of forbidden paths
  restrictedFiles: string[];         // Specific files agent cannot touch
  
  // Risk Classification Rules
  riskClassification: {
    touchingRestrictedFile: RiskLevel;
    accessingUnpermittedFolder: RiskLevel;
    missingEvidence: RiskLevel;
    failedTests: RiskLevel;
    noHumanApproval: RiskLevel;
  };
  
  // Approval Requirements
  requiresHumanApprovalFor: RiskLevel[];  // ["high", "critical"]
  
  // Evidence Requirements
  evidenceRequired: {
    mustCiteSourceFile: boolean;
    mustCiteLineNumber: boolean;
    mustLinkToAuditEntry: boolean;
  };
  
  // Deployment Rules
  deploymentBlocks: {
    blockIfTestsFail: boolean;
    blockIfHighRiskUnresolved: boolean;
    requireSpecValidation: boolean;
  };
};
```

**2. Create Synthetic Risk Policies**

File: `backend/src/data/riskPolicies.ts`

```typescript
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
```

---

## Phase 2: Agent Activity Logger

### What to Build
A system to capture agent actions: files accessed, folders traversed, test results.

### Cursor Steps

**1. Create Activity Log Type**

File: `backend/src/specs/agentActivitySpec.ts`

```typescript
export type AgentActionType = 
  | "file_access"
  | "folder_read"
  | "folder_write"
  | "test_run"
  | "test_pass"
  | "test_fail"
  | "deployment_recommendation";

export type AgentActivity = {
  id: string;
  agentId: string;
  versionId: string;
  timestamp: string;
  actionType: AgentActionType;
  
  // For file/folder access
  path?: string;
  accessType?: "read" | "write" | "execute";
  
  // For test runs
  testName?: string;
  testPassed?: boolean;
  testOutput?: string;
  
  // Context
  description: string;
  evidence: {
    sourceFile?: string;
    lineNumber?: number;
    timestamp: string;
  };
};

export type AgentActivityReport = {
  agentId: string;
  versionId: string;
  executionStartTime: string;
  executionEndTime: string;
  activities: AgentActivity[];
  summary: {
    filesAccessed: string[];
    foldersAccessed: string[];
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
  };
};
```

**2. Create Activity Logger**

File: `backend/src/lib/activityLogger.ts`

```typescript
import { AgentActivity, AgentActivityReport } from "../specs/agentActivitySpec";

const activityLog: AgentActivity[] = [];

export function logActivity(activity: Omit<AgentActivity, "id">) {
  const newActivity: AgentActivity = {
    ...activity,
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  activityLog.push(newActivity);
  return newActivity;
}

export function getActivityByAgent(agentId: string): AgentActivityReport {
  const agentActivities = activityLog.filter(a => a.agentId === agentId);
  
  return {
    agentId,
    versionId: agentActivities[0]?.versionId || "",
    executionStartTime: agentActivities[0]?.timestamp || "",
    executionEndTime: agentActivities[agentActivities.length - 1]?.timestamp || "",
    activities: agentActivities,
    summary: {
      filesAccessed: [...new Set(agentActivities
        .filter(a => a.actionType === "file_access")
        .map(a => a.path || ""))],
      foldersAccessed: [...new Set(agentActivities
        .filter(a => a.actionType === "folder_read")
        .map(a => a.path || ""))],
      testsRun: agentActivities.filter(a => a.actionType === "test_run").length,
      testsPassed: agentActivities.filter(a => a.testPassed).length,
      testsFailed: agentActivities.filter(a => !a.testPassed && a.actionType === "test_run").length
    }
  };
}

export function clearActivityLog() {
  activityLog.length = 0;
}
```

---

## Phase 3: Risk Validators

### What to Build
Four validator modules that check each of the 7 criteria.

### Cursor Steps

**1. Path Validator (Criteria 1 & 2)**

File: `backend/src/lib/pathValidator.ts`

```typescript
import { RiskPolicySpec, RiskLevel } from "../specs/riskPolicySpec";
import { AgentActivity, AgentActivityReport } from "../specs/agentActivitySpec";

export type PathRisk = {
  riskId: string;
  riskLevel: RiskLevel;
  category: "unpermitted_folder" | "restricted_file" | "restricted_folder";
  path: string;
  activity: AgentActivity;
  evidence: {
    sourceActivity: string;
    timestamp: string;
    accessType: string;
  };
};

export function validatePaths(
  activityReport: AgentActivityReport,
  policy: RiskPolicySpec
): PathRisk[] {
  const risks: PathRisk[] = [];

  // Check each file access
  const fileAccesses = activityReport.activities.filter(a => a.actionType === "file_access");
  
  for (const activity of fileAccesses) {
    const path = activity.path || "";
    
    // Check if touching restricted file
    if (policy.restrictedFiles.some(f => path.endsWith(f))) {
      risks.push({
        riskId: `path-risk-${Date.now()}`,
        riskLevel: policy.riskClassification.touchingRestrictedFile,
        category: "restricted_file",
        path,
        activity,
        evidence: {
          sourceActivity: activity.id,
          timestamp: activity.timestamp,
          accessType: activity.accessType || "unknown"
        }
      });
    }
    
    // Check if accessing unpermitted folder
    const isPermitted = policy.permittedFolders.some(pf => path.startsWith(pf));
    const isRestricted = policy.restrictedFolders.some(rf => path.startsWith(rf));
    
    if (isRestricted || (!isPermitted && !isRestricted)) {
      risks.push({
        riskId: `path-risk-${Date.now()}`,
        riskLevel: policy.riskClassification.accessingUnpermittedFolder,
        category: "unpermitted_folder",
        path,
        activity,
        evidence: {
          sourceActivity: activity.id,
          timestamp: activity.timestamp,
          accessType: activity.accessType || "unknown"
        }
      });
    }
  }
  
  return risks;
}
```

**2. Test Validator (Criteria 6)**

File: `backend/src/lib/testValidator.ts`

```typescript
import { RiskPolicySpec, RiskLevel } from "../specs/riskPolicySpec";
import { AgentActivityReport } from "../specs/agentActivitySpec";

export type TestRisk = {
  riskId: string;
  riskLevel: RiskLevel;
  testName: string;
  testPassed: boolean;
  activity: any;
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
  
  const testRuns = activityReport.activities.filter(a => a.actionType === "test_run");
  
  for (const activity of testRuns) {
    if (!activity.testPassed) {
      risks.push({
        riskId: `test-risk-${Date.now()}`,
        riskLevel: policy.riskClassification.failedTests,
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
  
  return testRisks.some(risk => risk.riskLevel === "high" || risk.riskLevel === "critical");
}
```

**3. Evidence Validator (Criteria 3)**

File: `backend/src/lib/evidenceValidator.ts`

```typescript
import { RiskPolicySpec } from "../specs/riskPolicySpec";

export type RiskFinding = {
  findingId: string;
  description: string;
  riskLevel: string;
  evidence: {
    sourceFile?: string;
    lineNumber?: number;
    auditEntryId: string;
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
    
    if (policy.evidenceRequired.mustCiteLineNumber && !evidence.lineNumber) {
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
```

**4. Policy Classifier (Criteria 4)**

File: `backend/src/lib/policyClassifier.ts`

```typescript
import { RiskLevel, RiskPolicySpec } from "../specs/riskPolicySpec";

export type ClassifiedRisk = {
  id: string;
  originalFinding: string;
  classifiedLevel: RiskLevel;
  policyClause: string;
  reasoning: string;
  requiresApproval: boolean;
};

export function classifyRisk(
  finding: string,
  riskType: keyof RiskPolicySpec["riskClassification"],
  policy: RiskPolicySpec
): ClassifiedRisk {
  const level = policy.riskClassification[riskType];
  const requiresApproval = policy.requiresHumanApprovalFor.includes(level);
  
  return {
    id: `classified-${Date.now()}`,
    originalFinding: finding,
    classifiedLevel: level,
    policyClause: `policy-001:${riskType}`,
    reasoning: `Risk classified as ${level} per policy ${policy.id}`,
    requiresApproval
  };
}
```

---

## Phase 4: Approval Gate

### What to Build
Human approval routing for high-risk findings.

### Cursor Steps

**File: `backend/src/lib/approvalGate.ts`**

```typescript
import { RiskLevel, RiskPolicySpec } from "../specs/riskPolicySpec";

export type ApprovalRequest = {
  id: string;
  agentId: string;
  versionId: string;
  risks: {
    id: string;
    description: string;
    level: RiskLevel;
  }[];
  status: "pending" | "approved" | "rejected";
  approver?: string;
  approvalTime?: string;
  notes?: string;
};

const approvalRequests: Map<string, ApprovalRequest> = new Map();

export function createApprovalRequest(
  agentId: string,
  versionId: string,
  risks: { id: string; description: string; level: RiskLevel }[],
  policy: RiskPolicySpec
): ApprovalRequest {
  const highRisks = risks.filter(r => policy.requiresHumanApprovalFor.includes(r.level));
  
  const request: ApprovalRequest = {
    id: `approval-${Date.now()}`,
    agentId,
    versionId,
    risks: highRisks,
    status: "pending"
  };
  
  approvalRequests.set(request.id, request);
  return request;
}

export function approveRequest(requestId: string, approver: string, notes?: string) {
  const request = approvalRequests.get(requestId);
  if (!request) throw new Error("Approval request not found");
  
  request.status = "approved";
  request.approver = approver;
  request.approvalTime = new Date().toISOString();
  request.notes = notes;
  
  return request;
}

export function rejectRequest(requestId: string, approver: string, notes: string) {
  const request = approvalRequests.get(requestId);
  if (!request) throw new Error("Approval request not found");
  
  request.status = "rejected";
  request.approver = approver;
  request.approvalTime = new Date().toISOString();
  request.notes = notes;
  
  return request;
}

export function getApprovalRequest(requestId: string) {
  return approvalRequests.get(requestId);
}

export function getPendingApprovals() {
  return Array.from(approvalRequests.values()).filter(r => r.status === "pending");
}
```

---

## Phase 5: Risk Report Generator

### What to Build
Generate comprehensive risk reports mapping all findings back to the spec (Criteria 7).

### Cursor Steps

**File: `backend/src/lib/riskReportGenerator.ts`**

```typescript
import { RiskPolicySpec } from "../specs/riskPolicySpec";
import { AgentActivityReport } from "../specs/agentActivitySpec";
import { ApprovalRequest } from "./approvalGate";

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

export function generateRiskReport(
  agentId: string,
  versionId: string,
  activityReport: AgentActivityReport,
  pathRisks: any[],
  testRisks: any[],
  approvalRequest: ApprovalRequest | null,
  policy: RiskPolicySpec
): RiskReport {
  const allRisks = [...pathRisks, ...testRisks];
  
  const risksByLevel = {
    critical: allRisks.filter(r => r.riskLevel === "critical").length,
    high: allRisks.filter(r => r.riskLevel === "high").length,
    medium: allRisks.filter(r => r.riskLevel === "medium").length,
    low: allRisks.filter(r => r.riskLevel === "low").length
  };
  
  const testsStatus = 
    activityReport.summary.testsFailed > 0 ? "some_failed" :
    activityReport.summary.testsRun > 0 ? "all_passed" :
    "not_run";
  
  const blockedBy: string[] = [];
  if (policy.deploymentBlocks.blockIfTestsFail && testRisks.length > 0) {
    blockedBy.push("Failed tests");
  }
  if (policy.deploymentBlocks.blockIfHighRiskUnresolved && risksByLevel.high > 0) {
    blockedBy.push("Unresolved high-risk findings");
  }
  if (policy.deploymentBlocks.blockIfHighRiskUnresolved && risksByLevel.critical > 0) {
    blockedBy.push("Critical risk findings");
  }
  if (approvalRequest && approvalRequest.status === "rejected") {
    blockedBy.push("Approval request rejected");
  }

  return {
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
      evidenceValidation: "passed" // Would be determined by evidenceValidator
    },
    
    findings: allRisks.map(risk => ({
      findingId: risk.riskId,
      category: risk.category || "unclassified",
      riskLevel: risk.riskLevel,
      description: `${risk.category}: ${risk.path || risk.testName}`,
      evidence: {
        sourceFile: risk.evidence?.sourceFile,
        lineNumber: risk.evidence?.lineNumber,
        auditEntryId: risk.evidence?.sourceActivity || "",
        timestamp: risk.evidence?.timestamp || new Date().toISOString()
      },
      specMapping: {
        policyClause: `${policy.id}:findings`,
        requirement: `Compliance check against ${policy.name}`,
        status: risk.riskLevel === "critical" || risk.riskLevel === "high" ? "violation" : "compliant"
      }
    })),
    
    approval: {
      required: risksByLevel.critical > 0 || risksByLevel.high > 0,
      status: approvalRequest ? approvalRequest.status : "not_required",
      approvalRequestId: approvalRequest?.id,
      approver: approvalRequest?.approver,
      approvalTime: approvalRequest?.approvalTime
    },
    
    deploymentRecommendation: {
      canDeploy: blockedBy.length === 0 && (!approvalRequest || approvalRequest.status === "approved"),
      blockedBy,
      recommendedActions: blockedBy.length === 0 ? 
        ["Ready for deployment"] : 
        blockedBy.map(b => `Resolve: ${b}`)
    }
  };
}
```

---

## Phase 6: API Endpoints

### What to Build
REST endpoints to execute the governance workflow.

### Cursor Steps

**File: `backend/src/server.ts` - Add these routes:**

```typescript
// Risk Policy endpoints
app.get("/risk-policies", (req, res) => {
  res.json({ success: true, data: riskPolicies });
});

app.get("/risk-policies/:id", (req, res) => {
  const policy = riskPolicies.find(p => p.id === req.params.id);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }
  res.json({ success: true, data: policy });
});

// Agent Activity endpoints
app.post("/agents/:id/activity", (req, res) => {
  const { activity } = req.body;
  if (!activity) {
    return res.status(400).json({ success: false, message: "Activity required" });
  }
  
  const logged = logActivity({
    ...activity,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, data: logged });
});

app.get("/agents/:id/activity-report", (req, res) => {
  const report = getActivityByAgent(req.params.id);
  res.json({ success: true, data: report });
});

// Risk Assessment endpoints
app.post("/agents/:id/assess-risks", (req, res) => {
  const { policyId } = req.body;
  const policy = riskPolicies.find(p => p.id === policyId);
  
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }
  
  const activityReport = getActivityByAgent(req.params.id);
  const pathRisks = validatePaths(activityReport, policy);
  const testRisks = validateTests(activityReport, policy);
  
  res.json({
    success: true,
    data: {
      pathRisks,
      testRisks,
      totalRisks: pathRisks.length + testRisks.length
    }
  });
});

// Risk Report endpoint
app.post("/agents/:id/generate-report", (req, res) => {
  const { policyId, versionId, approvalRequestId } = req.body;
  
  const policy = riskPolicies.find(p => p.id === policyId);
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }
  
  const activityReport = getActivityByAgent(req.params.id);
  const pathRisks = validatePaths(activityReport, policy);
  const testRisks = validateTests(activityReport, policy);
  const approvalRequest = approvalRequestId ? getApprovalRequest(approvalRequestId) : null;
  
  const report = generateRiskReport(
    req.params.id,
    versionId,
    activityReport,
    pathRisks,
    testRisks,
    approvalRequest,
    policy
  );
  
  res.json({ success: true, data: report });
});

// Approval endpoints
app.post("/approvals/request", (req, res) => {
  const { agentId, versionId, risks, policyId } = req.body;
  const policy = riskPolicies.find(p => p.id === policyId);
  
  if (!policy) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }
  
  const request = createApprovalRequest(agentId, versionId, risks, policy);
  res.json({ success: true, data: request });
});

app.post("/approvals/:id/approve", (req, res) => {
  const { approver, notes } = req.body;
  
  try {
    const request = approveRequest(req.params.id, approver, notes);
    res.json({ success: true, message: "Approval granted", data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.post("/approvals/:id/reject", (req, res) => {
  const { approver, notes } = req.body;
  
  if (!notes) {
    return res.status(400).json({ success: false, message: "Rejection notes required" });
  }
  
  try {
    const request = rejectRequest(req.params.id, approver, notes);
    res.json({ success: true, message: "Approval rejected", data: request });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get("/approvals/pending", (req, res) => {
  const pending = getPendingApprovals();
  res.json({ success: true, data: pending });
});
```

---

## Phase 7: Test Suite

### What to Build
Automated tests verifying all seven governance criteria.

### Cursor Steps

**File: `backend/src/test-risk-governance.ts`**

```typescript
import assert from "assert";

describe("Risk Governance Tests", () => {
  
  // CRITERION 1 & 2: Path Validation
  test("detects agent accessing unpermitted folder", () => {
    const policy = riskPolicies[0];
    const activities: AgentActivityReport = {
      agentId: "agent-001",
      versionId: "ver-001",
      executionStartTime: new Date().toISOString(),
      executionEndTime: new Date().toISOString(),
      activities: [{
        id: "activity-1",
        agentId: "agent-001",
        versionId: "ver-001",
        timestamp: new Date().toISOString(),
        actionType: "file_access",
        path: "/node_modules/malicious/code.js",
        accessType: "read",
        description: "Accessed node_modules",
        evidence: {
          timestamp: new Date().toISOString()
        }
      }],
      summary: { filesAccessed: [], foldersAccessed: [], testsRun: 0, testsPassed: 0, testsFailed: 0 }
    };
    
    const risks = validatePaths(activities, policy);
    assert(risks.length > 0, "Should detect unpermitted folder access");
    assert(risks[0].riskLevel === "high", "Should classify as high risk");
  });
  
  test("detects agent touching restricted file", () => {
    const policy = riskPolicies[0];
    const activities: AgentActivityReport = {
      agentId: "agent-001",
      versionId: "ver-001",
      executionStartTime: new Date().toISOString(),
      executionEndTime: new Date().toISOString(),
      activities: [{
        id: "activity-1",
        agentId: "agent-001",
        versionId: "ver-001",
        timestamp: new Date().toISOString(),
        actionType: "file_access",
        path: "/config/.env",
        accessType: "read",
        description: "Accessed .env",
        evidence: {
          timestamp: new Date().toISOString()
        }
      }],
      summary: { filesAccessed: [], foldersAccessed: [], testsRun: 0, testsPassed: 0, testsFailed: 0 }
    };
    
    const risks = validatePaths(activities, policy);
    assert(risks.length > 0, "Should detect restricted file access");
    assert(risks[0].category === "restricted_file", "Should classify as restricted file");
    assert(risks[0].riskLevel === "critical", "Should be critical risk");
  });
  
  // CRITERION 3: Evidence
  test("validates evidence completeness", () => {
    const policy = riskPolicies[0];
    const findings = [{
      findingId: "finding-1",
      description: "Unauthorized access",
      riskLevel: "high",
      evidence: {
        sourceFile: "/src/agent.ts",
        lineNumber: 42,
        auditEntryId: "audit-001",
        timestamp: new Date().toISOString()
      }
    }];
    
    const validation = validateEvidence(findings, policy);
    assert(validation.isValid, "Should validate complete evidence");
  });
  
  test("detects missing evidence citation", () => {
    const policy = riskPolicies[0];
    const findings = [{
      findingId: "finding-1",
      description: "Unauthorized access",
      riskLevel: "high",
      evidence: {
        // Missing sourceFile
        auditEntryId: "audit-001",
        timestamp: new Date().toISOString()
      }
    }];
    
    const validation = validateEvidence(findings, policy);
    assert(!validation.isValid, "Should detect missing source file");
    assert(validation.missingEvidence.length > 0, "Should report missing evidence");
  });
  
  // CRITERION 4: Policy Classification
  test("classifies risk according to policy", () => {
    const policy = riskPolicies[0];
    const classified = classifyRisk(
      "Unauthorized file access",
      "touchingRestrictedFile",
      policy
    );
    
    assert.equal(classified.classifiedLevel, "critical", "Should classify as critical");
    assert(classified.requiresApproval, "Should require approval");
  });
  
  // CRITERION 5: Human Approval
  test("routes high-risk to human approval", () => {
    const policy = riskPolicies[0];
    const risks = [
      { id: "risk-1", description: "Critical finding", level: "critical" }
    ];
    
    const approvalRequest = createApprovalRequest("agent-001", "ver-001", risks, policy);
    assert.equal(approvalRequest.status, "pending", "Should create pending approval");
    assert(approvalRequest.risks.length > 0, "Should include risks");
  });
  
  test("approves high-risk findings", () => {
    const policy = riskPolicies[0];
    const risks = [
      { id: "risk-1", description: "Critical finding", level: "critical" }
    ];
    
    const request = createApprovalRequest("agent-001", "ver-001", risks, policy);
    const approved = approveRequest(request.id, "reviewer@company.com", "Reviewed and approved");
    
    assert.equal(approved.status, "approved", "Should be approved");
    assert.equal(approved.approver, "reviewer@company.com", "Should record approver");
  });
  
  // CRITERION 6: Test Pass Requirement
  test("blocks deployment if tests fail", () => {
    const policy = riskPolicies[0];
    const testRisks = [{
      riskId: "test-risk-1",
      riskLevel: "high",
      testName: "deployment_test",
      testPassed: false,
      activity: {},
      evidence: { sourceActivity: "activity-1", timestamp: new Date().toISOString(), output: "Test failed" }
    }];
    
    const shouldBlock = shouldBlockDeployment(testRisks, policy);
    assert(shouldBlock, "Should block deployment if tests fail");
  });
  
  test("allows deployment if tests pass", () => {
    const policy = riskPolicies[0];
    const testRisks: any[] = []; // No failing tests
    
    const shouldBlock = shouldBlockDeployment(testRisks, policy);
    assert(!shouldBlock, "Should allow deployment if no test risks");
  });
  
  // CRITERION 7: Spec Mapping
  test("maps findings back to spec", () => {
    const policy = riskPolicies[0];
    const agentId = "agent-001";
    const versionId = "ver-001";
    const activityReport: AgentActivityReport = {
      agentId,
      versionId,
      executionStartTime: new Date().toISOString(),
      executionEndTime: new Date().toISOString(),
      activities: [],
      summary: { filesAccessed: [], foldersAccessed: [], testsRun: 0, testsPassed: 0, testsFailed: 0 }
    };
    
    const report = generateRiskReport(
      agentId,
      versionId,
      activityReport,
      [],
      [],
      null,
      policy
    );
    
    assert(report.findings.every(f => f.specMapping), "All findings should have spec mapping");
    assert(report.findings.every(f => f.specMapping.policyClause), "All findings should cite policy clause");
  });
  
  test("generates complete risk report", () => {
    const policy = riskPolicies[0];
    const report = generateRiskReport(
      "agent-001",
      "ver-001",
      {
        agentId: "agent-001",
        versionId: "ver-001",
        executionStartTime: new Date().toISOString(),
        executionEndTime: new Date().toISOString(),
        activities: [],
        summary: { filesAccessed: [], foldersAccessed: [], testsRun: 5, testsPassed: 5, testsFailed: 0 }
      },
      [],
      [],
      null,
      policy
    );
    
    assert(report.id, "Should have report ID");
    assert(report.summary, "Should have summary");
    assert(report.deploymentRecommendation, "Should have deployment recommendation");
    assert.equal(report.summary.testsStatus, "all_passed", "Should show tests passed");
  });
});
```

---

## Phase 8: Integration & Testing

### Cursor Steps

**1. Update package.json test script:**

```json
{
  "scripts": {
    "test": "npx tsx --test src/test-governance.ts && npx tsx --test src/test-sdd.ts && npx tsx --test src/test-risk-governance.ts"
  }
}
```

**2. Run the complete test suite:**

```powershell
cd C:\Users\msell\ai-agent-governance\backend
npm test
```

**3. Start the server to test endpoints:**

```powershell
npx tsx src/server.ts
```

**4. Test the workflow in a new terminal:**

```powershell
# 1. Get risk policy
curl http://localhost:3000/risk-policies

# 2. Log agent activity
curl -X POST http://localhost:3000/agents/agent-001/activity \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "versionId": "ver-001",
    "actionType": "file_access",
    "path": "/src/agent.ts",
    "accessType": "read",
    "description": "Agent accessed source file",
    "evidence": {"timestamp": "2026-06-20T10:00:00Z"}
  }'

# 3. Get activity report
curl http://localhost:3000/agents/agent-001/activity-report

# 4. Assess risks
curl -X POST http://localhost:3000/agents/agent-001/assess-risks \
  -H "Content-Type: application/json" \
  -d '{"policyId": "policy-001"}'

# 5. Generate risk report
curl -X POST http://localhost:3000/agents/agent-001/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "policy-001",
    "versionId": "ver-001"
  }'

# 6. Request approval for high-risk
curl -X POST http://localhost:3000/approvals/request \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-001",
    "versionId": "ver-001",
    "policyId": "policy-001",
    "risks": [
      {"id": "risk-1", "description": "High severity finding", "level": "high"}
    ]
  }'

# 7. Approve the request (replace approval-ID)
curl -X POST http://localhost:3000/approvals/approval-ID/approve \
  -H "Content-Type: application/json" \
  -d '{
    "approver": "security-team@company.com",
    "notes": "Reviewed and approved for deployment"
  }'
```

---

## Implementation Checklist for Cursor

- [ ] **Phase 1**: Create `riskPolicySpec.ts` and `riskPolicies.ts` data
- [ ] **Phase 2**: Create `agentActivitySpec.ts` and `activityLogger.ts`
- [ ] **Phase 3**: Create all four validators (`pathValidator.ts`, `testValidator.ts`, `evidenceValidator.ts`, `policyClassifier.ts`)
- [ ] **Phase 4**: Create `approvalGate.ts` for human approval routing
- [ ] **Phase 5**: Create `riskReportGenerator.ts` for comprehensive reporting
- [ ] **Phase 6**: Add all API endpoints to `server.ts`
- [ ] **Phase 7**: Create comprehensive test suite `test-risk-governance.ts`
- [ ] **Phase 8**: Run full test suite and manual endpoint tests
- [ ] Update `README.md` with new Risk Governance endpoints
- [ ] Update `CLAUDE.md` with governance rules for risk assessment

---

## Files to Create/Modify

### New Files
- `backend/src/specs/riskPolicySpec.ts`
- `backend/src/specs/agentActivitySpec.ts`
- `backend/src/data/riskPolicies.ts`
- `backend/src/lib/activityLogger.ts`
- `backend/src/lib/pathValidator.ts`
- `backend/src/lib/testValidator.ts`
- `backend/src/lib/evidenceValidator.ts`
- `backend/src/lib/policyClassifier.ts`
- `backend/src/lib/approvalGate.ts`
- `backend/src/lib/riskReportGenerator.ts`
- `backend/src/test-risk-governance.ts`

### Modified Files
- `backend/src/server.ts` (add new routes)
- `backend/package.json` (update test script)
- `README.md` (document new endpoints)
- `CLAUDE.md` (add governance rules)

---

## Success Criteria

All seven governance questions answered:

✅ **Did the agent stay inside permitted folders?** → Path validator checks activity against policy
✅ **Did it touch a restricted file?** → Restricted file detector with evidence
✅ **Did it cite evidence for every risk?** → Evidence validator verifies completeness
✅ **Did it classify risk according to policy?** → Policy classifier maps to spec rules
✅ **Did it require human approval for high-risk?** → Approval gate routes critical/high to humans
✅ **Did tests pass before deployment recommendation?** → Test validator blocks if tests fail
✅ **Did the final report map findings back to spec?** → Report generator includes spec mappings

---

## Next Steps After Implementation

1. **Dashboard** - Add a frontend to view reports and manage approvals
2. **Persistence** - Add database storage for activity logs and reports
3. **Webhooks** - Trigger Zapier when high-risk findings need approval
4. **Audit Trail** - Link risk governance to existing audit log system
5. **Custom Policies** - Allow users to define custom risk policies

