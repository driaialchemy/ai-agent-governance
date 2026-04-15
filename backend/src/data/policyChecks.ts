export type PolicyCheckResult = {
  id: string;
  versionId: string;
  policyName: string;
  passed: boolean;
  severity: "low" | "medium" | "high";
  notes: string;
  createdAt: string;
};

export const policyCheckResults: PolicyCheckResult[] = [
  {
    id: "policy-001",
    versionId: "ver-001",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: "2026-04-11T10:30:00Z"
  },
  {
    id: "policy-002",
    versionId: "ver-001",
    policyName: "Unsafe Recommendation Check",
    passed: false,
    severity: "high",
    notes: "Version produced one risky recommendation in synthetic scenario set.",
    createdAt: "2026-04-11T10:35:00Z"
  },
  {
    id: "policy-003",
    versionId: "ver-002",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: "2026-04-11T10:40:00Z"
  },
  {
    id: "policy-004",
    versionId: "ver-002",
    policyName: "Output Format Compliance Check",
    passed: true,
    severity: "medium",
    notes: "All synthetic outputs matched required format.",
    createdAt: "2026-04-11T10:45:00Z"
  },
  {
    id: "policy-005",
    versionId: "ver-003",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: "2026-04-12T14:40:00Z"
  },
  {
    id: "policy-006",
    versionId: "ver-003",
    policyName: "Output Format Compliance Check",
    passed: true,
    severity: "medium",
    notes: "All synthetic outputs matched required format.",
    createdAt: "2026-04-12T14:45:00Z"
  },
  {
    id: "policy-007",
    versionId: "ver-004",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: "2026-04-13T08:40:00Z"
  },
  {
    id: "policy-008",
    versionId: "ver-004",
    policyName: "Output Format Compliance Check",
    passed: true,
    severity: "medium",
    notes: "All synthetic outputs matched required format.",
    createdAt: "2026-04-13T08:45:00Z"
  }
];