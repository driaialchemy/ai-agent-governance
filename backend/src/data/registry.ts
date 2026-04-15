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
  }
];

export const registryData = {
  agents,
  agentVersions
};