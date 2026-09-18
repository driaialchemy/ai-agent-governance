import { agents, agentVersions, Agent, AgentVersion, DecisionTaxonomyAxes } from "../data/registry";

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

export function updateVersionTaxonomy(
  versionId: string,
  axes: DecisionTaxonomyAxes
): AgentVersion | undefined {
  const version = getVersionById(versionId);
  if (!version) {
    return undefined;
  }
  if ("risk" in axes) {
    version.risk = axes.risk ?? null;
  }
  if ("complexity" in axes) {
    version.complexity = axes.complexity ?? null;
  }
  if ("regulatory_impact" in axes) {
    version.regulatory_impact = axes.regulatory_impact ?? null;
  }
  if ("business_importance" in axes) {
    version.business_importance = axes.business_importance ?? null;
  }
  return version;
}