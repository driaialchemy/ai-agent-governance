// Smoke test for risk governance API endpoints
// Run with: npx tsx src/test-risk-governance-api.ts

import { spawn, ChildProcess } from "child_process";
import path from "path";

const PORT = 3001;
const BASE = `http://localhost:${PORT}`;

let serverProcess: ChildProcess | null = null;
let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.error(`✗ FAILED: ${name}`);
    failed++;
  }
}

async function waitForServer(maxAttempts = 20): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function jsonRequest(
  method: string,
  urlPath: string,
  body?: object
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { status: res.status, json };
}

async function runSmokeTests(): Promise<void> {
  console.log("RISK GOVERNANCE API SMOKE TESTS");
  console.log("================================\n");

  const serverPath = path.join(__dirname, "server.ts");
  serverProcess = spawn("npx", ["tsx", serverPath], {
    env: { ...process.env, PORT: String(PORT) },
    shell: true,
    stdio: "pipe"
  });

  const ready = await waitForServer();
  assert(ready, "server starts on configured port");

  const policies = await jsonRequest("GET", "/risk-policies");
  assert(policies.status === 200, "GET /risk-policies returns 200");
  assert(policies.json.success === true, "GET /risk-policies success=true");

  await jsonRequest("POST", "/agents/agent-001/activity", {
    agentId: "agent-001",
    versionId: "ver-001",
    actionType: "file_access",
    path: "/src/agent.ts",
    accessType: "read",
    description: "Agent read source file",
    evidence: { timestamp: "2026-06-20T10:00:00Z" }
  });

  await jsonRequest("POST", "/agents/agent-001/activity", {
    agentId: "agent-001",
    versionId: "ver-001",
    actionType: "file_access",
    path: "/config/.env",
    accessType: "read",
    description: "Agent accessed .env",
    evidence: { timestamp: "2026-06-20T10:01:00Z" }
  });

  await jsonRequest("POST", "/agents/agent-001/activity", {
    agentId: "agent-001",
    versionId: "ver-001",
    actionType: "test_run",
    testName: "deployment_validation",
    testPassed: true,
    testOutput: "All assertions passed",
    description: "Deployment test completed",
    evidence: { timestamp: "2026-06-20T10:02:00Z" }
  });

  const report = await jsonRequest("GET", "/agents/agent-001/activity-report");
  assert(report.status === 200, "GET /agents/:id/activity-report returns 200");
  const summary = report.json.data as { summary?: { testsRun?: number } };
  assert((summary?.summary?.testsRun ?? 0) >= 1, "activity report includes test runs");

  const assess = await jsonRequest("POST", "/agents/agent-001/assess-risks", {
    policyId: "policy-001"
  });
  assert(assess.status === 200, "POST /agents/:id/assess-risks returns 200");
  const assessData = assess.json.data as { totalRisks?: number };
  assert((assessData?.totalRisks ?? 0) > 0, "assess-risks detects .env critical risk");

  const genReport = await jsonRequest("POST", "/agents/agent-001/generate-report", {
    policyId: "policy-001",
    versionId: "ver-001"
  });
  assert(genReport.status === 200, "POST /agents/:id/generate-report returns 200");
  const reportData = genReport.json.data as {
    deploymentRecommendation?: { canDeploy?: boolean };
    findings?: Array<{ specMapping?: unknown }>;
  };
  assert(reportData.findings?.every((f) => f.specMapping) === true, "report maps findings to spec");

  const approvalReq = await jsonRequest("POST", "/approvals/request", {
    agentId: "agent-001",
    versionId: "ver-001",
    policyId: "policy-001",
    risks: [{ id: "risk-1", description: "Unauthorized .env access", level: "critical" }]
  });
  assert(approvalReq.status === 200, "POST /approvals/request returns 200");
  const approvalId = (approvalReq.json.data as { id?: string })?.id ?? "";

  const pending = await jsonRequest("GET", "/approvals/pending");
  assert(pending.status === 200, "GET /approvals/pending returns 200");

  const approved = await jsonRequest("POST", `/approvals/${approvalId}/approve`, {
    approver: "security-team@company.com",
    notes: "Reviewed and approved"
  });
  assert(approved.status === 200, "POST /approvals/:id/approve returns 200");
  assert(approved.json.success === true, "approval granted");

  console.log(`\nPassed: ${passed} | Failed: ${failed}`);
}

runSmokeTests()
  .catch((err) => {
    console.error("Smoke test error:", err);
    failed++;
  })
  .finally(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(failed > 0 ? 1 : 0);
  });
