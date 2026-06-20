import streamlit as st
import requests
import pandas as pd
from datetime import datetime
import json

# Configure Streamlit
st.set_page_config(
    page_title="Agent Risk Governance Dashboard",
    page_icon="🔐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API Configuration
API_URL = "http://localhost:3000"

# Initialize session state
if "refresh_count" not in st.session_state:
    st.session_state.refresh_count = 0

# Title and description
st.markdown("# 🔐 Agent Risk Governance Dashboard")
st.markdown("Monitor AI agent behavior, approve risky actions, and maintain compliance.")

# Sidebar Navigation
page = st.sidebar.radio(
    "Navigate to:",
    ["Overview", "Risk Reports", "Approvals", "Activity Log", "Audit Trail"]
)

# Helper function to fetch data from API
def fetch_data(endpoint):
    try:
        response = requests.get(f"{API_URL}{endpoint}")
        if response.status_code == 200:
            return response.json().get("data", [])
        else:
            st.error(f"Error fetching {endpoint}: {response.status_code}")
            return []
    except Exception as e:
        st.error(f"Connection error: {str(e)}")
        return []

# Helper function to post approval
def post_approval(approval_id, approver, notes, action):
    try:
        response = requests.post(
            f"{API_URL}/approvals/{approval_id}/{action}",
            json={"approver": approver, "notes": notes}
        )
        if response.status_code == 200:
            st.success(f"Approval {action} successfully")
            st.session_state.refresh_count += 1
            return True
        else:
            st.error(f"Error: {response.status_code}")
            return False
    except Exception as e:
        st.error(f"Connection error: {str(e)}")
        return False

# Repo filter (sidebar)
repos = fetch_data("/repos")
repo_names = [r["name"] for r in repos] if repos else []
selected_repo = st.sidebar.selectbox(
    "Filter by Repository:",
    ["All"] + repo_names,
    key="repo_filter"
)

selected_repo_id = None
if selected_repo != "All":
    for repo in repos:
        if repo["name"] == selected_repo:
            selected_repo_id = repo["id"]
            break

# ============================================================================
# PAGE 1: OVERVIEW
# ============================================================================
if page == "Overview":
    st.subheader("📊 Governance System Overview")

    col1, col2, col3, col4 = st.columns(4)

    # Fetch data
    reports = fetch_data("/reports")
    approvals = fetch_data("/approvals/pending")
    activities = fetch_data("/audit-trail?limit=100")

    # Filter by selected repo
    if selected_repo_id:
        filtered_reports = [r for r in reports if r.get("agent_id") == selected_repo_id]
        filtered_approvals = [a for a in approvals if a.get("agent_id") == selected_repo_id]
        filtered_activities = [a for a in activities if a.get("agent_id") == selected_repo_id]
    else:
        filtered_reports = reports
        filtered_approvals = approvals
        filtered_activities = activities

    # Display metrics
    with col1:
        st.metric("Total Risk Reports", len(filtered_reports))

    with col2:
        st.metric("Pending Approvals", len(filtered_approvals))

    with col3:
        critical_risks = sum(
            1 for r in filtered_reports
            if isinstance(r, dict) and r.get("summary", {}).get("risksByLevel", {}).get("critical", 0) > 0
        )
        st.metric("Critical Risks", critical_risks)

    with col4:
        st.metric("Recent Audit Entries", len(filtered_activities))

    st.markdown("---")

    # Recent Risk Reports
    st.markdown("### 📋 Recent Risk Reports")
    if filtered_reports:
        df_reports = pd.DataFrame([
            {
                "Report ID": r.get("id", "N/A")[:20] + "...",
                "Agent": r.get("agent_id", "N/A"),
                "Version": r.get("version_id", "N/A"),
                "Total Risks": r.get("summary", {}).get("totalRisks", 0),
                "Critical": r.get("summary", {}).get("risksByLevel", {}).get("critical", 0),
                "High": r.get("summary", {}).get("risksByLevel", {}).get("high", 0),
                "Can Deploy": "✅ Yes" if r.get("deploymentRecommendation", {}).get("canDeploy") else "❌ No",
                "Generated": r.get("generated_at", "N/A")[:19]
            }
            for r in filtered_reports[:10]
        ])
        st.dataframe(df_reports, use_container_width=True)
    else:
        st.info("No risk reports yet.")

    st.markdown("---")

    # Pending Approvals
    st.markdown("### ⏳ Pending Approvals")
    if filtered_approvals:
        for approval in filtered_approvals[:5]:
            with st.container():
                col1, col2, col3 = st.columns([2, 3, 1])
                with col1:
                    st.write(f"**Agent:** {approval.get('agent_id')}")
                    st.write(f"**Version:** {approval.get('version_id')}")
                with col2:
                    risks = approval.get("risks", [])
                    st.write(f"**Risks to Approve:** {len(risks)}")
                    for risk in risks[:2]:
                        st.caption(f"• {risk.get('description', 'N/A')}")
                with col3:
                    if st.button("Review", key=f"review_{approval.get('id')}"):
                        st.session_state.selected_approval = approval.get("id")
                        st.rerun()
        st.markdown("---")
    else:
        st.info("No pending approvals.")

# ============================================================================
# PAGE 2: RISK REPORTS
# ============================================================================
elif page == "Risk Reports":
    st.subheader("📋 Risk Reports")

    # Fetch reports
    reports = fetch_data("/reports")

    if reports:
        # Filter by repo from sidebar
        if selected_repo_id:
            filtered_reports = [r for r in reports if r.get("agent_id") == selected_repo_id]
        else:
            filtered_reports = reports

        # Additional filter options
        col1, col2, col3 = st.columns(3)

        with col1:
            risk_level_filter = st.selectbox(
                "Show reports with risks of level:",
                ["All", "Critical", "High", "Medium", "Low"]
            )

        # Filter reports by risk level if needed
        if risk_level_filter != "All":
            filtered_reports = [
                r for r in filtered_reports
                if r.get("summary", {}).get("risksByLevel", {}).get(risk_level_filter.lower(), 0) > 0
            ]

        st.markdown(f"**Total Reports: {len(filtered_reports)}**")

        # Display each report
        for report in filtered_reports[:20]:
            with st.expander(f"📄 {report.get('agent_id')} / {report.get('version_id')} - {report.get('generated_at', 'N/A')[:10]}"):
                col1, col2, col3 = st.columns(3)

                with col1:
                    summary = report.get("summary", {})
                    st.metric("Total Risks", summary.get("totalRisks", 0))
                    st.metric("Critical", summary.get("risksByLevel", {}).get("critical", 0))

                with col2:
                    st.metric("High", summary.get("risksByLevel", {}).get("high", 0))
                    st.metric("Medium", summary.get("risksByLevel", {}).get("medium", 0))

                with col3:
                    rec = report.get("deploymentRecommendation", {})
                    deploy_text = "✅ Can Deploy" if rec.get("canDeploy") else "❌ Cannot Deploy"
                    st.write(f"**{deploy_text}**")
                    st.write(f"**Tests:** {summary.get('testsStatus', 'N/A')}")

                st.markdown("**Findings:**")
                findings = report.get("findings", [])
                if findings:
                    for finding in findings:
                        risk_level = finding.get("riskLevel", "unknown").upper()
                        risk_emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}.get(risk_level, "⚪")
                        st.write(f"{risk_emoji} [{finding.get('category')}] {finding.get('description')}")
                        if finding.get("evidence", {}).get("sourceFile"):
                            st.caption(f"📍 {finding['evidence'].get('sourceFile')}:{finding['evidence'].get('lineNumber', '?')}")
                else:
                    st.info("No findings")

                st.markdown("**Deployment Blocks:**")
                blocked_by = report.get("deploymentRecommendation", {}).get("blockedBy", [])
                if blocked_by:
                    for block in blocked_by:
                        st.warning(f"⛔ {block}")
                else:
                    st.success("No blocks - ready to deploy")
    else:
        st.info("No risk reports found.")

# ============================================================================
# PAGE 3: APPROVALS
# ============================================================================
elif page == "Approvals":
    st.subheader("⏳ Approval Requests")

    # Tab selection
    tab1, tab2 = st.tabs(["Pending Approvals", "Approval History"])

    with tab1:
        approvals = fetch_data("/approvals/pending")
        if selected_repo_id:
            approvals = [a for a in approvals if a.get("agent_id") == selected_repo_id]

        if approvals:
            st.write(f"**{len(approvals)} pending approvals**")

            for approval in approvals:
                with st.container():
                    col1, col2 = st.columns([3, 1])

                    with col1:
                        st.markdown(f"### {approval.get('agent_id')} - {approval.get('version_id')}")
                        st.write(f"**Status:** {approval.get('status').upper()}")
                        st.write(f"**Risks to approve:** {len(approval.get('risks', []))}")

                        st.write("**Risk Details:**")
                        for risk in approval.get("risks", []):
                            st.write(f"- [{risk.get('level').upper()}] {risk.get('description')}")

                    with col2:
                        st.write("")
                        if st.button("👍 Approve", key=f"approve_{approval.get('id')}"):
                            approver = st.text_input("Your name:", key=f"approver_{approval.get('id')}")
                            notes = st.text_area("Notes:", key=f"notes_{approval.get('id')}")
                            if st.button("Confirm Approval", key=f"confirm_approve_{approval.get('id')}"):
                                if post_approval(approval.get('id'), approver, notes, "approve"):
                                    st.rerun()

                        if st.button("👎 Reject", key=f"reject_{approval.get('id')}"):
                            approver = st.text_input("Your name:", key=f"rej_approver_{approval.get('id')}")
                            notes = st.text_area("Rejection reason:", key=f"rej_notes_{approval.get('id')}")
                            if st.button("Confirm Rejection", key=f"confirm_reject_{approval.get('id')}"):
                                if post_approval(approval.get('id'), approver, notes, "reject"):
                                    st.rerun()

                    st.markdown("---")
        else:
            st.success("✅ No pending approvals!")

    with tab2:
        all_approvals = fetch_data("/approvals")
        if selected_repo_id:
            all_approvals = [a for a in all_approvals if a.get("agent_id") == selected_repo_id]

        if all_approvals:
            df_approvals = pd.DataFrame([
                {
                    "Agent": a.get("agent_id", "N/A"),
                    "Version": a.get("version_id", "N/A"),
                    "Status": a.get("status", "N/A").upper(),
                    "Risks": len(a.get("risks", [])),
                    "Approver": a.get("approver", "Pending"),
                    "Time": a.get("approval_time", "N/A")[:19] if a.get("approval_time") else "Pending"
                }
                for a in all_approvals
            ])
            st.dataframe(df_approvals, use_container_width=True)
        else:
            st.info("No approval history.")

# ============================================================================
# PAGE 4: ACTIVITY LOG
# ============================================================================
elif page == "Activity Log":
    st.subheader("📝 Agent Activity Log")

    # Agent selection
    agents_data = fetch_data("/audit-trail?limit=500")
    if selected_repo_id:
        agents = [selected_repo_id]
    else:
        agents = sorted(list(set([a.get("agent_id") for a in agents_data if a.get("agent_id")])))

    selected_agent = st.selectbox("Select Agent:", agents if agents else ["No agents found"])

    if selected_agent and selected_agent != "No agents found":
        activity = fetch_data(f"/agents/{selected_agent}/activity-report")

        if isinstance(activity, dict):
            summary = activity.get("summary", {})

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Files Accessed", len(summary.get("filesAccessed", [])))
            with col2:
                st.metric("Folders Accessed", len(summary.get("foldersAccessed", [])))
            with col3:
                st.metric("Tests Run", summary.get("testsRun", 0))
            with col4:
                st.metric("Tests Passed", summary.get("testsPassed", 0))

            st.markdown("---")
            st.markdown("**Activities:**")

            activities_list = activity.get("activities", [])
            if activities_list:
                for act in activities_list:
                    action_emoji = {
                        "file_access": "📄",
                        "folder_read": "📁",
                        "folder_write": "✏️",
                        "test_run": "✔️"
                    }.get(act.get("actionType"), "•")

                    st.write(
                        f"{action_emoji} **{act.get('actionType')}** - {act.get('description')} "
                        f"({act.get('timestamp', 'N/A')[:19]})"
                    )
                    if act.get("path"):
                        st.caption(f"📍 {act.get('path')}")
            else:
                st.info("No activities logged for this agent.")
        else:
            st.info("No activity data found for this agent.")

# ============================================================================
# PAGE 5: AUDIT TRAIL
# ============================================================================
elif page == "Audit Trail":
    st.subheader("🔍 Audit Trail")
    st.write("Complete governance action history")

    # Fetch audit trail
    audit_entries = fetch_data("/audit-trail?limit=500")
    if selected_repo_id:
        audit_entries = [e for e in audit_entries if e.get("agent_id") == selected_repo_id]

    if audit_entries:
        # Create DataFrame
        df_audit = pd.DataFrame([
            {
                "Timestamp": e.get("timestamp", "N/A")[:19],
                "Action": e.get("action_type", "N/A"),
                "Agent": e.get("agent_id", "-"),
                "Version": e.get("version_id", "-"),
                "Entity": e.get("entity_type", "N/A"),
                "Status": "✅" if e.get("action_type") in ["approval_approved", "promotion_executed"] else "⏳"
            }
            for e in audit_entries
        ])

        # Display with filters
        col1, col2 = st.columns(2)
        with col1:
            action_filter = st.selectbox(
                "Filter by action:",
                ["All"] + sorted(list(set(df_audit["Action"].tolist())))
            )

        if action_filter != "All":
            df_audit = df_audit[df_audit["Action"] == action_filter]

        st.dataframe(df_audit, use_container_width=True)

        st.write(f"**Total entries:** {len(df_audit)}")
    else:
        st.info("No audit trail entries found.")

# ============================================================================
# FOOTER
# ============================================================================
st.markdown("---")
st.markdown(
    "🔐 **Agent Risk Governance Dashboard** | "
    "Data persisted to database | "
    "[GitHub](https://github.com/driaialchemy/ai-agent-governance)"
)

if st.button("🔄 Refresh"):
    st.rerun()
