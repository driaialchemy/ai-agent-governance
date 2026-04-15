import { policyCheckResults, PolicyCheckResult } from "../data/policyChecks";

export function getAllPolicyCheckResults(): PolicyCheckResult[] {
  return policyCheckResults;
}

export function getPolicyCheckResultsByVersionId(versionId: string): PolicyCheckResult[] {
  return policyCheckResults.filter((result) => result.versionId === versionId);
}

export function didVersionPassPolicyChecks(versionId: string): boolean {
  const results = getPolicyCheckResultsByVersionId(versionId);

  if (results.length === 0) {
    return false;
  }

  return results.every((result) => result.passed);
}

export function getFailedPolicyChecksByVersionId(versionId: string): PolicyCheckResult[] {
  return getPolicyCheckResultsByVersionId(versionId).filter((result) => !result.passed);
}