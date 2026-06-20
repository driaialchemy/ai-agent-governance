import { AgentActivity, AgentActivityReport } from "../specs/agentActivitySpec";

const activityLog: AgentActivity[] = [];

export function logActivity(activity: Omit<AgentActivity, "id">): AgentActivity {
  const newActivity: AgentActivity = {
    ...activity,
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  };
  activityLog.push(newActivity);
  return newActivity;
}

export function getActivityByAgent(agentId: string): AgentActivityReport {
  const agentActivities = activityLog.filter((a) => a.agentId === agentId);

  return {
    agentId,
    versionId: agentActivities[0]?.versionId || "",
    executionStartTime: agentActivities[0]?.timestamp || "",
    executionEndTime: agentActivities[agentActivities.length - 1]?.timestamp || "",
    activities: agentActivities,
    summary: {
      filesAccessed: [
        ...new Set(
          agentActivities
            .filter((a) => a.actionType === "file_access")
            .map((a) => a.path || "")
            .filter(Boolean)
        )
      ],
      foldersAccessed: [
        ...new Set(
          agentActivities
            .filter((a) => a.actionType === "folder_read" || a.actionType === "folder_write")
            .map((a) => a.path || "")
            .filter(Boolean)
        )
      ],
      testsRun: agentActivities.filter((a) => a.actionType === "test_run").length,
      testsPassed: agentActivities.filter(
        (a) => a.actionType === "test_run" && a.testPassed === true
      ).length,
      testsFailed: agentActivities.filter(
        (a) => a.actionType === "test_run" && a.testPassed === false
      ).length
    }
  };
}

export function clearActivityLog(): void {
  activityLog.length = 0;
}
