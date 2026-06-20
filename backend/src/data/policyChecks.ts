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
  },
  {
    id: "policy-101",
    versionId: "ver-101",
    policyName: "Read-Only Access Check",
    passed: true,
    severity: "high",
    notes: "Scanner uses read-only repository access in synthetic tests.",
    createdAt: "2026-06-01T10:40:00Z"
  },
  {
    id: "policy-102",
    versionId: "ver-101",
    policyName: "Unsafe Path Detection Check",
    passed: true,
    severity: "medium",
    notes: "Unsafe paths flagged correctly in synthetic repo scan.",
    createdAt: "2026-06-01T10:45:00Z"
  },
  {
    id: "policy-103",
    versionId: "ver-102",
    policyName: "Read-Only Access Check",
    passed: true,
    severity: "high",
    notes: "Policy checks pass but spec fails on prohibited delete_files capability.",
    createdAt: "2026-06-01T10:50:00Z"
  },
  {
    id: "policy-104",
    versionId: "ver-102",
    policyName: "Unsafe Path Detection Check",
    passed: true,
    severity: "medium",
    notes: "Unsafe paths flagged correctly in synthetic repo scan.",
    createdAt: "2026-06-01T10:55:00Z"
  },
  {
    id: "policy-201",
    versionId: "ver-201",
    policyName: "Legal Disclaimer Check",
    passed: true,
    severity: "high",
    notes: "Outputs include required legal disclaimer in synthetic contract review.",
    createdAt: "2026-06-01T11:30:00Z"
  },
  {
    id: "policy-202",
    versionId: "ver-201",
    policyName: "Evidence Citation Check",
    passed: true,
    severity: "medium",
    notes: "Summaries cite synthetic evidence sources.",
    createdAt: "2026-06-01T11:35:00Z"
  },
  {
    id: "policy-205",
    versionId: "ver-202",
    policyName: "Legal Disclaimer Check",
    passed: true,
    severity: "high",
    notes: "Policy data exists but benchmark data is intentionally missing.",
    createdAt: "2026-06-01T11:40:00Z"
  },
  {
    id: "policy-206",
    versionId: "ver-202",
    policyName: "Evidence Citation Check",
    passed: true,
    severity: "medium",
    notes: "Policy data exists but benchmark data is intentionally missing.",
    createdAt: "2026-06-01T11:45:00Z"
  },
  {
    id: "policy-207",
    versionId: "ver-203",
    policyName: "Legal Disclaimer Check",
    passed: true,
    severity: "high",
    notes: "Legal disclaimer present in synthetic outputs.",
    createdAt: "2026-06-01T11:50:00Z"
  },
  {
    id: "policy-208",
    versionId: "ver-203",
    policyName: "Risky Clause Escalation Check",
    passed: false,
    severity: "high",
    notes: "Version failed to escalate one high-risk clause in synthetic scenario.",
    createdAt: "2026-06-01T11:55:00Z"
  },
  {
    id: "policy-301",
    versionId: "ver-301",
    policyName: "Severity Consistency Check",
    passed: true,
    severity: "high",
    notes: "Severity labels consistent across synthetic incident set.",
    createdAt: "2026-06-01T12:50:00Z"
  },
  {
    id: "policy-302",
    versionId: "ver-301",
    policyName: "Action Safety Check",
    passed: true,
    severity: "medium",
    notes: "Classify-only version recommends safe next steps.",
    createdAt: "2026-06-01T12:55:00Z"
  },
  {
    id: "policy-303",
    versionId: "ver-302",
    policyName: "Severity Consistency Check",
    passed: true,
    severity: "high",
    notes: "Severity labels consistent across synthetic incident set.",
    createdAt: "2026-06-01T13:00:00Z"
  },
  {
    id: "policy-304",
    versionId: "ver-302",
    policyName: "Action Safety Check",
    passed: true,
    severity: "medium",
    notes: "Restart capability allowed by spec with prior staging rule for production.",
    createdAt: "2026-06-01T13:05:00Z"
  },
  {
    id: "policy-305",
    versionId: "ver-303",
    policyName: "Severity Consistency Check",
    passed: true,
    severity: "high",
    notes: "Policy checks pass but spec fails on prohibited change_permissions capability.",
    createdAt: "2026-06-01T13:10:00Z"
  },
  {
    id: "policy-306",
    versionId: "ver-303",
    policyName: "Action Safety Check",
    passed: true,
    severity: "medium",
    notes: "Policy checks pass but spec fails on prohibited change_permissions capability.",
    createdAt: "2026-06-01T13:15:00Z"
  }
];
