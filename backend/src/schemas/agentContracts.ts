import { z } from "zod";

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const VerificationStatusSchema = z.enum(["passed", "failed", "inconclusive", "skipped"]);
export const DecisionOutcomeSchema = z.enum([
  "allowed",
  "denied",
  "approved",
  "rejected",
  "blocked",
  "requires_approval",
  "failed"
]);

export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["benchmark", "policy", "deployment", "registry", "webhook", "audit", "manual"]),
  source: z.string().min(1),
  summary: z.string().min(1),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  observedAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const RiskFindingSchema = z.object({
  id: z.string().min(1),
  severity: RiskLevelSchema,
  category: z.enum(["security", "compliance", "reliability", "quality", "operations"]),
  description: z.string().min(1),
  evidence: z.array(EvidenceItemSchema).default([]),
  remediation: z.string().optional()
});

export const VerificationResultSchema = z.object({
  id: z.string().min(1),
  status: VerificationStatusSchema,
  verifier: z.string().min(1),
  checkedAt: z.string().datetime(),
  evidence: z.array(EvidenceItemSchema).default([]),
  failureReasons: z.array(z.string()).default([])
});

export const FailureFallbackResultSchema = z.object({
  failed: z.boolean(),
  stage: z.enum(["agent", "model", "tool", "approval", "verification", "persistence", "webhook", "api"]),
  code: z.string().min(1),
  message: z.string().min(1),
  retryable: z.boolean(),
  fallbackUsed: z.boolean().default(false),
  fallbackReason: z.string().optional(),
  nextAction: z.enum(["retry", "manual_review", "abort", "fallback", "escalate"])
});

export const ToolCallResultSchema = z.object({
  toolName: z.string().min(1),
  status: z.enum(["success", "failed", "skipped"]),
  inputHash: z.string().regex(/^[a-f0-9]{64}$/),
  outputHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  durationMs: z.number().int().nonnegative(),
  failure: FailureFallbackResultSchema.nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const AgentDecisionSchema = z.object({
  id: z.string().min(1),
  agentName: z.string().min(1),
  outcome: DecisionOutcomeSchema,
  reason: z.string().min(1),
  riskLevel: RiskLevelSchema,
  confidenceScore: z.number().min(0).max(100),
  evidence: z.array(EvidenceItemSchema).default([]),
  findings: z.array(RiskFindingSchema).default([]),
  verification: VerificationResultSchema.nullable().default(null),
  toolResults: z.array(ToolCallResultSchema).default([]),
  requiresHumanApproval: z.boolean(),
  decidedAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).default({})
});

export const FinalReportSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  evidence: z.array(EvidenceItemSchema).default([]),
  findings: z.array(RiskFindingSchema).default([]),
  verification: VerificationResultSchema.nullable().default(null),
  decision: AgentDecisionSchema.nullable().default(null)
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type RiskFinding = z.infer<typeof RiskFindingSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type FailureFallbackResult = z.infer<typeof FailureFallbackResultSchema>;
export type ToolCallResult = z.infer<typeof ToolCallResultSchema>;
export type AgentDecision = z.infer<typeof AgentDecisionSchema>;
export type FinalReportSection = z.infer<typeof FinalReportSectionSchema>;
