export type AgentStatus = "draft" | "approved" | "staging" | "production" | "archived";

export type Agent = {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: AgentStatus;
  createdAt: string;
};

export type AgentVersion = {
  id: string;
  agentId: string;
  version: string;
  model: string;
  promptVersion: string;
  createdAt: string;
  approved: boolean;
};

export const agents: Agent[] = [
  {
    id: "agent-001",
    name: "Policy Review Agent",
    description: "Reviews policy text and flags risky items.",
    owner: "Mike",
    status: "draft",
    createdAt: "2026-04-11T09:00:00Z"
  },
  {
    id: "agent-002",
    name: "Benchmark Summary Agent",
    description: "Summarizes synthetic benchmark results.",
    owner: "Mike",
    status: "approved",
    createdAt: "2026-04-11T09:05:00Z"
  },
  {
    id: "agent-003",
    name: "Repo Safety Scanner Agent",
    description:
      "Scans repositories for risky files, missing tests, missing README, and unsafe paths.",
    owner: "Mike",
    status: "approved",
    createdAt: "2026-06-01T09:00:00Z"
  },
  {
    id: "agent-004",
    name: "Contract Risk Review Agent",
    description:
      "Reviews contract language, identifies risky clauses, and produces evidence-backed summaries.",
    owner: "Mike",
    status: "approved",
    createdAt: "2026-06-01T09:05:00Z"
  },
  {
    id: "agent-005",
    name: "Incident Triage Agent",
    description:
      "Reviews incident reports, classifies severity, and recommends next steps.",
    owner: "Mike",
    status: "approved",
    createdAt: "2026-06-01T09:10:00Z"
  }
];

export const agentVersions: AgentVersion[] = [
  {
    id: "ver-001",
    agentId: "agent-001",
    version: "1.0.0",
    model: "gpt-4.1-mini",
    promptVersion: "prompt-v1",
    createdAt: "2026-04-11T09:10:00Z",
    approved: false
  },
  {
    id: "ver-002",
    agentId: "agent-002",
    version: "1.0.0",
    model: "gpt-4.1-mini",
    promptVersion: "prompt-v1",
    createdAt: "2026-04-11T09:15:00Z",
    approved: true
  },
  {
    id: "ver-003",
    agentId: "agent-002",
    version: "1.1.0",
    model: "gpt-4.1-mini",
    promptVersion: "prompt-v2",
    createdAt: "2026-04-12T14:00:00Z",
    approved: true
  },
  {
    id: "ver-004",
    agentId: "agent-002",
    version: "1.2.0",
    model: "gpt-4.1-mini",
    promptVersion: "prompt-v3",
    createdAt: "2026-04-13T08:00:00Z",
    approved: true
  },
  {
    id: "ver-101",
    agentId: "agent-003",
    version: "1.0.0",
    model: "gpt-4.1-mini",
    promptVersion: "repo-safe-v1",
    createdAt: "2026-06-01T10:00:00Z",
    approved: true
  },
  {
    id: "ver-102",
    agentId: "agent-003",
    version: "1.1.0",
    model: "gpt-4.1-mini",
    promptVersion: "repo-risky-v1",
    createdAt: "2026-06-01T10:05:00Z",
    approved: true
  },
  {
    id: "ver-103",
    agentId: "agent-003",
    version: "1.2.0",
    model: "gpt-4.1-mini",
    promptVersion: "repo-nospec-v1",
    createdAt: "2026-06-01T10:10:00Z",
    approved: false
  },
  {
    id: "ver-201",
    agentId: "agent-004",
    version: "1.0.0",
    model: "gpt-4.1-mini",
    promptVersion: "contract-valid-v1",
    createdAt: "2026-06-01T11:00:00Z",
    approved: true
  },
  {
    id: "ver-202",
    agentId: "agent-004",
    version: "1.1.0",
    model: "gpt-4.1-mini",
    promptVersion: "contract-missing-bench-v1",
    createdAt: "2026-06-01T11:05:00Z",
    approved: false
  },
  {
    id: "ver-203",
    agentId: "agent-004",
    version: "1.2.0",
    model: "gpt-4.1-mini",
    promptVersion: "contract-failed-policy-v1",
    createdAt: "2026-06-01T11:10:00Z",
    approved: false
  },
  {
    id: "ver-301",
    agentId: "agent-005",
    version: "1.0.0",
    model: "gpt-4.1-mini",
    promptVersion: "incident-classify-v1",
    createdAt: "2026-06-01T12:00:00Z",
    approved: true
  },
  {
    id: "ver-302",
    agentId: "agent-005",
    version: "1.1.0",
    model: "gpt-4.1-mini",
    promptVersion: "incident-restart-v1",
    createdAt: "2026-06-01T12:05:00Z",
    approved: true
  },
  {
    id: "ver-303",
    agentId: "agent-005",
    version: "1.2.0",
    model: "gpt-4.1-mini",
    promptVersion: "incident-perms-v1",
    createdAt: "2026-06-01T12:10:00Z",
    approved: true
  }
];

export const registryData = {
  agents,
  agentVersions
};
