# AI Agent Registry and Promotion Workflow

A beginner-friendly local-first prototype for managing AI agent governance with synthetic data.

## 📋 Project Overview

This system provides a complete governance workflow for AI agents, including:

- **Agent Registry** - Track agents and their versions
- **Benchmark Evaluation** - Assess version performance
- **Policy Compliance** - Validate against safety checks
- **Approval Decisions** - Automated approval based on benchmarks and policies
- **Promotion Management** - Deploy versions to staging and production
- **Rollback Support** - Revert to previous versions when needed
- **Audit Trail** - Complete history of all governance actions
- **Spec-Driven Governance** - Executable governance specs validate approval, promotion, and rollback
- **REST API** - HTTP endpoints for all operations

### Design Principles

✅ **Local-first** - No cloud dependencies, runs entirely offline
✅ **Synthetic data** - In-memory test data, resets on restart
✅ **Beginner-friendly** - Explicit naming, simple patterns
✅ **Minimal architecture** - Express server, no heavy frameworks
✅ **Test-driven** - Automated tests verify critical behavior

## 🆕 Recent Changes (Latest Session)

### High-Priority Fixes Applied

1. **Added Rollback Execution Audit**
   - Rollback now creates `rollback_executed` audit entries
   - Tracks `fromVersionId` and `toVersionId` like promotion
   - Complete governance trail across all operations

2. **Fixed GET Route Audit Mutation**
   - GET routes are now truly read-only (no audit log writes)
   - POST routes continue to log both evaluation and execution
   - Aligns with REST best practices: GET = read-only, POST = state mutation

3. **Added Automated Assertive Tests**
   - Created `test-governance.ts` with 28 real assertions
   - Tests approval, promotion, rollback, and audit logging
   - `npm test` now runs actual tests instead of placeholder
   - All tests passing ✅

4. **Removed Legacy Files**
   - Deleted `data.ts` and `registry-test.ts` (old schema)
   - Eliminated confusion, cleaner codebase

5. **Marked Optional External Scripts**
   - OpenAI integration scripts clearly labeled as optional
   - Core system works completely offline without API keys

6. **Fixed API Consistency**
   - All endpoints use standard `{ success, data }` format
   - Consistent error handling with appropriate HTTP status codes

## ✅ Current Status

### What Works

- ✅ **Full governance workflow**: approval → promotion → rollback
- ✅ **Complete audit trail**: all actions logged with details
- ✅ **REST API**: 20 endpoints covering all operations
- ✅ **Automated tests**: 56 assertions across governance and SDD suites, all passing
- ✅ **GET routes read-only**: evaluations don't mutate state
- ✅ **Deployment state tracking**: history for staging and production
- ✅ **Error handling**: clear 400/404 responses for invalid requests

### Test Results

```
GOVERNANCE WORKFLOW TESTS
=========================
Passed: 28
Failed: 0
✅ ALL TESTS PASSED

SPEC-DRIVEN GOVERNANCE TESTS
============================
Passed: 28
Failed: 0
✅ ALL SDD TESTS PASSED
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PowerShell (Windows) or bash (Linux/Mac)

### Installation

```powershell
cd C:\Users\msell\OneDrive\AIAlchemy\zapierbuild1\backend
npm install
```

### Run Tests

```powershell
npm test
```

Expected output: All 28 tests pass ✅

### Start Server

```powershell
npx tsx src/server.ts
```

Server starts on `http://localhost:3000`

### Test the API

Open a new terminal and try these commands:

```powershell
# Check server health
curl http://localhost:3000/health

# Get all agents
curl http://localhost:3000/agents

# Check approval status for a version
curl http://localhost:3000/versions/ver-002/approval

# Evaluate promotion (read-only, no state change)
curl http://localhost:3000/versions/ver-002/promotion/staging

# Execute promotion (mutates state)
curl -X POST http://localhost:3000/versions/ver-002/promotion/staging

# Check deployment state
curl http://localhost:3000/deployments

# View audit log
curl http://localhost:3000/audit-log
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── lib/                       # Lookup functions
│   │   ├── registryLookup.ts      # Query agents/versions
│   │   ├── benchmarkLookup.ts     # Query benchmark data
│   │   ├── policyCheckLookup.ts   # Query policy data
│   │   ├── specLookup.ts          # Query governance specs
│   │   └── specValidation.ts      # Validate specs for governance actions
│   │
│   ├── specs/                     # Governance spec types
│   │   └── specTypes.ts
│   │
│   ├── data/                      # Synthetic in-memory data
│   │   ├── registry.ts            # Agents and versions
│   │   ├── benchmarks.ts          # Performance test results
│   │   ├── policyChecks.ts        # Compliance check results
│   │   ├── governanceSpecs.ts     # Executable governance specs
│   │   └── deploymentState.ts     # Current deployment tracking
│   │
│   ├── approval.ts                # Approval decision logic
│   ├── promotion.ts               # Promotion evaluation & execution
│   ├── rollback.ts                # Rollback evaluation & execution
│   ├── auditLog.ts                # Audit trail management
│   ├── server.ts                  # Express API endpoints
│   │
│   ├── test-governance.ts         # Automated tests (28 assertions)
│   ├── test-sdd.ts                # SDD governance tests (28 assertions)
│   ├── test-*.ts                  # Additional test scripts
│   │
│   ├── orchestrators/             # Optional external integrations
│   │   └── testAgentSummary.ts    # OpenAI example (requires API key)
│   │
│   └── scripts/                   # Utility scripts
│       ├── testBenchmarkLookup.ts
│       ├── testPolicyCheckLookup.ts
│       ├── testRegistryLookup.ts
│       └── viewRegistry.ts
│
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
└── FIXES_APPLIED.md              # Detailed change log

CLAUDE.md                          # Project governance & rules
README.md                          # This file
```

## 🔌 API Reference

### Governance Workflow Endpoints

| Method | Endpoint | Description | State Change |
|--------|----------|-------------|--------------|
| GET | `/versions/:id/approval` | Check approval status | No |
| GET | `/versions/:id/promotion/:env` | Evaluate promotion eligibility | No |
| POST | `/versions/:id/promotion/:env` | Execute promotion | Yes |
| GET | `/rollback/:env/:targetId` | Evaluate rollback eligibility | No |
| POST | `/rollback/:env/:targetId` | Execute rollback | Yes |

### Registry Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents` | List all agents |
| GET | `/agents/:id` | Get specific agent |
| GET | `/agents/:id/versions` | Get versions for agent |
| GET | `/versions` | List all versions |
| GET | `/versions/:id` | Get specific version |

### Data Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/versions/:id/benchmarks` | Get benchmark results |
| GET | `/versions/:id/benchmarks/summary` | Get benchmark summary |
| GET | `/versions/:id/policy-checks` | Get policy check results |
| GET | `/versions/:id/policy-checks/summary` | Get policy check summary |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/deployments` | Current deployment state |
| GET | `/audit-log` | All audit entries |
| GET | `/audit-log/version/:id` | Audit entries for version |

### Spec Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/specs` | List all governance specs |
| GET | `/specs/:id` | Get a specific governance spec |
| GET | `/versions/:id/spec` | Get spec for a version |
| GET | `/versions/:id/spec-validation` | Read-only spec validation result |

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Success with message (for actions):**
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad request or denied action
- `404` - Resource not found

## 🧪 Testing

### Run All Tests

```powershell
npm test
```

### Test Coverage

The automated test suite (`test-governance.ts`) verifies:

✅ Approval decision logic (approved vs rejected vs blocked)
✅ Promotion evaluation (eligibility checks)
✅ Promotion execution (deployment state updates)
✅ Rollback evaluation (history validation)
✅ Rollback execution (state reversion)
✅ Audit logging (complete trail for all actions)
✅ GET routes are read-only (no audit mutations)
✅ Denied actions (proper rejection with reasons)

### Manual Testing

Start the server and use the test scripts:

```powershell
# Test API endpoints
npx tsx src/test-api.ts

# Test promotion execution
npx tsx src/test-promotion-execution.ts

# Test promotion API
npx tsx src/test-promotion-api.ts

# Test rollback
npx tsx src/test-rollback.ts
```

## 📊 Current Synthetic Data

### Agents

- **agent-001**: Policy Review Agent (status: draft)
- **agent-002**: Benchmark Summary Agent (status: approved)

### Versions

- **ver-001**: agent-001 v1.0.0 (rejected - failed policy check)
- **ver-002**: agent-002 v1.0.0 (approved - all checks pass)
- **ver-003**: agent-002 v1.1.0 (approved - all checks pass)
- **ver-004**: agent-002 v1.2.0 (approved - all checks pass)

### Current Deployments

- **Staging**: ver-001 (agent-001)
- **Production**: ver-003 (agent-002)

*Note: Deployment state resets when server restarts*

## Spec-Driven Governance Layer

This prototype now includes a **Spec-Driven Development (SDD) governance layer**. In this system, a governance spec is not just documentation — it is an **executable governance artifact** that approval, promotion, and rollback decisions are checked against.

### What a spec defines

Each governance spec describes what an agent version is allowed to do, including:

- Allowed environments (`staging`, `production`)
- Required benchmark and policy check IDs
- Minimum benchmark pass rate
- Required and prohibited capabilities
- Data access level
- Promotion rules (approval requirements, prior staging for production)
- Rollback rules (whether rollback is allowed, approval requirements)
- Audit requirements (which governance events should be logged)

### How specs fit into the workflow

**Before:** Agent version → benchmark checks → policy checks → approval → promotion or rollback → audit log

**Now:** Agent version → governance spec → spec validation → benchmark checks → policy checks → approval → promotion or rollback → audit log

If a spec is missing or invalid, approval is blocked with clear reasons. Promotion and rollback also check spec rules such as allowed environments, prior staging requirements, and rollback permissions.

### Spec API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/specs` | List all governance specs |
| GET | `/specs/:id` | Get a specific governance spec |
| GET | `/versions/:id/spec` | Get the spec for a version |
| GET | `/versions/:id/spec-validation` | Read-only spec validation result |

### Important scope note

This remains a **local-first synthetic prototype** with in-memory data. The SDD layer provides **spec-driven validation** and an **auditable governance workflow** — it does not enforce production deployments on real external systems.

---

## 🔐 Governance Rules

### Approval Criteria

A version is **approved** if:
- ✅ Has benchmark results
- ✅ Has policy check results
- ✅ Passes ALL benchmarks
- ✅ Passes ALL policy checks

A version is **rejected** if:
- ❌ Fails any policy check

A version is **blocked_pending_remediation** if:
- ⚠️ Missing benchmark or policy data
- ⚠️ Fails benchmarks (but policies pass)

### Promotion Rules

A version can be promoted if:
- ✅ Approval status is "approved"
- ✅ Target environment is valid (staging or production)

### Rollback Rules

A version can be rolled back if:
- ✅ Target version was previously deployed to that environment
- ✅ Target version belongs to the same agent
- ✅ Target version is approved
- ✅ Target version is different from currently deployed

## 📝 Audit Log Actions

The system logs these action types:

- `approval_evaluated` - Approval check performed
- `promotion_evaluated` - Promotion eligibility checked
- `promotion_executed` - Promotion completed
- `rollback_evaluated` - Rollback eligibility checked
- `rollback_executed` - Rollback completed
- `spec_validated` - Governance spec validation passed
- `spec_validation_failed` - Governance spec validation failed
- `spec_missing` - No governance spec found for version

Each entry includes:
- Unique ID and timestamp
- Action type
- Version ID
- Environment (for promotions/rollbacks)
- Outcome (allowed/denied/success)
- Reason
- From/To version IDs (for state changes)

## 🚫 What's NOT Included (By Design)

Per CLAUDE.md, these are intentionally out of scope:

- ❌ Database persistence (all data is in-memory)
- ❌ Authentication/authorization
- ❌ Frontend UI
- ❌ Zapier integration (planned for future)
- ❌ External API dependencies (core system is fully offline)

## 🔜 Next Steps

Potential future enhancements:

1. **Zapier Integration** - Connect to Zapier for workflow automation
2. **Persistent Storage** - Add database for production use
3. **Authentication** - Add user/role management
4. **Version Comparison** - Compare benchmark/policy results across versions
5. **Deployment Scheduling** - Schedule promotions for future times
6. **Notification System** - Alerts for approval/promotion/rollback events

## 📖 Additional Documentation

- `CLAUDE.md` - Project governance and working rules
- `backend/FIXES_APPLIED.md` - Detailed changelog of recent fixes
- `backend/package.json` - Dependencies and scripts

## 🤝 Contributing

This is a prototype project following specific conventions documented in `CLAUDE.md`. When making changes:

1. Read `CLAUDE.md` first
2. Inspect existing code to understand patterns
3. Make minimal, targeted changes
4. Run tests to verify (`npm test`)
5. Keep everything local-first and beginner-friendly

## 📄 License

ISC

## 🎯 Project Status: READY FOR NEXT PHASE

✅ Core governance workflow complete
✅ Full test coverage with assertions
✅ API consistent and documented
✅ Audit trail complete
✅ Clean codebase aligned with CLAUDE.md

**The system is ready for Zapier integration or other planned enhancements.**

---

*Last Updated: 2026-06-20*
*All tests passing | 56/56 assertions ✅*
