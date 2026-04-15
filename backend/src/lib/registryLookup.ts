import { agents, agentVersions, Agent, AgentVersion } from "../data/registry";

export function getAllAgents(): Agent[] {
  return agents;
}

export function getAgentById(agentId: string): Agent | undefined {
  return agents.find((agent) => agent.id === agentId);
}

export function getAllAgentVersions(): AgentVersion[] {
  return agentVersions;
}

export function getVersionsByAgentId(agentId: string): AgentVersion[] {
  return agentVersions.filter((version) => version.agentId === agentId);
}

export function getVersionById(versionId: string): AgentVersion | undefined {
  return agentVersions.find((version) => version.id === versionId);
}