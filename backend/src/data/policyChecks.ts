export type PolicyCheckResult = {
  id: string;
  versionId: string;
  policyName: string;
  passed: boolean;
  severity: "low" | "medium" | "high";
  notes: string;
  createdAt: string;
};

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const policyCheckResults: PolicyCheckResult[] = [
  {
    id: "policy-001",
    versionId: "ver-001",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: daysAgo(4)
  },
  {
    id: "policy-002",
    versionId: "ver-001",
    policyName: "Unsafe Recommendation Check",
    passed: false,
    severity: "high",
    notes: "Version produced one risky recommendation in synthetic scenario set.",
    createdAt: daysAgo(4)
  },
  {
    id: "policy-003",
    versionId: "ver-002",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: daysAgo(3)
  },
  {
    id: "policy-004",
    versionId: "ver-002",
    policyName: "Output Format Compliance Check",
    passed: true,
    severity: "medium",
    notes: "All synthetic outputs matched required format.",
    createdAt: daysAgo(3)
  },
  {
    id: "policy-005",
    versionId: "ver-003",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: daysAgo(2)
  },
  {
    id: "policy-006",
    versionId: "ver-003",
    policyName: "Output Format Compliance Check",
    passed: true,
    severity: "medium",
    notes: "All synthetic outputs matched required format.",
    createdAt: daysAgo(2)
  },
  {
    id: "policy-007",
    versionId: "ver-004",
    policyName: "PII Handling Check",
    passed: true,
    severity: "high",
    notes: "No synthetic PII exposure detected in current test set.",
    createdAt: daysAgo(1)
  },
  {
    id: "policy-008",
    versionId: "ver-004",
    policyName: "Output Format Compliance Check",
    passed: true,
    severity: "medium",
    notes: "All synthetic outputs matched required format.",
    createdAt: daysAgo(1)
  }
];
