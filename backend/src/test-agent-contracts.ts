import {
  AgentDecisionSchema,
  EvidenceItemSchema,
  FailureFallbackResultSchema,
  FinalReportSectionSchema,
  RiskFindingSchema,
  ToolCallResultSchema,
  VerificationResultSchema
} from "./schemas/agentContracts";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) {
    console.log(`ok - ${name}`);
    passed++;
  } else {
    console.error(`not ok - ${name}`);
    failed++;
  }
}

const hash = "a".repeat(64);
const now = new Date().toISOString();

const evidence = EvidenceItemSchema.parse({
  id: "evidence-1",
  kind: "policy",
  source: "policy-checks",
  summary: "Policy checks passed",
  contentHash: hash,
  observedAt: now
});

const finding = RiskFindingSchema.parse({
  id: "finding-1",
  severity: "low",
  category: "quality",
  description: "No material issue found",
  evidence: [evidence]
});

const verification = VerificationResultSchema.parse({
  id: "verify-1",
  status: "passed",
  verifier: "deterministic-policy-check",
  checkedAt: now,
  evidence: [evidence]
});

const fallback = FailureFallbackResultSchema.parse({
  failed: true,
  stage: "tool",
  code: "TOOL_TIMEOUT",
  message: "Tool timed out before completion",
  retryable: true,
  fallbackUsed: true,
  fallbackReason: "Used cached deterministic result",
  nextAction: "manual_review"
});

const toolResult = ToolCallResultSchema.parse({
  toolName: "policyLookup",
  status: "success",
  inputHash: hash,
  outputHash: hash,
  durationMs: 25
});

const decision = AgentDecisionSchema.parse({
  id: "decision-1",
  agentName: "governance-api",
  outcome: "approved",
  reason: "Version passed checks",
  riskLevel: "low",
  confidenceScore: 95,
  evidence: [evidence],
  findings: [finding],
  verification,
  toolResults: [toolResult],
  requiresHumanApproval: false,
  decidedAt: now
});

const reportSection = FinalReportSectionSchema.parse({
  id: "section-1",
  title: "Governance decision",
  summary: "Version is approved",
  evidence: [evidence],
  findings: [finding],
  verification,
  decision
});

assert(evidence.contentHash === hash, "evidence item accepts SHA-256 content hash");
assert(finding.evidence.length === 1, "risk finding links evidence");
assert(verification.status === "passed", "verification result has structured status");
assert(fallback.nextAction === "manual_review", "failure/fallback result has next action");
assert(toolResult.status === "success", "tool call result has structured status");
assert(decision.outcome === "approved", "agent decision has structured outcome");
assert(reportSection.decision?.id === "decision-1", "final report section links decision");

const invalid = AgentDecisionSchema.safeParse({
  id: "bad-decision",
  agentName: "governance-api",
  outcome: "maybe",
  reason: "Invalid outcome",
  riskLevel: "low",
  confidenceScore: 101,
  requiresHumanApproval: false,
  decidedAt: now
});

assert(!invalid.success, "agent decision rejects invalid outcome and confidence score");

console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  process.exit(1);
}
