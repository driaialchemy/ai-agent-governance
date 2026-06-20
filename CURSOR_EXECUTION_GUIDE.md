# Quick-Start: Execute Risk Governance in Cursor

## Overview
This guide shows how to use Cursor to implement the Agent Risk Governance System that answers these 7 questions:

1. ✅ Did the agent stay inside permitted folders?
2. ✅ Did it touch a restricted file?
3. ✅ Did it cite evidence for every risk?
4. ✅ Did it classify risk according to the policy?
5. ✅ Did it require human approval for high-risk actions?
6. ✅ Did tests pass before the agent recommended deployment?
7. ✅ Did the final report map findings back to the spec?

---

## Command Sequence for Cursor

Open Cursor and execute these commands sequentially:

### Step 1: Review the Complete Workflow Document
```
Open file: AGENT_RISK_GOVERNANCE_WORKFLOW.md
Read all 8 phases to understand the architecture
```

### Step 2: Create Phase 1 - Risk Policy Specs
**Tell Cursor:**
```
Create file backend/src/specs/riskPolicySpec.ts with the RiskPolicySpec type and related types 
from Phase 1 of AGENT_RISK_GOVERNANCE_WORKFLOW.md
```

Then:
```
Create file backend/src/data/riskPolicies.ts with the synthetic risk policy data from Phase 1
```

### Step 3: Create Phase 2 - Activity Logger
**Tell Cursor:**
```
Create file backend/src/specs/agentActivitySpec.ts with AgentActionType, AgentActivity, 
and AgentActivityReport types from Phase 2
```

Then:
```
Create file backend/src/lib/activityLogger.ts with the logActivity, getActivityByAgent, 
and clearActivityLog functions from Phase 2
```

### Step 4: Create Phase 3 - Risk Validators
**Tell Cursor:**
```
Create these 4 validator files from Phase 3:
1. backend/src/lib/pathValidator.ts - checks permitted/restricted paths
2. backend/src/lib/testValidator.ts - validates test results
3. backend/src/lib/evidenceValidator.ts - ensures evidence completeness
4. backend/src/lib/policyClassifier.ts - classifies risk by severity
```

### Step 5: Create Phase 4 - Approval Gate
**Tell Cursor:**
```
Create file backend/src/lib/approvalGate.ts with ApprovalRequest type and functions:
- createApprovalRequest()
- approveRequest()
- rejectRequest()
- getApprovalRequest()
- getPendingApprovals()
```

### Step 6: Create Phase 5 - Risk Report Generator
**Tell Cursor:**
```
Create file backend/src/lib/riskReportGenerator.ts with:
- RiskReport type (with 7 required fields for governance checklist)
- generateRiskReport() function that creates comprehensive reports
- Ensure all findings map back to policy spec (Criterion 7)
```

### Step 7: Create Phase 6 - API Endpoints
**Tell Cursor:**
```
Add these new routes to backend/src/server.ts:
- GET /risk-policies - list all policies
- GET /risk-policies/:id - get specific policy
- POST /agents/:id/activity - log agent activity
- GET /agents/:id/activity-report - get activity summary
- POST /agents/:id/assess-risks - run risk validation
- POST /agents/:id/generate-report - create risk report
- POST /approvals/request - create approval request
- POST /approvals/:id/approve - approve finding
- POST /approvals/:id/reject - reject finding
- GET /approvals/pending - list pending approvals
```

### Step 8: Create Phase 7 - Test Suite
**Tell Cursor:**
```
Create file backend/src/test-risk-governance.ts with comprehensive tests covering:
- Criterion 1: Agent stays in permitted folders
- Criterion 2: Restricted file detection
- Criterion 3: Evidence citation validation
- Criterion 4: Policy classification
- Criterion 5: High-risk approval routing
- Criterion 6: Test pass requirement
- Criterion 7: Spec mapping in reports
```

### Step 9: Update Configuration
**Tell Cursor:**
```
Update backend/package.json test script to run all three test suites:
npm test should run test-governance.ts, test-sdd.ts, AND test-risk-governance.ts
```

### Step 10: Run Tests
**In Terminal:**
```powershell
cd C:\Users\msell\ai-agent-governance\backend
npm test
```

**Expected Output:**
```
GOVERNANCE WORKFLOW TESTS
=========================
Passed: 28 | Failed: 0 ✅

SPEC-DRIVEN GOVERNANCE TESTS
============================
Passed: 28 | Failed: 0 ✅

RISK GOVERNANCE TESTS
=====================
Passed: 13 | Failed: 0 ✅

TOTAL: 69 TESTS PASSING ✅
```

### Step 11: Start Server
**In Terminal:**
```powershell
npx tsx src/server.ts
```

**Output should show:**
```
Server running on http://localhost:3000
```

### Step 12: Test Endpoints
**In new Terminal:**

```powershell
# 1. Verify risk policies loaded
curl http://localhost:3000/risk-policies

# 2. Log agent activity (permitted path)
curl -X POST http://localhost:3000/agents/agent-001/activity `
  -H "Content-Type: application/json" `
  -d '{
    "agentId": "agent-001",
    "versionId": "ver-001",
    "actionType": "file_access",
    "path": "/src/agent.ts",
    "accessType": "read",
    "description": "Agent read source file",
    "evidence": {"timestamp": "2026-06-20T10:00:00Z"}
  }'

# 3. Log agent activity (RESTRICTED file - triggers critical risk)
curl -X POST http://localhost:3000/agents/agent-001/activity `
  -H "Content-Type: application/json" `
  -d '{
    "agentId": "agent-001",
    "versionId": "ver-001",
    "actionType": "file_access",
    "path": "/config/.env",
    "accessType": "read",
    "description": "Agent accessed .env (VIOLATION)",
    "evidence": {"timestamp": "2026-06-20T10:01:00Z"}
  }'

# 4. Log test run
curl -X POST http://localhost:3000/agents/agent-001/activity `
  -H "Content-Type: application/json" `
  -d '{
    "agentId": "agent-001",
    "versionId": "ver-001",
    "actionType": "test_run",
    "testName": "deployment_validation",
    "testPassed": true,
    "testOutput": "All assertions passed",
    "description": "Deployment test completed",
    "evidence": {"timestamp": "2026-06-20T10:02:00Z"}
  }'

# 5. Get activity report (shows all 3 activities)
curl http://localhost:3000/agents/agent-001/activity-report

# 6. Assess risks (should find 1 critical risk from .env access)
curl -X POST http://localhost:3000/agents/agent-001/assess-risks `
  -H "Content-Type: application/json" `
  -d '{"policyId": "policy-001"}'

# 7. Generate risk report (comprehensive 7-criterion check)
curl -X POST http://localhost:3000/agents/agent-001/generate-report `
  -H "Content-Type: application/json" `
  -d '{
    "policyId": "policy-001",
    "versionId": "ver-001"
  }'

# 8. Create approval request for critical risk
curl -X POST http://localhost:3000/approvals/request `
  -H "Content-Type: application/json" `
  -d '{
    "agentId": "agent-001",
    "versionId": "ver-001",
    "policyId": "policy-001",
    "risks": [
      {"id": "risk-1", "description": "Unauthorized .env access", "level": "critical"}
    ]
  }'

# Expected response: {"success": true, "data": {"id": "approval-XXXXX", "status": "pending", ...}}
# Copy the approval ID from response

# 9. Approve the request (replace APPROVAL_ID)
curl -X POST http://localhost:3000/approvals/APPROVAL_ID/approve `
  -H "Content-Type: application/json" `
  -d '{
    "approver": "security-team@company.com",
    "notes": "Reviewed - .env access was necessary for configuration"
  }'

# 10. View all pending approvals
curl http://localhost:3000/approvals/pending
```

---

## Architecture Overview

```
Agent Activity Log
    ↓
Risk Assessment Layer
    ├─ Path Validator (Criteria 1, 2)
    ├─ Evidence Validator (Criterion 3)
    ├─ Policy Classifier (Criterion 4)
    └─ Test Validator (Criterion 6)
    ↓
Approval Gate (Criterion 5)
    ├─ Route high-risk to humans
    └─ Human approves/rejects
    ↓
Risk Report Generator (Criterion 7)
    ├─ All findings mapped to spec
    ├─ Deployment recommendation
    └─ Audit trail complete
```

---

## Validation: The 7-Point Checklist

After running all steps, the system validates:

### ✅ Criterion 1: Did agent stay in permitted folders?
**Validated by:** `pathValidator.ts` checking against `policy.permittedFolders`
**Evidence:** Path Validator returns `[]` if all paths are permitted

### ✅ Criterion 2: Did it touch a restricted file?
**Validated by:** `pathValidator.ts` checking `policy.restrictedFiles`
**Evidence:** Path Validator returns risk objects for any .env/.credentials/etc access

### ✅ Criterion 3: Did it cite evidence for every risk?
**Validated by:** `evidenceValidator.ts` requiring:
- sourceFile (e.g., "/src/agent.ts")
- lineNumber (e.g., 42)
- auditEntryId (trace to audit log)
**Evidence:** `isValid: true` when all evidence fields present

### ✅ Criterion 4: Did it classify risk according to policy?
**Validated by:** `policyClassifier.ts` mapping findings to risk levels
**Evidence:** Each risk has `riskLevel` and `policyClause` linking to spec

### ✅ Criterion 5: Did it require human approval for high-risk?
**Validated by:** `approvalGate.ts` creating pending approval for high/critical risks
**Evidence:** `ApprovalRequest` with `status: "pending"` until human approves/rejects

### ✅ Criterion 6: Did tests pass before deployment?
**Validated by:** `testValidator.ts` and `deploymentRecommendation.blockedBy`
**Evidence:** If `testsFailed > 0`, deployment is blocked

### ✅ Criterion 7: Did final report map findings back to spec?
**Validated by:** Every finding in `RiskReport.findings` has `specMapping` with:
- policyClause (e.g., "policy-001:findings")
- requirement (what policy requires)
- status (compliant or violation)
**Evidence:** `specMapping` object in every finding

---

## Response Examples

### Risk Report with All 7 Criteria Addressed

```json
{
  "success": true,
  "data": {
    "id": "report-1719050400000",
    "agentId": "agent-001",
    "versionId": "ver-001",
    "summary": {
      "totalRisks": 1,
      "risksByLevel": {
        "critical": 1,
        "high": 0,
        "medium": 0,
        "low": 0
      },
      "testsStatus": "all_passed",
      "pathValidation": "failed",
      "evidenceValidation": "passed"
    },
    "findings": [
      {
        "findingId": "path-risk-1719050400000",
        "category": "restricted_file",
        "riskLevel": "critical",
        "description": "restricted_file: /config/.env",
        "evidence": {
          "sourceFile": "/src/agent.ts",
          "lineNumber": 42,
          "auditEntryId": "activity-1719050401000",
          "timestamp": "2026-06-20T10:01:00Z"
        },
        "specMapping": {
          "policyClause": "policy-001:findings",
          "requirement": "Compliance check against Production Agent Governance",
          "status": "violation"
        }
      }
    ],
    "approval": {
      "required": true,
      "status": "pending",
      "approvalRequestId": "approval-1719050402000"
    },
    "deploymentRecommendation": {
      "canDeploy": false,
      "blockedBy": [
        "Unresolved high-risk findings",
        "Critical risk findings"
      ],
      "recommendedActions": [
        "Resolve: Unresolved high-risk findings",
        "Resolve: Critical risk findings"
      ]
    }
  }
}
```

---

## Success Indicators

You've successfully implemented the system when:

1. ✅ All 69 tests pass (28 + 28 + 13)
2. ✅ Server starts without errors on port 3000
3. ✅ All 10 endpoint tests return expected responses
4. ✅ Risk report includes all 7 governance criteria
5. ✅ Approval requests are created for high/critical risks
6. ✅ Deployment is blocked when tests fail or risks unresolved
7. ✅ Every finding maps back to policy spec

---

## Troubleshooting

### Tests fail to compile
- Check all import paths in new files
- Ensure all types are exported from specs files
- Run `npm install` if dependencies missing

### Server won't start
- Check port 3000 is not in use
- Verify all lib files are created
- Check for syntax errors: `npx tsc --noEmit`

### Endpoints return 404
- Verify server.ts has all new routes
- Restart server after adding routes
- Check endpoint paths match exactly

### Risk report missing spec mapping
- Verify `generateRiskReport()` includes `specMapping` in findings
- Check policy is being loaded correctly
- Ensure `classifyRisk()` is called for each finding

---

## Next Steps

After successful implementation:

1. **Add Dashboard** - Frontend to view reports and manage approvals
2. **Persist Data** - Add database to store reports and audit trails
3. **Webhook Integration** - Send approval requests to Slack/email
4. **Custom Policies** - Allow users to define their own risk policies
5. **Batch Analysis** - Run governance check on multiple agent versions
6. **Trending** - Track risk metrics over time

