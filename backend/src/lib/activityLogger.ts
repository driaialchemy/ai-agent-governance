import { AgentActivity, AgentActivityReport } from "../specs/agentActivitySpec";
import { ActivityRepository } from "../db/repositories/ActivityRepository";

const repo = new ActivityRepository();

export function logActivity(activity: Omit<AgentActivity, "id">): AgentActivity {
  return repo.logActivity(activity);
}

export function getActivityByAgent(agentId: string): AgentActivityReport {
  return repo.getActivityByAgent(agentId);
}

export function clearActivityLog(): void {
  repo.clearAllActivities();
}
