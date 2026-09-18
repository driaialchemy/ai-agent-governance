import { getAllAgentVersions } from "./registryLookup";
import { getGovernanceSpecForVersion } from "./specLookup";
import { GovernanceSpec } from "../specs/specTypes";

export type DecisionClass = "automated" | "human" | "shared" | "unclassified";

export type DecisionType =
  | "approval"
  | "promotion_staging"
  | "promotion_production"
  | "rollback";

export interface InventoryDecision {
  decision_id: string;
  classification: DecisionClass;
  risk: string | null;
  complexity: string | null;
  regulatory_impact: string | null;
  business_importance: string | null;
  source: string;
  versionId: string;
  agentId: string;
  decisionType: DecisionType;
}

function classifyFromApprovalPromotion(
  decisionType: DecisionType,
  spec: GovernanceSpec | undefined
): DecisionClass {
  if (!spec) {
    return "unclassified";
  }

  if (decisionType === "approval") {
    if (typeof spec.humanApprovalRequired !== "boolean") {
      return "unclassified";
    }
    return spec.humanApprovalRequired ? "human" : "automated";
  }

  if (decisionType === "promotion_staging") {
    if (typeof spec.promotionRules?.stagingRequiresApproval !== "boolean") {
      return "unclassified";
    }
    return spec.promotionRules.stagingRequiresApproval ? "shared" : "automated";
  }

  if (decisionType === "promotion_production") {
    const productionRequiresApproval = spec.promotionRules?.productionRequiresApproval;
    if (typeof productionRequiresApproval !== "boolean" && typeof spec.humanApprovalRequired !== "boolean") {
      return "unclassified";
    }
    if (productionRequiresApproval === true || spec.humanApprovalRequired === true) {
      return "human";
    }
    if (productionRequiresApproval === false && spec.humanApprovalRequired === false) {
      return "automated";
    }
    return "unclassified";
  }

  return "unclassified";
}

export function buildDecisionInventory(): InventoryDecision[] {
  const inventory: InventoryDecision[] = [];

  for (const version of getAllAgentVersions()) {
    const spec = getGovernanceSpecForVersion(version.id);
    const decisionTypes: DecisionType[] = [
      "approval",
      "promotion_staging",
      "promotion_production",
      "rollback",
    ];

    for (const decisionType of decisionTypes) {
      inventory.push({
        decision_id: `${version.id}:${decisionType}`,
        classification: classifyFromApprovalPromotion(decisionType, spec),
        risk: version.risk ?? null,
        complexity: version.complexity ?? null,
        regulatory_impact: version.regulatory_impact ?? null,
        business_importance: version.business_importance ?? null,
        source: `registry:${version.id}`,
        versionId: version.id,
        agentId: version.agentId,
        decisionType,
      });
    }
  }

  return inventory;
}
