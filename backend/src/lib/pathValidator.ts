import { RiskPolicySpec, RiskLevel } from "../specs/riskPolicySpec";
import { AgentActivity, AgentActivityReport } from "../specs/agentActivitySpec";

export type PathRisk = {
  riskId: string;
  riskLevel: RiskLevel;
  category: "unpermitted_folder" | "restricted_file" | "restricted_folder";
  path: string;
  activity: AgentActivity;
  evidence: {
    sourceActivity: string;
    timestamp: string;
    accessType: string;
    sourceFile?: string;
    lineNumber?: number;
  };
};

function isRestrictedFile(path: string, policy: RiskPolicySpec): boolean {
  return policy.restrictedFiles.some((f) => path.endsWith(f) || path.includes(`/${f}`));
}

function isRestrictedFolder(path: string, policy: RiskPolicySpec): boolean {
  return policy.restrictedFolders.some((rf) => path.startsWith(rf) || path.includes(rf));
}

function isPermittedFolder(path: string, policy: RiskPolicySpec): boolean {
  return policy.permittedFolders.some((pf) => path.startsWith(pf));
}

function createPathRisk(
  category: PathRisk["category"],
  riskLevel: RiskLevel,
  path: string,
  activity: AgentActivity
): PathRisk {
  return {
    riskId: `path-risk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    riskLevel,
    category,
    path,
    activity,
    evidence: {
      sourceActivity: activity.id,
      timestamp: activity.timestamp,
      accessType: activity.accessType || "unknown",
      sourceFile: activity.evidence?.sourceFile,
      lineNumber: activity.evidence?.lineNumber
    }
  };
}

function validatePathAccess(
  path: string,
  activity: AgentActivity,
  policy: RiskPolicySpec,
  risks: PathRisk[]
): void {
  if (isRestrictedFile(path, policy)) {
    risks.push(
      createPathRisk(
        "restricted_file",
        policy.riskClassification.touchingRestrictedFile,
        path,
        activity
      )
    );
    return;
  }

  if (isRestrictedFolder(path, policy)) {
    risks.push(
      createPathRisk(
        "restricted_folder",
        policy.riskClassification.accessingUnpermittedFolder,
        path,
        activity
      )
    );
    return;
  }

  if (!isPermittedFolder(path, policy)) {
    risks.push(
      createPathRisk(
        "unpermitted_folder",
        policy.riskClassification.accessingUnpermittedFolder,
        path,
        activity
      )
    );
  }
}

export function validatePaths(
  activityReport: AgentActivityReport,
  policy: RiskPolicySpec
): PathRisk[] {
  const risks: PathRisk[] = [];

  const pathActivities = activityReport.activities.filter(
    (a) =>
      a.actionType === "file_access" ||
      a.actionType === "folder_read" ||
      a.actionType === "folder_write"
  );

  for (const activity of pathActivities) {
    const path = activity.path || "";
    if (!path) continue;
    validatePathAccess(path, activity, policy, risks);
  }

  return risks;
}
