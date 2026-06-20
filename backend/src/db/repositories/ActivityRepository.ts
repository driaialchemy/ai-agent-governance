import { getDatabase, persistDatabase } from "../database";
import { AgentActivity, AgentActivityReport } from "../../specs/agentActivitySpec";

export class ActivityRepository {
  logActivity(activity: Omit<AgentActivity, "id">): AgentActivity {
    const db = getDatabase();
    const id = `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newActivity: AgentActivity = { ...activity, id };

    db.agent_activities.push(newActivity);
    persistDatabase();

    return newActivity;
  }

  getActivityByAgent(agentId: string): AgentActivityReport {
    const db = getDatabase();
    const activities = db.agent_activities
      .filter(a => a.agentId === agentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const filesAccessed = [...new Set(
      activities
        .filter(a => a.actionType === "file_access")
        .map(a => a.path)
        .filter(Boolean)
    )];

    const foldersAccessed = [...new Set(
      activities
        .filter(a => a.actionType === "folder_read")
        .map(a => a.path)
        .filter(Boolean)
    )];

    const testRuns = activities.filter(a => a.actionType === "test_run");
    const testsPassed = activities.filter(a => a.testPassed).length;

    return {
      agentId,
      versionId: activities[0]?.versionId || "",
      executionStartTime: activities[0]?.timestamp || "",
      executionEndTime: activities[activities.length - 1]?.timestamp || "",
      activities,
      summary: {
        filesAccessed,
        foldersAccessed,
        testsRun: testRuns.length,
        testsPassed,
        testsFailed: testRuns.length - testsPassed
      }
    };
  }

  getAllActivities(): AgentActivity[] {
    const db = getDatabase();
    return db.agent_activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  clearAllActivities(): void {
    const db = getDatabase();
    db.agent_activities = [];
    persistDatabase();
  }
}
