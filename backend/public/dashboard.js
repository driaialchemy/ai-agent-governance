const state = {
  agents: [],
  versions: [],
  deployments: [],
  audit: [],
  benchmarks: [],
  policies: [],
  approval: null,
  promotion: {
    staging: null,
    production: null
  },
  selectedAgentId: "",
  selectedVersionId: ""
};

const els = {
  serverStatus: document.getElementById("server-status"),
  refreshButton: document.getElementById("refresh-button"),
  adminKey: document.getElementById("admin-key"),
  agentSelect: document.getElementById("agent-select"),
  versionSelect: document.getElementById("version-select"),
  versionDetail: document.getElementById("version-detail"),
  deploymentList: document.getElementById("deployment-list"),
  metricAgents: document.getElementById("metric-agents"),
  metricVersions: document.getElementById("metric-versions"),
  metricStaging: document.getElementById("metric-staging"),
  metricProduction: document.getElementById("metric-production"),
  metricAudit: document.getElementById("metric-audit"),
  decisionPill: document.getElementById("decision-pill"),
  confidenceRing: document.getElementById("confidence-ring"),
  confidenceScore: document.getElementById("confidence-score"),
  confidenceLevel: document.getElementById("confidence-level"),
  decisionReason: document.getElementById("decision-reason"),
  factorList: document.getElementById("factor-list"),
  validationList: document.getElementById("validation-list"),
  evaluateStaging: document.getElementById("evaluate-staging"),
  evaluateProduction: document.getElementById("evaluate-production"),
  promoteStaging: document.getElementById("promote-staging"),
  promoteProduction: document.getElementById("promote-production"),
  stagingCard: document.getElementById("staging-card"),
  productionCard: document.getElementById("production-card"),
  benchmarkTable: document.getElementById("benchmark-table"),
  policyTable: document.getElementById("policy-table"),
  auditList: document.getElementById("audit-list"),
  messageLog: document.getElementById("message-log")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed: ${path}`);
  }

  return body.data ?? body;
}

function setServerStatus(text, tone) {
  els.serverStatus.textContent = text;
  els.serverStatus.className = `status-pill ${tone}`;
}

function setMessage(text, tone = "neutral") {
  els.messageLog.innerHTML = `<div class="message ${tone}">${escapeHtml(text)}</div>`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function statusClass(value) {
  const normalized = String(value ?? "").toLowerCase();
  if (["approved", "allowed", "success", "high", "ok", "passed", "true"].includes(normalized)) {
    return "good";
  }
  if (["blocked_pending_remediation", "medium", "pending", "staging"].includes(normalized)) {
    return "warn";
  }
  if (["rejected", "denied", "low", "failed", "false"].includes(normalized)) {
    return "bad";
  }
  return "neutral";
}

function pill(text, tone) {
  return `<span class="status-pill ${tone || statusClass(text)}">${escapeHtml(text)}</span>`;
}

function getSelectedVersion() {
  return state.versions.find((version) => version.id === state.selectedVersionId);
}

function getAgent(agentId) {
  return state.agents.find((agent) => agent.id === agentId);
}

function versionLabel(version) {
  const agent = getAgent(version.agentId);
  return `${version.id} - ${agent?.name || version.agentId} v${version.version}`;
}

function filteredVersions() {
  return state.versions.filter((version) => version.agentId === state.selectedAgentId);
}

function renderMetrics() {
  els.metricAgents.textContent = String(state.agents.length);
  els.metricVersions.textContent = String(state.versions.length);
  els.metricAudit.textContent = String(state.audit.length);

  const staging = state.deployments.find((item) => item.environment === "staging");
  const production = state.deployments.find((item) => item.environment === "production");
  els.metricStaging.textContent = staging?.currentVersionId || "-";
  els.metricProduction.textContent = production?.currentVersionId || "-";
}

function renderSelectors() {
  els.agentSelect.innerHTML = state.agents
    .map((agent) => `<option value="${escapeHtml(agent.id)}">${escapeHtml(agent.name)}</option>`)
    .join("");
  els.agentSelect.value = state.selectedAgentId;

  const options = filteredVersions();
  els.versionSelect.innerHTML = options
    .map((version) => `<option value="${escapeHtml(version.id)}">${escapeHtml(versionLabel(version))}</option>`)
    .join("");
  els.versionSelect.value = state.selectedVersionId;
}

function renderVersionDetail() {
  const version = getSelectedVersion();
  const agent = version ? getAgent(version.agentId) : null;

  if (!version || !agent) {
    els.versionDetail.innerHTML = `<p class="empty">No version selected.</p>`;
    return;
  }

  els.versionDetail.innerHTML = [
    ["Agent Owner", agent.owner],
    ["Agent Status", agent.status],
    ["Model", version.model],
    ["Prompt Version", version.promptVersion],
    ["Created", formatDate(version.createdAt)]
  ]
    .map(([label, value]) => `
      <div class="detail-row">
        <span class="label">${escapeHtml(label)}</span>
        <span class="value">${escapeHtml(value)}</span>
      </div>
    `)
    .join("");
}

function renderDeployments() {
  if (state.deployments.length === 0) {
    els.deploymentList.innerHTML = `<p class="empty">No deployments found.</p>`;
    return;
  }

  els.deploymentList.innerHTML = state.deployments
    .map((deployment) => `
      <div class="deployment-row">
        <span class="label">${escapeHtml(deployment.environment)}</span>
        <span class="value">${escapeHtml(deployment.currentVersionId)}</span>
        <span class="muted">${escapeHtml(getAgent(deployment.agentId)?.name || deployment.agentId)} at ${escapeHtml(formatDate(deployment.deployedAt))}</span>
      </div>
    `)
    .join("");
}

function renderApproval() {
  const approval = state.approval;
  if (!approval) {
    els.decisionPill.textContent = "Pending";
    els.decisionPill.className = "status-pill neutral";
    els.confidenceRing.style.setProperty("--score", "0%");
    els.confidenceScore.textContent = "-";
    els.confidenceLevel.textContent = "Confidence";
    els.decisionReason.textContent = "Select a version to review.";
    els.factorList.innerHTML = "";
    els.validationList.innerHTML = "";
    return;
  }

  const score = approval.confidence?.score ?? 0;
  const level = approval.confidence?.level ?? "UNKNOWN";
  const factors = approval.confidence?.factors ?? {};

  els.decisionPill.textContent = approval.decision;
  els.decisionPill.className = `status-pill ${statusClass(approval.decision)}`;
  els.confidenceRing.style.setProperty("--score", `${Math.max(0, Math.min(100, score))}%`);
  els.confidenceScore.textContent = String(score);
  els.confidenceLevel.textContent = `${level} confidence`;
  els.decisionReason.textContent = approval.reason;

  els.factorList.innerHTML = [
    ["Benchmark", factors.benchmarkScore],
    ["Policy", factors.policyScore],
    ["Data Quality", factors.dataQualityScore],
    ["Deployment Bonus", factors.deploymentHistoryBonus]
  ]
    .map(([label, value]) => {
      const width = Math.max(0, Math.min(100, Number(value) || 0));
      return `
        <div class="factor-row">
          <div class="factor-top">
            <span>${escapeHtml(label)}</span>
            <span>${escapeHtml(value ?? 0)}</span>
          </div>
          <div class="factor-track"><div class="factor-fill" style="width:${width}%"></div></div>
        </div>
      `;
    })
    .join("");

  const errors = approval.validationErrors || [];
  els.validationList.innerHTML = errors.length
    ? errors.map((error) => `<div class="validation-item">${escapeHtml(error)}</div>`).join("")
    : "";
}

function renderPromotionCard(element, environment) {
  const result = state.promotion[environment];
  if (!result) {
    element.innerHTML = `
      <h3>${escapeHtml(environment)}</h3>
      <p class="empty">No promotion evaluation yet.</p>
    `;
    return;
  }

  element.innerHTML = `
    <h3>${escapeHtml(environment)}</h3>
    ${pill(result.allowed ? "allowed" : "blocked", result.allowed ? "good" : "bad")}
    <p class="muted">${escapeHtml(result.reason)}</p>
    <div class="detail-row">
      <span class="label">Approval</span>
      <span class="value">${escapeHtml(result.approvalDecision)}</span>
    </div>
  `;
}

function renderPromotion() {
  renderPromotionCard(els.stagingCard, "staging");
  renderPromotionCard(els.productionCard, "production");
}

function renderBenchmarks() {
  if (state.benchmarks.length === 0) {
    els.benchmarkTable.innerHTML = `<p class="empty">No benchmark data for this version.</p>`;
    return;
  }

  els.benchmarkTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Name</th><th>Score</th><th>Result</th><th>Collected</th></tr>
      </thead>
      <tbody>
        ${state.benchmarks.map((row) => `
          <tr>
            <td>${escapeHtml(row.benchmarkName)}</td>
            <td>${escapeHtml(row.score)} / ${escapeHtml(row.maxScore)}</td>
            <td>${pill(row.passed ? "passed" : "failed")}</td>
            <td>${escapeHtml(formatDate(row.createdAt))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderPolicies() {
  if (state.policies.length === 0) {
    els.policyTable.innerHTML = `<p class="empty">No policy checks for this version.</p>`;
    return;
  }

  els.policyTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Name</th><th>Severity</th><th>Result</th><th>Notes</th></tr>
      </thead>
      <tbody>
        ${state.policies.map((row) => `
          <tr>
            <td>${escapeHtml(row.policyName)}</td>
            <td>${escapeHtml(row.severity)}</td>
            <td>${pill(row.passed ? "passed" : "failed")}</td>
            <td>${escapeHtml(row.notes)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderAudit() {
  const relevant = state.audit
    .filter((entry) => entry.versionId === state.selectedVersionId)
    .slice()
    .reverse()
    .slice(0, 8);

  if (relevant.length === 0) {
    els.auditList.innerHTML = `<p class="empty">No audit events for this version.</p>`;
    return;
  }

  els.auditList.innerHTML = relevant
    .map((entry) => `
      <div class="audit-row">
        <span class="label">${escapeHtml(entry.actionType)}</span>
        <span class="value">${escapeHtml(entry.outcome)} ${entry.environment ? `in ${escapeHtml(entry.environment)}` : ""}</span>
        <span class="muted">${escapeHtml(formatDate(entry.timestamp))} - ${escapeHtml(entry.reason)}</span>
      </div>
    `)
    .join("");
}

function renderAll() {
  renderMetrics();
  renderSelectors();
  renderVersionDetail();
  renderDeployments();
  renderApproval();
  renderPromotion();
  renderBenchmarks();
  renderPolicies();
  renderAudit();
}

async function loadBaseData() {
  const [health, agents, versions, deployments, audit] = await Promise.all([
    api("/health"),
    api("/agents"),
    api("/versions"),
    api("/deployments"),
    api("/audit-log")
  ]);

  state.agents = agents;
  state.versions = versions;
  state.deployments = deployments;
  state.audit = audit;

  if (!state.selectedAgentId && agents[0]) {
    state.selectedAgentId = agents[0].id;
  }
  if (!state.selectedVersionId) {
    const firstVersion = filteredVersions()[0] || versions[0];
    state.selectedVersionId = firstVersion?.id || "";
    state.selectedAgentId = firstVersion?.agentId || state.selectedAgentId;
  }

  setServerStatus(health.status || "OK", "good");
}

async function loadSelectedVersion() {
  if (!state.selectedVersionId) return;
  const [approval, benchmarks, policies, audit] = await Promise.all([
    api(`/versions/${state.selectedVersionId}/approval`),
    api(`/versions/${state.selectedVersionId}/benchmarks`),
    api(`/versions/${state.selectedVersionId}/policy-checks`),
    api("/audit-log")
  ]);

  state.approval = approval;
  state.benchmarks = benchmarks;
  state.policies = policies;
  state.audit = audit;
}

async function refreshAll(message) {
  try {
    await loadBaseData();
    await loadSelectedVersion();
    renderAll();
    if (message) setMessage(message, "good");
  } catch (error) {
    setServerStatus("Error", "bad");
    setMessage(error.message, "bad");
  }
}

async function evaluatePromotion(environment) {
  if (!state.selectedVersionId) return;
  try {
    const result = await api(`/versions/${state.selectedVersionId}/promotion/${environment}`);
    state.promotion[environment] = result;
    renderPromotion();
    setMessage(`${environment} evaluation complete.`, result.allowed ? "good" : "bad");
  } catch (error) {
    setMessage(error.message, "bad");
  }
}

async function promote(environment) {
  const adminKey = els.adminKey.value.trim();
  if (!adminKey) {
    setMessage("Admin key is required for promotion.", "bad");
    return;
  }

  try {
    const result = await api(`/versions/${state.selectedVersionId}/promotion/${environment}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-api-key": adminKey
      }
    });
    state.promotion[environment] = result;
    await loadBaseData();
    await loadSelectedVersion();
    renderAll();
    setMessage(`Promoted ${state.selectedVersionId} to ${environment}.`, "good");
  } catch (error) {
    setMessage(error.message, "bad");
  }
}

els.agentSelect.addEventListener("change", async (event) => {
  state.selectedAgentId = event.target.value;
  const nextVersion = filteredVersions()[0];
  state.selectedVersionId = nextVersion?.id || "";
  state.promotion.staging = null;
  state.promotion.production = null;
  await refreshAll();
});

els.versionSelect.addEventListener("change", async (event) => {
  state.selectedVersionId = event.target.value;
  state.promotion.staging = null;
  state.promotion.production = null;
  await refreshAll();
});

els.refreshButton.addEventListener("click", () => refreshAll("Dashboard refreshed."));
els.evaluateStaging.addEventListener("click", () => evaluatePromotion("staging"));
els.evaluateProduction.addEventListener("click", () => evaluatePromotion("production"));
els.promoteStaging.addEventListener("click", () => promote("staging"));
els.promoteProduction.addEventListener("click", () => promote("production"));

refreshAll();
