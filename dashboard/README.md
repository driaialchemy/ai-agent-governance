# AI Agent Governance Dashboard

Local Streamlit control panel for the [ai-agent-governance](https://github.com/driaialchemy/ai-agent-governance) repository.

This dashboard connects to the existing Express backend and helps you visually test and demonstrate the **Spec-Driven Development (SDD) governance workflow**. It does not replace the backend.

## What this dashboard does

- Shows system overview (health, agents, versions, specs, deployments, audit log)
- Lets you browse the agent registry and version details
- Runs read-only spec validation and approval checks
- Evaluates and executes promotion and rollback (with confirmation for mutating actions)
- Provides one-click demo scenarios for common success and failure cases
- Displays the audit log with filters
- Includes a raw API explorer for manual endpoint testing

## Prerequisites

- Python 3.9+
- Node.js 18+ (for the backend)

## Start the backend

```powershell
cd backend
npm install
npx tsx src/server.ts
```

The API runs at `http://localhost:3000`.

## Start the dashboard

Open a **second terminal**:

```powershell
cd dashboard
pip install -r requirements.txt
streamlit run app.py
```

Streamlit opens in your browser (usually `http://localhost:8501`).

## Configure the API URL

Use the sidebar **Backend base URL** field. Default: `http://localhost:3000`

## Views

| View | Purpose | Mutates state? |
|------|---------|----------------|
| System Overview | Health, counts, deployments | No (read-only) |
| Agent Registry | Agents, versions, benchmarks, policies, specs | No (read-only) |
| Spec Validation | `GET /versions/:id/spec-validation` | No (read-only) |
| Approval Decision | `GET /versions/:id/approval` | No (read-only) |
| Promotion Control | Evaluate (GET) or Execute (POST) promotion | **POST mutates** deployment state |
| Rollback Control | Evaluate (GET) or Execute (POST) rollback | **POST mutates** deployment state |
| Demo Scenarios | One-click workflow demos | Evaluate = no; Execute scenarios may mutate |
| Audit Log | View audit entries with filters | No (read-only; clear button only clears UI) |
| Raw API Explorer | Manual GET/POST calls | **POST mutates** when used |

## Read-only vs mutating actions

**Read-only (safe for demos):**

- All GET endpoints (health, agents, versions, specs, spec-validation, approval, promotion evaluate, rollback evaluate, deployments, audit-log)

**Mutates local in-memory state (requires confirmation checkbox in UI):**

- `POST /versions/:id/promotion/:env`
- `POST /rollback/:env/:targetId`

Data resets when the backend server restarts.

## Run backend tests

```powershell
cd backend
npm test
```

## Scope note

This is a **local-first synthetic prototype**. The dashboard is for local testing and demonstration — not production enforcement on external systems.
