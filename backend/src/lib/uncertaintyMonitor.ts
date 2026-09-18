export type UncertaintyCondition = "declining_trend" | "low_confidence_streak";

export interface UncertaintySample {
  agentId: string;
  confidence: number;
  timestamp: string;
}

export interface UncertaintyFlag {
  agent_id: string;
  condition: UncertaintyCondition;
  window_summary: {
    n: number;
    threshold: number;
    sample_count: number;
    confidences: number[];
    latest: number | null;
  };
}

export interface UncertaintyMonitorConfig {
  windowN: number;
  threshold: number;
}

const DEFAULT_CONFIG: UncertaintyMonitorConfig = {
  windowN: 5,
  threshold: 0.5,
};

const samplesByAgent = new Map<string, UncertaintySample[]>();

function readConfig(): UncertaintyMonitorConfig {
  const n = Number(process.env.UNCERTAINTY_WINDOW_N);
  const threshold = Number(process.env.UNCERTAINTY_THRESHOLD);
  return {
    windowN: Number.isFinite(n) && n >= 2 ? Math.floor(n) : DEFAULT_CONFIG.windowN,
    threshold:
      Number.isFinite(threshold) && threshold >= 0 && threshold <= 1
        ? threshold
        : DEFAULT_CONFIG.threshold,
  };
}

export function recordConfidence(
  agentId: string,
  confidence: number,
  timestamp: string = new Date().toISOString()
): void {
  if (!agentId || typeof confidence !== "number" || Number.isNaN(confidence)) {
    return;
  }
  const list = samplesByAgent.get(agentId) ?? [];
  list.push({ agentId, confidence, timestamp });
  samplesByAgent.set(agentId, list);
}

export function getRecordedSampleCount(): number {
  let count = 0;
  for (const list of samplesByAgent.values()) {
    count += list.length;
  }
  return count;
}

function windowOf(agentId: string, n: number): number[] {
  const list = samplesByAgent.get(agentId) ?? [];
  return list.slice(-n).map((sample) => sample.confidence);
}

function isStrictlyDeclining(values: number[]): boolean {
  if (values.length < 2) {
    return false;
  }
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] >= values[i - 1]) {
      return false;
    }
  }
  return true;
}

export function getUncertaintyFlags(
  config: UncertaintyMonitorConfig = readConfig()
): UncertaintyFlag[] {
  const flags: UncertaintyFlag[] = [];
  const { windowN, threshold } = config;

  for (const agentId of samplesByAgent.keys()) {
    const confidences = windowOf(agentId, windowN);
    const summary = {
      n: windowN,
      threshold,
      sample_count: confidences.length,
      confidences,
      latest: confidences.length ? confidences[confidences.length - 1] : null,
    };

    if (confidences.length >= windowN && isStrictlyDeclining(confidences)) {
      flags.push({
        agent_id: agentId,
        condition: "declining_trend",
        window_summary: summary,
      });
    }

    if (
      confidences.length >= windowN &&
      confidences.every((value) => value < threshold)
    ) {
      flags.push({
        agent_id: agentId,
        condition: "low_confidence_streak",
        window_summary: summary,
      });
    }
  }

  return flags;
}

export function clearUncertaintySamples(): void {
  samplesByAgent.clear();
}
