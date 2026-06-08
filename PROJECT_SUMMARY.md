# AI Agent Governance System Summary

## High-Level Summary

This repository is a local-first prototype for governing AI agent deployments.
It helps a team decide whether an AI agent version is ready to move into
staging or production by combining registry data, benchmark results, policy
checks, confidence scoring, promotion rules, rollback checks, audit logs, and
webhook-ready events.

The project now includes two main parts:

- A REST API backend that exposes governance workflows as endpoints.
- A browser dashboard called the Promotion Review Workbench, served at
  `http://localhost:3000/`.

At a professional workflow level, the system answers:

- Which AI agents and versions exist?
- Has this version passed benchmark tests?
- Has this version passed policy and safety checks?
- What evidence supports the approval decision?
- How confident is the system in that decision?
- Is this version allowed to move to staging or production?
- What is currently deployed?
- What approval, promotion, rollback, and webhook events have happened?

The system is designed as a foundation for future Zapier integration. It does
not currently use the Zapier SDK, but it models the kinds of actions and
triggers Zapier could later expose, such as checking approval, promoting a
version, rolling back a version, and reacting to governance events.

## Novice-Level Explanation

Imagine you have several AI helpers, and each helper can have different
versions. Before you let a new version do important work, you want a checklist
that says whether it is safe enough.

This project is that checklist.

It looks at each AI agent version and asks:

- Did it pass its tests?
- Did it follow the rules?
- Did it avoid risky behavior?
- Is the evidence strong enough?
- Is it safe enough for staging?
- Is it safe enough for production?

The dashboard lets you pick an agent version and see the answer visually. It
shows a confidence score, the reason for the decision, the test results, the
policy checks, and whether promotion is allowed or blocked.

In simple terms:

- An agent is the AI worker.
- A version is one release of that AI worker.
- A benchmark is a test of how well it performs.
- A policy check is a safety or compliance rule.
- Confidence is how strongly the system trusts the result.
- Staging is a test deployment area.
- Production is the real deployment area.
- An audit log is a history of what happened and why.

## What The Dashboard Does

The Promotion Review Workbench lets you:

- Select an agent.
- Select one of its versions.
- See the approval decision.
- See the confidence score and score factors.
- Review benchmark evidence.
- Review policy evidence.
- Evaluate whether the version can be promoted to staging.
- Evaluate whether the version can be promoted to production.
- Promote to staging or production when a local admin key is provided.
- See current staging and production deployments.
- See audit events for the selected version.
- Refresh the dashboard and see a visible last-refreshed timestamp.

## What The API Does

The backend API exposes endpoints such as:

- `GET /health`
- `GET /agents`
- `GET /versions`
- `GET /versions/:versionId/approval`
- `GET /versions/:versionId/promotion/:environment`
- `POST /versions/:versionId/promotion/:environment`
- `GET /deployments`
- `GET /audit-log`
- `GET /webhooks`

Read-only endpoints can be used without an admin key. Actions that change
deployment state, such as promotion, require the local `ADMIN_API_KEY` from
`backend/.env`.

## What This Is Not Yet

This is still a prototype. It is not a production system yet.

It does not currently include:

- Real database persistence.
- User accounts.
- Role-based permissions.
- A live Zapier Platform app.
- Production-grade authentication for every API route.
- Multi-tenant customer separation.
- Permanent audit storage across server restarts.

Most data is synthetic and in-memory, so it resets when the server restarts.

## How To Run It

From PowerShell:

```powershell
Set-Location "C:\Users\msell\OneDrive\AIAlchemy\zapierbuild1"
npm start
```

Then open:

```powershell
start chrome http://localhost:3000/
```

The dashboard should show the Promotion Review Workbench.

## Best Way To Think About The Project

This project is a governance control room for AI agent releases.

It is not trying to make the AI agent smarter. It is trying to make the release
process safer, clearer, and easier to audit.

The most important question it answers is:

Can we prove that this AI agent version is safe enough to promote?
