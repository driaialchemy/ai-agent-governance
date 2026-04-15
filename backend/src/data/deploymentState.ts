export type Environment = "staging" | "production";

export interface DeploymentRecord {
  environment: Environment;
  agentId: string;
  currentVersionId: string;
  deployedAt: string;
  deploymentHistory: DeploymentHistoryEntry[];
}

export interface DeploymentHistoryEntry {
  versionId: string;
  deployedAt: string;
  replacedAt: string | null;
}

export const deploymentState: DeploymentRecord[] = [
  {
    environment: "staging",
    agentId: "agent-001",
    currentVersionId: "ver-001",
    deployedAt: "2026-04-12T10:00:00Z",
    deploymentHistory: [
      {
        versionId: "ver-001",
        deployedAt: "2026-04-12T10:00:00Z",
        replacedAt: null
      }
    ]
  },
  {
    environment: "production",
    agentId: "agent-002",
    currentVersionId: "ver-003",
    deployedAt: "2026-04-12T15:00:00Z",
    deploymentHistory: [
      {
        versionId: "ver-002",
        deployedAt: "2026-04-12T11:00:00Z",
        replacedAt: "2026-04-12T15:00:00Z"
      },
      {
        versionId: "ver-003",
        deployedAt: "2026-04-12T15:00:00Z",
        replacedAt: null
      }
    ]
  }
];

export function getDeploymentByEnvironment(
  environment: Environment
): DeploymentRecord | undefined {
  return deploymentState.find((record) => record.environment === environment);
}

export function getCurrentDeployedVersionId(
  environment: Environment
): string | undefined {
  const deployment = getDeploymentByEnvironment(environment);
  return deployment?.currentVersionId;
}

export function getPreviousDeployedVersionIds(
  environment: Environment
): string[] {
  const deployment = getDeploymentByEnvironment(environment);
  if (!deployment) {
    return [];
  }

  return deployment.deploymentHistory
    .filter((entry) => entry.versionId !== deployment.currentVersionId)
    .map((entry) => entry.versionId);
}

export function updateDeployment(
  environment: Environment,
  newVersionId: string
): void {
  const deployment = getDeploymentByEnvironment(environment);

  if (!deployment) {
    throw new Error(`No deployment record found for environment: ${environment}`);
  }

  const now = new Date().toISOString();

  const currentHistoryEntry = deployment.deploymentHistory.find(
    (entry) => entry.versionId === deployment.currentVersionId
  );

  if (currentHistoryEntry) {
    currentHistoryEntry.replacedAt = now;
  }

  const existingHistoryEntry = deployment.deploymentHistory.find(
    (entry) => entry.versionId === newVersionId
  );

  if (existingHistoryEntry) {
    existingHistoryEntry.replacedAt = null;
  } else {
    deployment.deploymentHistory.push({
      versionId: newVersionId,
      deployedAt: now,
      replacedAt: null
    });
  }

  deployment.currentVersionId = newVersionId;
  deployment.deployedAt = now;
}

export function updateDeploymentForPromotion(
  environment: Environment,
  newVersionId: string,
  newAgentId: string
): void {
  const deployment = getDeploymentByEnvironment(environment);

  if (!deployment) {
    throw new Error(`No deployment record found for environment: ${environment}`);
  }

  const now = new Date().toISOString();

  const currentHistoryEntry = deployment.deploymentHistory.find(
    (entry) => entry.versionId === deployment.currentVersionId
  );

  if (currentHistoryEntry) {
    currentHistoryEntry.replacedAt = now;
  }

  const existingHistoryEntry = deployment.deploymentHistory.find(
    (entry) => entry.versionId === newVersionId
  );

  if (existingHistoryEntry) {
    existingHistoryEntry.replacedAt = null;
  } else {
    deployment.deploymentHistory.push({
      versionId: newVersionId,
      deployedAt: now,
      replacedAt: null
    });
  }

  deployment.currentVersionId = newVersionId;
  deployment.agentId = newAgentId;
  deployment.deployedAt = now;
}
