"""
AI Agent Governance Dashboard
Local Streamlit control panel for the SDD governance workflow.
"""

from __future__ import annotations

import json
from typing import Any

import pandas as pd
import requests
import streamlit as st

DEFAULT_BASE_URL = "http://localhost:3000"
REQUEST_TIMEOUT = 10

# Known synthetic version IDs for demo scenarios
VERSION_VALID_SPEC = "ver-002"
VERSION_MISSING_SPEC = "ver-004"
VERSION_STAGING_PROMOTION = "ver-002"
VERSION_PRODUCTION_PRIOR_STAGING = "ver-002"
VERSION_ROLLBACK_DENIED = "ver-003"
VERSION_ROLLBACK_TARGET = "ver-002"


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------


def get_base_url() -> str:
    return st.session_state.get("base_url", DEFAULT_BASE_URL).rstrip("/")


def api_get(path: str) -> requests.Response | None:
    url = f"{get_base_url()}{path}"
    try:
        return requests.get(url, timeout=REQUEST_TIMEOUT)
    except requests.ConnectionError:
        st.error(
            "Cannot connect to the backend. Start the backend with: "
            "`cd backend` then `npx tsx src/server.ts`"
        )
        return None
    except requests.Timeout:
        st.error("Request timed out. Is the backend running?")
        return None
    except requests.RequestException as exc:
        st.error(f"Request failed: {exc}")
        return None


def api_post(path: str) -> requests.Response | None:
    url = f"{get_base_url()}{path}"
    try:
        return requests.post(url, timeout=REQUEST_TIMEOUT)
    except requests.ConnectionError:
        st.error(
            "Cannot connect to the backend. Start the backend with: "
            "`cd backend` then `npx tsx src/server.ts`"
        )
        return None
    except requests.Timeout:
        st.error("Request timed out. Is the backend running?")
        return None
    except requests.RequestException as exc:
        st.error(f"Request failed: {exc}")
        return None


def safe_json(response: requests.Response) -> dict[str, Any] | list[Any] | None:
    try:
        return response.json()
    except json.JSONDecodeError:
        st.error("Backend returned invalid JSON.")
        return None


def show_response(response: requests.Response, title: str = "Response") -> dict[str, Any] | list[Any] | None:
    payload = safe_json(response)
    st.caption(f"{title} — HTTP {response.status_code}")
    if response.ok:
        st.success("Request succeeded.")
    elif response.status_code == 404:
        st.warning("Resource not found (404).")
    elif response.status_code == 400:
        st.error("Action denied or bad request (400).")
    else:
        st.error(f"Request failed with status {response.status_code}.")

    if payload is not None:
        with st.expander("Raw JSON", expanded=False):
            st.json(payload)
    return payload


def extract_data(payload: dict[str, Any] | list[Any] | None) -> Any:
    if isinstance(payload, dict) and payload.get("success") and "data" in payload:
        return payload["data"]
    return None


def load_agents() -> list[dict[str, Any]]:
    response = api_get("/agents")
    if response is None:
        return []
    payload = safe_json(response)
    data = extract_data(payload) if isinstance(payload, dict) else None
    return data if isinstance(data, list) else []


def load_versions() -> list[dict[str, Any]]:
    response = api_get("/versions")
    if response is None:
        return []
    payload = safe_json(response)
    data = extract_data(payload) if isinstance(payload, dict) else None
    return data if isinstance(data, list) else []


def load_specs() -> list[dict[str, Any]]:
    response = api_get("/specs")
    if response is None:
        return []
    payload = safe_json(response)
    data = extract_data(payload) if isinstance(payload, dict) else None
    return data if isinstance(data, list) else []


def load_deployments() -> list[dict[str, Any]]:
    response = api_get("/deployments")
    if response is None:
        return []
    payload = safe_json(response)
    data = extract_data(payload) if isinstance(payload, dict) else None
    return data if isinstance(data, list) else []


def load_audit_log() -> list[dict[str, Any]]:
    response = api_get("/audit-log")
    if response is None:
        return []
    payload = safe_json(response)
    data = extract_data(payload) if isinstance(payload, dict) else None
    return data if isinstance(data, list) else []


def check_health() -> tuple[bool, dict[str, Any] | None]:
    response = api_get("/health")
    if response is None:
        return False, None
    payload = safe_json(response)
    if response.ok and isinstance(payload, dict) and payload.get("success"):
        return True, payload
    return False, payload if isinstance(payload, dict) else None


def version_label(version: dict[str, Any]) -> str:
    version_number = version.get("version", "?")
    version_id = version.get("id", "?")
    return f"{version_id} (v{version_number})"


def render_success_failure(
    allowed: bool | None,
    success_message: str,
    failure_message: str,
    warning_message: str | None = None,
    is_warning: bool = False,
) -> None:
    if is_warning:
        st.warning(warning_message or failure_message)
    elif allowed is True:
        st.success(success_message)
    elif allowed is False:
        st.error(failure_message)
    else:
        st.info("No result to display yet.")


def deployment_summary(deployments: list[dict[str, Any]]) -> tuple[str, str]:
    staging = "—"
    production = "—"
    for record in deployments:
        env = record.get("environment")
        current = record.get("currentVersionId", "—")
        if env == "staging":
            staging = current
        elif env == "production":
            production = current
    return staging, production


def reasons_as_bullets(reasons: list[str] | str | None) -> None:
    if not reasons:
        return
    if isinstance(reasons, str):
        st.markdown(f"- {reasons}")
        return
    for reason in reasons:
        st.markdown(f"- {reason}")


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


def view_system_overview() -> None:
    st.header("System Overview")
    st.write("Quick snapshot of backend health and governance state.")

    if st.button("Refresh system status", key="overview_refresh"):
        st.session_state["overview_refresh"] = True

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Check backend health", key="overview_health"):
            st.session_state["overview_health"] = True

    healthy, health_payload = check_health()
    if healthy:
        st.success("Backend is reachable and healthy.")
    else:
        st.error(
            "Backend is not reachable. Start the backend with: "
            "`cd backend` then `npx tsx src/server.ts`"
        )
        if health_payload:
            with st.expander("Health response"):
                st.json(health_payload)
        return

    agents = load_agents()
    versions = load_versions()
    specs = load_specs()
    deployments = load_deployments()
    audit_entries = load_audit_log()
    staging, production = deployment_summary(deployments)

    metrics = pd.DataFrame(
        [
            {"Metric": "Total agents", "Value": len(agents)},
            {"Metric": "Total versions", "Value": len(versions)},
            {"Metric": "Total governance specs", "Value": len(specs)},
            {"Metric": "Staging deployment", "Value": staging},
            {"Metric": "Production deployment", "Value": production},
            {"Metric": "Audit log entries", "Value": len(audit_entries)},
        ]
    )
    st.dataframe(metrics, use_container_width=True, hide_index=True)


def view_agent_registry() -> None:
    st.header("Agent Registry")
    st.write("Browse agents, versions, benchmarks, policy checks, and governance specs.")

    agents = load_agents()
    if not agents:
        st.warning("No agents loaded. Check that the backend is running.")
        return

    agent_options = {a["name"]: a["id"] for a in agents}
    selected_agent_name = st.selectbox("Select agent", list(agent_options.keys()))
    selected_agent_id = agent_options[selected_agent_name]

    col1, col2, col3 = st.columns(3)
    with col1:
        load_agent_btn = st.button("Load selected agent")
    with col2:
        load_versions_btn = st.button("Load versions for agent")

    if load_agent_btn:
        response = api_get(f"/agents/{selected_agent_id}")
        if response:
            payload = show_response(response, "Agent details")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if data:
                st.json(data)

    versions: list[dict[str, Any]] = []
    if load_versions_btn or True:
        response = api_get(f"/agents/{selected_agent_id}/versions")
        if response and response.ok:
            payload = safe_json(response)
            data = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(data, list):
                versions = data

    if not versions:
        st.info("Select an agent to see its versions.")
        return

    version_map = {version_label(v): v["id"] for v in versions}
    selected_version_label = st.selectbox("Select version", list(version_map.keys()))
    selected_version_id = version_map[selected_version_label]

    col_a, col_b, col_c, col_d = st.columns(4)
    with col_a:
        btn_version = st.button("Load selected version")
    with col_b:
        btn_benchmarks = st.button("Load benchmarks")
    with col_c:
        btn_policies = st.button("Load policy checks")
    with col_d:
        btn_spec = st.button("Load governance spec")

    if btn_version:
        response = api_get(f"/versions/{selected_version_id}")
        if response:
            payload = show_response(response, "Version details")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if data:
                st.markdown(f"**Version ID:** {data.get('id')}")
                st.markdown(f"**Agent ID:** {data.get('agentId')}")
                st.markdown(f"**Version:** {data.get('version')}")
                st.markdown(f"**Model:** {data.get('model')}")

                approval_resp = api_get(f"/versions/{selected_version_id}/approval")
                if approval_resp and approval_resp.ok:
                    approval_payload = safe_json(approval_resp)
                    approval_data = extract_data(approval_payload) if isinstance(approval_payload, dict) else None
                    if approval_data:
                        st.markdown(f"**Approval decision:** {approval_data.get('decision')}")

    if btn_benchmarks:
        response = api_get(f"/versions/{selected_version_id}/benchmarks/summary")
        if response:
            show_response(response, "Benchmark summary")
        detail = api_get(f"/versions/{selected_version_id}/benchmarks")
        if detail and detail.ok:
            payload = safe_json(detail)
            rows = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(rows, list) and rows:
                st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    if btn_policies:
        response = api_get(f"/versions/{selected_version_id}/policy-checks/summary")
        if response:
            show_response(response, "Policy check summary")
        detail = api_get(f"/versions/{selected_version_id}/policy-checks")
        if detail and detail.ok:
            payload = safe_json(detail)
            rows = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(rows, list) and rows:
                st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    if btn_spec:
        response = api_get(f"/versions/{selected_version_id}/spec")
        if response is None:
            return
        if response.status_code == 404:
            st.warning(f"No governance spec found for version {selected_version_id}.")
            show_response(response, "Governance spec")
        elif response.ok:
            st.success("Governance spec loaded.")
            show_response(response, "Governance spec")
        else:
            st.error("Failed to load governance spec.")
            show_response(response, "Governance spec")


def view_spec_validation() -> None:
    st.header("Spec Validation")
    st.write("Check whether a version satisfies its governance spec (read-only).")

    versions = load_versions()
    if not versions:
        st.warning("No versions available.")
        return

    version_map = {version_label(v): v["id"] for v in versions}
    selected_label = st.selectbox("Select version", list(version_map.keys()), key="spec_val_version")
    selected_id = version_map[selected_label]

    if st.button("Validate Spec", key="validate_spec_btn"):
        response = api_get(f"/versions/{selected_id}/spec-validation")
        if response is None:
            return
        payload = show_response(response, "Spec validation")
        data = extract_data(payload) if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            return

        outcome = data.get("outcome")
        allowed = data.get("allowed")

        st.markdown(f"**allowed:** `{allowed}`")
        st.markdown(f"**outcome:** `{outcome}`")
        if data.get("specId"):
            st.markdown(f"**specId:** `{data.get('specId')}`")
        if data.get("specVersion"):
            st.markdown(f"**specVersion:** `{data.get('specVersion')}`")

        st.markdown("**Reasons:**")
        reasons_as_bullets(data.get("reasons"))

        if outcome == "missing_spec":
            st.warning("No governance spec found.")
        elif allowed is True:
            st.success("Spec validation passed.")
        elif allowed is False:
            st.error("Spec validation failed.")


def view_approval_decision() -> None:
    st.header("Approval Decision")
    st.write("Read-only approval check after spec validation, benchmarks, and policy checks.")

    versions = load_versions()
    if not versions:
        st.warning("No versions available.")
        return

    version_map = {version_label(v): v["id"] for v in versions}
    selected_label = st.selectbox("Select version", list(version_map.keys()), key="approval_version")
    selected_id = version_map[selected_label]

    if st.button("Check Approval", key="check_approval_btn"):
        spec_resp = api_get(f"/versions/{selected_id}/spec-validation")
        if spec_resp and spec_resp.ok:
            spec_payload = safe_json(spec_resp)
            spec_data = extract_data(spec_payload) if isinstance(spec_payload, dict) else None
            if isinstance(spec_data, dict):
                st.markdown("**Spec validation status**")
                st.markdown(f"- outcome: `{spec_data.get('outcome')}`")
                st.markdown(f"- allowed: `{spec_data.get('allowed')}`")

        response = api_get(f"/versions/{selected_id}/approval")
        if response is None:
            return
        payload = show_response(response, "Approval")
        data = extract_data(payload) if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            return

        decision = data.get("decision")
        st.markdown(f"**Approval status:** `{decision}`")
        st.markdown(f"**Reason:** {data.get('reason')}")
        st.markdown(f"**Benchmark passed:** `{data.get('benchmarkPassed')}`")
        st.markdown(f"**Policy passed:** `{data.get('policyPassed')}`")

        if decision == "approved":
            st.success("Version is approved.")
        elif decision == "rejected":
            st.error("Version is rejected.")
        elif decision == "blocked_pending_remediation":
            st.warning("Version is blocked pending remediation.")


def view_promotion_control() -> None:
    st.header("Promotion Control")
    st.write("Evaluate (read-only) or execute (mutates deployment state) promotion.")

    versions = load_versions()
    if not versions:
        st.warning("No versions available.")
        return

    version_map = {version_label(v): v["id"] for v in versions}
    selected_label = st.selectbox("Select version", list(version_map.keys()), key="promo_version")
    selected_id = version_map[selected_label]
    environment = st.selectbox("Target environment", ["staging", "production"], key="promo_env")

    deployments_before = load_deployments()
    staging_before, production_before = deployment_summary(deployments_before)
    st.info(f"Current staging: **{staging_before}** | Current production: **{production_before}**")

    col1, col2 = st.columns(2)
    with col1:
        evaluate_btn = st.button("Evaluate Promotion", key="promo_eval")
    with col2:
        confirm_mutate = st.checkbox(
            "I understand this will mutate local in-memory deployment state.",
            key="promo_confirm",
        )
        execute_btn = st.button("Execute Promotion", key="promo_exec", disabled=not confirm_mutate)

    if evaluate_btn:
        response = api_get(f"/versions/{selected_id}/promotion/{environment}")
        if response is None:
            return
        payload = show_response(response, "Promotion evaluation")
        data = extract_data(payload) if isinstance(payload, dict) else None
        if isinstance(data, dict):
            render_success_failure(
                data.get("allowed"),
                "Promotion is allowed.",
                "Promotion is denied.",
            )
            st.markdown(f"**Reason:** {data.get('reason')}")
            st.markdown(f"**Approval decision:** `{data.get('approvalDecision')}`")

            spec_resp = api_get(f"/versions/{selected_id}/spec")
            if spec_resp and spec_resp.ok:
                spec_payload = safe_json(spec_resp)
                spec_data = extract_data(spec_payload) if isinstance(spec_payload, dict) else None
                if isinstance(spec_data, dict):
                    allowed_envs = spec_data.get("allowedEnvironments", [])
                    rules = spec_data.get("promotionRules", {})
                    st.markdown(f"**Spec allowed environments:** {allowed_envs}")
                    st.markdown(f"**Production requires prior staging:** `{rules.get('productionRequiresPriorStaging')}`")
                    st.markdown(f"**Production requires approval:** `{rules.get('productionRequiresApproval')}`")

    if execute_btn:
        response = api_post(f"/versions/{selected_id}/promotion/{environment}")
        if response is None:
            return
        payload = show_response(response, "Promotion execution")
        data = extract_data(payload) if isinstance(payload, dict) else None
        if isinstance(payload, dict) and not payload.get("success"):
            st.error(payload.get("message", "Promotion denied."))

        deployments_after = load_deployments()
        staging_after, production_after = deployment_summary(deployments_after)
        st.markdown("**Deployment after action**")
        st.markdown(f"- Staging: `{staging_after}`")
        st.markdown(f"- Production: `{production_after}`")

        if isinstance(data, dict) and data.get("allowed"):
            st.success("Promotion executed successfully.")
        elif response.status_code == 400:
            st.error("Promotion execution was denied.")


def view_rollback_control() -> None:
    st.header("Rollback Control")
    st.write("Evaluate (read-only) or execute (mutates deployment state) rollback.")

    versions = load_versions()
    version_ids = [v["id"] for v in versions] if versions else []

    environment = st.selectbox("Environment", ["staging", "production"], key="rollback_env")
    target_version_id = st.selectbox("Rollback target version", version_ids, key="rollback_target")

    deployments = load_deployments()
    staging, production = deployment_summary(deployments)
    current = staging if environment == "staging" else production
    st.info(f"Current {environment} deployment: **{current}**")

    col1, col2 = st.columns(2)
    with col1:
        evaluate_btn = st.button("Evaluate Rollback", key="rollback_eval")
    with col2:
        confirm_mutate = st.checkbox(
            "I understand this will mutate local in-memory deployment state.",
            key="rollback_confirm",
        )
        execute_btn = st.button("Execute Rollback", key="rollback_exec", disabled=not confirm_mutate)

    if evaluate_btn:
        response = api_get(f"/rollback/{environment}/{target_version_id}")
        if response is None:
            return
        payload = show_response(response, "Rollback evaluation")
        data = extract_data(payload) if isinstance(payload, dict) else None
        if isinstance(data, dict):
            render_success_failure(
                data.get("allowed"),
                "Rollback is allowed.",
                "Rollback is denied.",
            )
            st.markdown(f"**Reason:** {data.get('reason')}")
            st.markdown(f"**Current version:** `{data.get('currentVersionId')}`")
            st.markdown(f"**Target version:** `{data.get('targetVersionId')}`")

            spec_resp = api_get(f"/versions/{target_version_id}/spec-validation")
            if spec_resp and spec_resp.ok:
                spec_payload = safe_json(spec_resp)
                spec_data = extract_data(spec_payload) if isinstance(spec_payload, dict) else None
                if isinstance(spec_data, dict):
                    st.markdown(f"**Target spec validation:** `{spec_data.get('outcome')}`")

            spec_detail = api_get(f"/versions/{target_version_id}/spec")
            if spec_detail and spec_detail.ok:
                spec_payload = safe_json(spec_detail)
                spec_data = extract_data(spec_payload) if isinstance(spec_payload, dict) else None
                if isinstance(spec_data, dict):
                    rollback_rules = spec_data.get("rollbackRules", {})
                    st.markdown(f"**Spec allows rollback:** `{rollback_rules.get('rollbackAllowed')}`")

    if execute_btn:
        response = api_post(f"/rollback/{environment}/{target_version_id}")
        if response is None:
            return
        payload = show_response(response, "Rollback execution")
        data = extract_data(payload) if isinstance(payload, dict) else None
        if isinstance(payload, dict) and not payload.get("success"):
            st.error(payload.get("message", "Rollback denied."))

        deployments_after = load_deployments()
        staging_after, production_after = deployment_summary(deployments_after)
        st.markdown("**Deployment after action**")
        st.markdown(f"- Staging: `{staging_after}`")
        st.markdown(f"- Production: `{production_after}`")

        if isinstance(data, dict) and data.get("allowed"):
            st.success("Rollback executed successfully.")
        elif response.status_code == 400:
            st.error("Rollback execution was denied.")


def run_scenario(name: str, description: str, runner) -> None:
    st.markdown(f"**{name}**")
    st.caption(description)
    if st.button(f"Run: {name}", key=f"scenario_{name}"):
        with st.spinner("Running scenario..."):
            runner()


def view_demo_scenarios() -> None:
    st.header("Success and Failure Scenarios")
    st.write("One-click demos using known synthetic data in the backend.")

    def scenario_a():
        response = api_get(f"/versions/{VERSION_VALID_SPEC}/spec-validation")
        if response:
            payload = show_response(response, "Scenario A")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(data, dict) and data.get("allowed"):
                st.success("Expected: spec validation passes for ver-002.")

    def scenario_b():
        response = api_get(f"/versions/{VERSION_MISSING_SPEC}/approval")
        if response:
            payload = show_response(response, "Scenario B")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(data, dict):
                if data.get("decision") == "blocked_pending_remediation":
                    st.warning("Expected: missing spec blocks approval for ver-004.")
                else:
                    st.info(f"Decision was: {data.get('decision')}")

    def scenario_c():
        response = api_get(f"/versions/{VERSION_STAGING_PROMOTION}/promotion/staging")
        if response:
            payload = show_response(response, "Scenario C")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(data, dict) and data.get("allowed"):
                st.success("Expected: staging promotion allowed for approved ver-002.")

    def scenario_d():
        response = api_get(f"/versions/{VERSION_PRODUCTION_PRIOR_STAGING}/promotion/production")
        if response:
            payload = show_response(response, "Scenario D")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(data, dict) and not data.get("allowed"):
                st.error("Expected: production promotion denied without prior staging.")
                if "prior staging" in (data.get("reason") or "").lower():
                    st.success("Denial reason mentions prior staging requirement.")

    def scenario_e():
        response = api_get(f"/rollback/production/ver-004")
        if response:
            payload = show_response(response, "Scenario E")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(data, dict) and not data.get("allowed"):
                st.error("Expected: rollback denied for ver-004 (not previously deployed).")

    def scenario_f():
        response = api_get(f"/rollback/production/{VERSION_ROLLBACK_TARGET}")
        if response:
            payload = show_response(response, "Scenario F")
            data = extract_data(payload) if isinstance(payload, dict) else None
            if isinstance(data, dict):
                if data.get("allowed"):
                    st.success("Expected: rollback to ver-002 is allowed when rules are satisfied.")
                else:
                    st.warning(
                        "Rollback to ver-002 was denied. Current deployment state may differ "
                        "after earlier demo actions. Try restarting the backend to reset data."
                    )
                    st.markdown(f"**Reason:** {data.get('reason')}")

    run_scenario(
        "Scenario A: Valid version spec validation passes",
        f"Runs GET /versions/{VERSION_VALID_SPEC}/spec-validation — expected to pass.",
        scenario_a,
    )
    st.divider()
    run_scenario(
        "Scenario B: Missing spec blocks approval",
        f"Runs GET /versions/{VERSION_MISSING_SPEC}/approval — ver-004 has no governance spec.",
        scenario_b,
    )
    st.divider()
    run_scenario(
        "Scenario C: Promotion to staging succeeds",
        f"Runs GET /versions/{VERSION_STAGING_PROMOTION}/promotion/staging — evaluate only.",
        scenario_c,
    )
    st.divider()
    run_scenario(
        "Scenario D: Production fails without prior staging",
        f"Runs GET /versions/{VERSION_PRODUCTION_PRIOR_STAGING}/promotion/production — spec requires prior staging.",
        scenario_d,
    )
    st.divider()
    run_scenario(
        "Scenario E: Rollback fails when target is invalid",
        "Runs GET /rollback/production/ver-004 — ver-004 was never deployed to production.",
        scenario_e,
    )
    st.divider()
    run_scenario(
        "Scenario F: Rollback succeeds when rules are satisfied",
        f"Runs GET /rollback/production/{VERSION_ROLLBACK_TARGET} — depends on current deployment history.",
        scenario_f,
    )

    st.divider()
    st.caption(
        f"Note: Rollback to {VERSION_ROLLBACK_DENIED} is denied by spec (rollbackAllowed: false). "
        "Use Rollback Control to test that case."
    )


def view_audit_log() -> None:
    st.header("Audit Log")
    st.write("View governance audit entries (read-only from backend).")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Refresh audit log", key="audit_refresh"):
            st.session_state["audit_cleared"] = False
    with col2:
        if st.button("Clear local displayed results only", key="audit_clear"):
            st.session_state["audit_cleared"] = True
            st.session_state["audit_display"] = []

    if st.session_state.get("audit_cleared"):
        st.info("Local display cleared. Click Refresh audit log to reload from backend.")
        return

    entries = load_audit_log()
    if not entries:
        st.warning("No audit log entries found.")
        return

    df = pd.DataFrame(entries)
    if "timestamp" in df.columns:
        df = df.sort_values("timestamp", ascending=False)

    action_types = sorted(df["actionType"].dropna().unique()) if "actionType" in df.columns else []
    version_ids = sorted(df["versionId"].dropna().unique()) if "versionId" in df.columns else []
    environments = sorted(df["environment"].dropna().unique()) if "environment" in df.columns else []

    filter_col1, filter_col2, filter_col3 = st.columns(3)
    with filter_col1:
        selected_action = st.selectbox("Filter by action type", ["All"] + action_types)
    with filter_col2:
        selected_version = st.selectbox("Filter by version ID", ["All"] + list(version_ids))
    with filter_col3:
        selected_env = st.selectbox("Filter by environment", ["All"] + list(environments))

    filtered = df.copy()
    if selected_action != "All":
        filtered = filtered[filtered["actionType"] == selected_action]
    if selected_version != "All":
        filtered = filtered[filtered["versionId"] == selected_version]
    if selected_env != "All":
        filtered = filtered[filtered["environment"] == selected_env]

    display_columns = [
        c
        for c in [
            "timestamp",
            "actionType",
            "versionId",
            "environment",
            "outcome",
            "reason",
            "fromVersionId",
            "toVersionId",
            "specId",
            "specVersion",
        ]
        if c in filtered.columns
    ]
    st.dataframe(filtered[display_columns], use_container_width=True, hide_index=True)


def view_raw_api_explorer() -> None:
    st.header("Raw API Explorer")
    st.write("Manually call backend endpoints and inspect JSON responses.")

    st.subheader("Quick GET endpoints")
    quick_cols = st.columns(3)
    quick_endpoints = [
        ("/health", "GET /health"),
        ("/agents", "GET /agents"),
        ("/versions", "GET /versions"),
        ("/specs", "GET /specs"),
        ("/deployments", "GET /deployments"),
        ("/audit-log", "GET /audit-log"),
    ]
    for index, (path, label) in enumerate(quick_endpoints):
        with quick_cols[index % 3]:
            if st.button(label, key=f"quick_{path}"):
                response = api_get(path)
                if response:
                    show_response(response, label)

    st.subheader("Parameterized requests")
    version_id = st.text_input("versionId", value="ver-002")
    agent_id = st.text_input("agentId", value="agent-002")
    environment = st.selectbox("environment", ["staging", "production"], key="explorer_env")
    spec_id = st.text_input("specId", value="spec-002")
    target_version_id = st.text_input("targetVersionId", value="ver-002")

    get_buttons = [
        (f"/agents/{agent_id}", "GET /agents/:id"),
        (f"/agents/{agent_id}/versions", "GET /agents/:id/versions"),
        (f"/versions/{version_id}", "GET /versions/:id"),
        (f"/specs/{spec_id}", "GET /specs/:id"),
        (f"/versions/{version_id}/spec", "GET /versions/:id/spec"),
        (f"/versions/{version_id}/spec-validation", "GET /versions/:id/spec-validation"),
        (f"/versions/{version_id}/approval", "GET /versions/:id/approval"),
        (f"/versions/{version_id}/promotion/{environment}", "GET /versions/:id/promotion/:env"),
        (f"/rollback/{environment}/{target_version_id}", "GET /rollback/:env/:targetId"),
    ]

    st.markdown("**GET requests**")
    for path, label in get_buttons:
        if st.button(label, key=f"explorer_get_{path}"):
            response = api_get(path)
            if response:
                show_response(response, label)

    st.markdown("**POST requests (mutating)**")
    post_confirm = st.checkbox(
        "I understand POST requests will mutate local in-memory deployment state.",
        key="explorer_post_confirm",
    )

    post_buttons = [
        (f"/versions/{version_id}/promotion/{environment}", "POST /versions/:id/promotion/:env"),
        (f"/rollback/{environment}/{target_version_id}", "POST /rollback/:env/:targetId"),
    ]
    for path, label in post_buttons:
        if st.button(label, key=f"explorer_post_{path}", disabled=not post_confirm):
            response = api_post(path)
            if response:
                show_response(response, label)


# ---------------------------------------------------------------------------
# Main app
# ---------------------------------------------------------------------------


def main() -> None:
    st.set_page_config(
        page_title="AI Agent Governance Dashboard",
        page_icon="🛡️",
        layout="wide",
    )

    st.title("AI Agent Governance Dashboard")
    st.caption(
        "Local control panel for Spec-Driven Development governance — "
        "[ai-agent-governance](https://github.com/driaialchemy/ai-agent-governance)"
    )

    with st.sidebar:
        st.header("Settings")
        base_url = st.text_input("Backend base URL", value=DEFAULT_BASE_URL)
        st.session_state["base_url"] = base_url

        st.divider()
        st.markdown("**Navigation**")
        page = st.radio(
            "View",
            [
                "System Overview",
                "Agent Registry",
                "Spec Validation",
                "Approval Decision",
                "Promotion Control",
                "Rollback Control",
                "Demo Scenarios",
                "Audit Log",
                "Raw API Explorer",
            ],
            label_visibility="collapsed",
        )

        st.divider()
        healthy, _ = check_health()
        if healthy:
            st.success("Backend: connected")
        else:
            st.error("Backend: not reachable")

    pages = {
        "System Overview": view_system_overview,
        "Agent Registry": view_agent_registry,
        "Spec Validation": view_spec_validation,
        "Approval Decision": view_approval_decision,
        "Promotion Control": view_promotion_control,
        "Rollback Control": view_rollback_control,
        "Demo Scenarios": view_demo_scenarios,
        "Audit Log": view_audit_log,
        "Raw API Explorer": view_raw_api_explorer,
    }
    pages[page]()


if __name__ == "__main__":
    main()
