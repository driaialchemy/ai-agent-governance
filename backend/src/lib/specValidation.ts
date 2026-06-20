import { getVersionById } from "./registryLookup";
import { getGovernanceSpecForVersion } from "./specLookup";
import { getBenchmarkResultsByVersionId } from "./benchmarkLookup";
import { getPolicyCheckResultsByVersionId } from "./policyCheckLookup";
import { getVersionCapabilities } from "./versionCapabilities";
import {
  getCurrentDeployedVersionId,
  getPreviousDeployedVersionIds,
  Environment
} from "../data/deploymentState";
import {
  GovernanceEnvironment,
  GovernanceSpec,
  SpecValidationResult
} from "../specs/specTypes";

function buildMissingSpecResult(versionId: string): SpecValidationResult {
  return {
    allowed: false,
    outcome: "missing_spec",
    reasons: [`No governance spec found for version ${versionId}.`]
  };
}

function buildFailedResult(
  spec: GovernanceSpec | undefined,
  reasons: string[]
): SpecValidationResult {
  return {
    allowed: false,
    outcome: "failed",
    reasons,
    specId: spec?.specId,
    specVersion: spec?.specVersion
  };
}

function buildPassedResult(spec: GovernanceSpec): SpecValidationResult {
  return {
    allowed: true,
    outcome: "passed",
    reasons: ["Governance spec validation passed."],
    specId: spec.specId,
    specVersion: spec.specVersion
  };
}

function validateSpecStructure(
  versionId: string,
  spec: GovernanceSpec
): string[] {
  const reasons: string[] = [];
  const version = getVersionById(versionId);

  if (spec.versionId !== versionId) {
    reasons.push(
      `Spec validation failed because spec versionId '${spec.versionId}' does not match requested version '${versionId}'.`
    );
  }

  if (version && spec.agentId !== version.agentId) {
    reasons.push(
      `Spec validation failed because spec agentId '${spec.agentId}' does not match version agentId '${version.agentId}'.`
    );
  }

  if (spec.allowedEnvironments.length === 0) {
    reasons.push(
      "Spec validation failed because no allowed environments are defined."
    );
  }

  if (spec.requiredBenchmarkIds.length === 0) {
    reasons.push(
      "Spec validation failed because no required benchmarks are defined."
    );
  }

  if (spec.requiredPolicyCheckIds.length === 0) {
    reasons.push(
      "Spec validation failed because no required policy checks are defined."
    );
  }

  const versionCapabilities = getVersionCapabilities(versionId);

  for (const requiredCapability of spec.requiredCapabilities) {
    if (!versionCapabilities.includes(requiredCapability)) {
      reasons.push(
        `Spec validation failed because required capability '${requiredCapability}' is missing from version ${versionId}.`
      );
    }
  }

  for (const prohibitedCapability of spec.prohibitedCapabilities) {
    if (versionCapabilities.includes(prohibitedCapability)) {
      reasons.push(
        `Spec validation failed because prohibited capability '${prohibitedCapability}' is present on version ${versionId}.`
      );
    }
  }

  const benchmarkResults = getBenchmarkResultsByVersionId(versionId);
  const benchmarkIdsForVersion = new Set(benchmarkResults.map((result) => result.id));

  for (const requiredBenchmarkId of spec.requiredBenchmarkIds) {
    if (!benchmarkIdsForVersion.has(requiredBenchmarkId)) {
      reasons.push(
        `Spec validation failed because required benchmark '${requiredBenchmarkId}' is missing for version ${versionId}.`
      );
    }
  }

  if (benchmarkResults.length > 0) {
    const passRate =
      benchmarkResults.filter((result) => result.passed).length /
      benchmarkResults.length;

    if (passRate < spec.minimumBenchmarkPassRate) {
      reasons.push(
        `Spec validation failed because benchmark pass rate ${passRate.toFixed(2)} is below required minimum ${spec.minimumBenchmarkPassRate}.`
      );
    }
  }

  const policyResults = getPolicyCheckResultsByVersionId(versionId);
  const policyIdsForVersion = new Set(policyResults.map((result) => result.id));

  for (const requiredPolicyCheckId of spec.requiredPolicyCheckIds) {
    if (!policyIdsForVersion.has(requiredPolicyCheckId)) {
      reasons.push(
        `Spec validation failed because required policy check '${requiredPolicyCheckId}' is missing for version ${versionId}.`
      );
    }
  }

  return reasons;
}

function wasVersionDeployedToStaging(versionId: string): boolean {
  const currentStagingVersion = getCurrentDeployedVersionId("staging");
  if (currentStagingVersion === versionId) {
    return true;
  }

  return getPreviousDeployedVersionIds("staging").includes(versionId);
}

export function validateSpecForVersion(versionId: string): SpecValidationResult {
  const spec = getGovernanceSpecForVersion(versionId);

  if (!spec) {
    return buildMissingSpecResult(versionId);
  }

  const reasons = validateSpecStructure(versionId, spec);

  if (reasons.length > 0) {
    return buildFailedResult(spec, reasons);
  }

  return buildPassedResult(spec);
}

export function validateSpecForPromotion(
  versionId: string,
  targetEnvironment: GovernanceEnvironment
): SpecValidationResult {
  const baseResult = validateSpecForVersion(versionId);

  if (!baseResult.allowed) {
    return baseResult;
  }

  const spec = getGovernanceSpecForVersion(versionId)!;
  const reasons: string[] = [];

  if (!spec.allowedEnvironments.includes(targetEnvironment)) {
    reasons.push(
      `Promotion denied because ${targetEnvironment} is not an allowed environment for this spec.`
    );
  }

  if (
    targetEnvironment === "staging" &&
    spec.promotionRules.stagingRequiresApproval
  ) {
    // Approval is checked separately in promotion logic; spec defines the rule exists.
  }

  if (targetEnvironment === "production") {
    if (spec.promotionRules.productionRequiresPriorStaging) {
      if (!wasVersionDeployedToStaging(versionId)) {
        reasons.push(
          "Production promotion denied because this spec requires prior staging deployment."
        );
      }
    }
  }

  if (reasons.length > 0) {
    return buildFailedResult(spec, reasons);
  }

  return buildPassedResult(spec);
}

export function validateSpecForRollback(
  targetVersionId: string,
  targetEnvironment: Environment
): SpecValidationResult {
  const baseResult = validateSpecForVersion(targetVersionId);

  if (!baseResult.allowed) {
    return baseResult;
  }

  const spec = getGovernanceSpecForVersion(targetVersionId)!;
  const reasons: string[] = [];

  if (!spec.rollbackRules.rollbackAllowed) {
    reasons.push("Rollback denied because this spec does not allow rollback.");
  }

  if (!spec.allowedEnvironments.includes(targetEnvironment)) {
    reasons.push(
      `Rollback denied because ${targetEnvironment} is not an allowed environment for this spec.`
    );
  }

  if (reasons.length > 0) {
    return buildFailedResult(spec, reasons);
  }

  return buildPassedResult(spec);
}
