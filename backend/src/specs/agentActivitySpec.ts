export type AgentActionType =
  | "file_access"
  | "folder_read"
  | "folder_write"
  | "test_run"
  | "test_pass"
  | "test_fail"
  | "deployment_recommendation";

export type AgentActivity = {
  id: string;
  agentId: string;
  versionId: string;
  timestamp: string;
  actionType: AgentActionType;

  path?: string;
  accessType?: "read" | "write" | "execute";

  testName?: string;
  testPassed?: boolean;
  testOutput?: string;

  description: string;
  evidence: {
    sourceFile?: string;
    lineNumber?: number;
    timestamp: string;
  };
};

export type AgentActivityReport = {
  agentId: string;
  versionId: string;
  executionStartTime: string;
  executionEndTime: string;
  activities: AgentActivity[];
  summary: {
    filesAccessed: string[];
    foldersAccessed: string[];
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
  };
};
