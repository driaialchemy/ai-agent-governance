import { governanceSpecs } from "../data/governanceSpecs";
import { GovernanceSpec } from "../specs/specTypes";

export function getAllGovernanceSpecs(): GovernanceSpec[] {
  return governanceSpecs;
}

export function getGovernanceSpecById(specId: string): GovernanceSpec | undefined {
  return governanceSpecs.find((spec) => spec.specId === specId);
}

export function getGovernanceSpecForVersion(versionId: string): GovernanceSpec | undefined {
  return governanceSpecs.find((spec) => spec.versionId === versionId);
}

export function getGovernanceSpecsForAgent(agentId: string): GovernanceSpec[] {
  return governanceSpecs.filter((spec) => spec.agentId === agentId);
}
