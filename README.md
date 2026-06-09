# AI Agent Governance System

A beginner-friendly local-first prototype for managing AI agent governance with evidence-based decision-making and synthetic data.

## For A Novice Reader

This app is a control room for deciding whether an AI agent version is safe
enough to move forward. It shows benchmark results, policy checks, confidence
scores, promotion readiness, deployment history, and audit events in one local
dashboard.

In plain terms: it helps answer, "Do we have enough evidence to promote this AI
agent to staging or production, and can we explain why?"

## For A Technical Reader

The project is a TypeScript/Node Express backend with in-memory synthetic agent
registry data, benchmark results, policy checks, deployment state, audit logging,
promotion/rollback logic, webhook scaffolding, and a static dashboard served from
`backend/public`. Deterministic validation, evidence building, and confidence
scoring enforce hard gates before promotion actions. It is local-first and
prototype-scoped; persistence, auth hardening, and real Zapier SDK integration
are documented future work.

## 📋 Project Overview

This system provides a governance workflow for AI agents that evolves from basic registry and approval patterns into an **assurance-first approach** with deterministic validation, structured evidence collection, and confidence-based promotion enforcement.

### What Problem Does This Solve?

Traditional AI agent deployment workflows often lack:
- **Deterministic gates** that block deployment when data is missing or contradictory
- **Evidence-based decisions** with clear audit trails
- **Confidence scoring** to distinguish between high-quality and marginal approvals
- **Enforcement mechanisms** that prevent unsafe promotions

This prototype demonstrates how to build governance workflows that provide assurance before allowing agent versions to reach production.

### Why This Matters for AI Agent Workflows

AI agents require stronger governance than traditional software because:
- Their behavior can be unpredictable
- Safety and policy compliance are critical
- Rollback decisions need historical evidence
- Audit trails must support compliance requirements

This system models those governance needs with a simple, understandable codebase suitable for integration into workflow automation tools like Zapier.

---

## ✅ Current Capabilities

The prototype includes:

### Core Registry and Evaluation
- **Agent Registry** - Track agents and their versions with metadata
- **Synthetic Benchmark Evaluation** - Performance test results (in-memory)
- **Synthetic Policy Checks** - Safety and compliance validation (in-memory)

### Governance Workflow
- **Approval Decisions** - Evaluate versions based on benchmarks and policies
- **Promotion to Staging/Production** - Deploy approved versions with confidence gates
- **Rollback** - Revert to previously deployed versions with approval checks
- **Audit Logging** - Complete history of all governance actions with evidence

### Phase 1 Assurance Hardening
- **Deterministic Validation** - Hard gates that block on missing/invalid/stale data
- **Evidence Builder** - Structured collection of benchmark, policy, and deployment evidence
- **Confidence Scoring** - Calculate confidence levels (LOW/MEDIUM/HIGH) from evidence
- **Confidence Enforcement** - Production requires HIGH confidence (≥80), staging requires MEDIUM (≥50)

### API and Integration
- **REST API** - Consistent HTTP endpoints for all operations
- **Promotion Review Workbench** - Local dashboard for approval evidence, confidence scoring, promotion checks, and audit history
- **Webhook Support** - Event-based triggers for approval, promotion, and rollback actions
- **API Helpers** - Validation and response formatting for consistency
- **Automated Tests** - 150 tests covering deterministic gates, evidence, confidence, and end-to-end workflows

---

## 🔬 Prototype Scope and Limitations

**This is a local-first prototype, not a production system.**

### What's Included
✅ Local-first design - runs entirely offline
✅ In-memory synthetic data for testing
✅ Comprehensive automated test coverage
✅ Clean separation between core logic and API layer
✅ Local dashboard for reviewing promotion readiness
✅ Webhook infrastructure for event triggers
✅ Documented future Zapier integration paths

### What's NOT Included (By Design)
❌ Database persistence - all data resets on server restart
❌ Authentication/authorization for main API routes
❌ Rate limiting or production hardening
❌ Multi-tenant support
❌ Zapier SDK integration (documented for future)
❌ Persistent production dashboard with user accounts

**Intended Use:** Foundation for future Zapier integration, reference implementation for governance patterns, learning tool for AI agent workflow design.

---

## 🛡️ Phase 1 Assurance Hardening

Phase 1 added deterministic validation, evidence-based decisions, and confidence enforcement.

### New Modules

**deterministicChecks.ts** - Hard validation gates
- Fails on missing benchmark or policy data
- Validates score ranges (no scores > maxScore)
- Checks data freshness (30-day window)
- Detects contradictory state (e.g., passed=true but score below threshold)
- Blocks approval when validation fails

**evidenceBuilder.ts** - Structured evidence collection
- Benchmark evidence: totals, pass/fail counts, scores, details
- Policy evidence: totals, pass/fail counts, severity analysis, failed check details
- Deployment evidence: previous deployment history and counts
- Timestamped evidence snapshots for audit

**confidence.ts** - Confidence scoring with enforcement
- Calculates confidence scores (0-100) from evidence and validation
- Classifies as LOW (<50), MEDIUM (50-79), or HIGH (≥80)
- Weighted scoring: benchmarks 35%, policies 35%, data quality 30%, deployment bonus up to +10
- Enforces thresholds: production requires HIGH, staging requires MEDIUM

**apiHelpers.ts** - API consistency and validation
- Centralized version and environment validation
- Standard response builders for success/error
- Reduces route duplication and ensures consistent error shapes

### Enhanced Core Logic

**approval.ts** - Hardened approval evaluation
- Runs deterministic validation BEFORE business logic
- Includes evidence and confidence in approval results
- Validation errors block approval with detailed feedback
- All decisions include confidence scores in audit log

**promotion.ts** - Confidence-enforced promotion
- Checks confidence requirement for target environment
- Blocks promotion if confidence doesn't meet threshold
- Clear rejection messages explain confidence requirements

**rollback.ts** - Evidence-based rollback
- Includes evidence and confidence for target version
- Rollback targets must pass current approval checks

**auditLog.ts** - Enhanced audit trail
- Added evidence field (structured object)
- Added confidenceScore (0-100)
- Added confidenceLevel (LOW/MEDIUM/HIGH)
- All governance actions include assurance data

### Verification

Phase 1 implementation was verified with:
- Strict code review confirming deterministic blocking behavior
- Fix for asymmetric contradiction detection in validation
- 150 automated tests, all passing
- Backward compatibility preserved (existing tests still pass)

---

## 🔌 Zapier Readiness

The system is prepared for future Zapier integration through:

### Current Foundation
- **Clean API Response Shapes** - Consistent `{ success, message?, data }` format
- **Helper-Based Route Validation** - Centralized validation reduces duplication
- **Documented Future Actions** - Approval check, promote, rollback, audit log retrieval
- **Webhook Event Support** - Triggers fire for approval_evaluated, promotion_executed, rollback_executed, etc.
- **Modular Business Logic** - Core functions separated from routes for reusability

### Future Integration Path
See `ZAPIER_READINESS.md` for:
- Suggested Zapier actions (5 documented)
- Suggested Zapier triggers (5 documented)
- Webhook subscription patterns
- Next steps for Zapier Platform CLI integration

**Note:** No Zapier SDK integration exists yet. The system provides the foundation, not the integration.

---

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

Test the assurance hardening:
```powershell
# Deterministic validation (17 tests)
npx tsx src/test-deterministic.ts

# Evidence collection (25 tests)
npx tsx src/test-evidence.ts

# Confidence scoring (24 tests)
npx tsx src/test-confidence.ts

# Phase 1 integration (56 tests)
npx tsx src/test-phase1-integration.ts

# Backward compatibility (28 tests)
npx tsx src/test-governance.ts
```

Or run the standard test command:
```powershell
npm test
```

Expected output: All 28 governance tests pass ✅

### Start Server

```powershell
npx tsx src/server.ts
```

Server starts on `http://localhost:3000`

Open the local dashboard:

```powershell
start chrome http://localhost:3000
```

The dashboard uses the existing REST API. Read-only review actions do not need an admin key. Promotion buttons require the local `ADMIN_API_KEY` from `backend\.env`.

### Test the API

```powershell
# Check server health
curl http://localhost:3000/health

# Check approval status with confidence
curl http://localhost:3000/versions/ver-002/approval

# Evaluate promotion (read-only)
curl http://localhost:3000/versions/ver-002/promotion/staging

# Execute promotion (mutates state)
curl -X POST http://localhost:3000/versions/ver-002/promotion/staging

# View audit log with evidence
curl http://localhost:3000/audit-log
```

---

## 📁 Project Structure

```
backend/src/
├── data/                      # Synthetic in-memory data
│   ├── registry.ts            # Agents and versions
│   ├── benchmarks.ts          # Performance test results
│   ├── policyChecks.ts        # Compliance check results
│   └── deploymentState.ts     # Current deployment tracking
│
├── lib/                       # Lookup functions
│   ├── registryLookup.ts      # Query agents/versions
│   ├── benchmarkLookup.ts     # Query benchmark data
│   └── policyCheckLookup.ts   # Query policy data
│
├── webhooks/                  # Webhook infrastructure
│   ├── webhookRegistry.ts     # Subscription management
│   ├── webhookDispatcher.ts   # Event dispatch
│   └── inboundHandler.ts      # Inbound webhook actions
│
├── Core business logic:
│   ├── approval.ts            # Approval evaluation with evidence
│   ├── promotion.ts           # Confidence-enforced promotion
│   ├── rollback.ts            # Evidence-based rollback
│   ├── auditLog.ts            # Enhanced audit trail
│
├── Phase 1 assurance modules:
│   ├── deterministicChecks.ts # Hard validation gates
│   ├── evidenceBuilder.ts     # Structured evidence collection
│   ├── confidence.ts          # Confidence scoring & enforcement
│
├── API layer:
│   ├── server.ts              # Express API endpoints
│   ├── apiHelpers.ts          # Validation & response helpers
│
├── Testing:
│   ├── test-governance.ts     # Backward compatibility (28 tests)
│   ├── test-deterministic.ts  # Validation gates (17 tests)
│   ├── test-evidence.ts       # Evidence collection (25 tests)
│   ├── test-confidence.ts     # Confidence scoring (24 tests)
│   ├── test-phase1-integration.ts # End-to-end (56 tests)
│   └── test-*.ts              # Additional test scripts
│
└── scripts/                   # Utility scripts

Root:
├── CLAUDE.md                  # Project governance & working rules
├── ZAPIER_READINESS.md        # Future Zapier integration guide
├── README.md                  # This file
```

Dashboard assets live in `backend/public/` and are served by the Express backend.

---

## 🔑 Key API Workflows

### Approval Check
**GET** `/versions/:versionId/approval`

Returns approval decision with:
- `decision`: approved | rejected | blocked_pending_remediation
- `confidence`: score (0-100) and level (LOW/MEDIUM/HIGH)
- `evidence`: structured benchmark, policy, and deployment data
- `validationErrors`: array of deterministic validation failures

### Promotion
**GET** `/versions/:versionId/promotion/:environment` - Evaluate eligibility (read-only)
**POST** `/versions/:versionId/promotion/:environment` - Execute promotion

Enforces:
- Production requires HIGH confidence (≥80)
- Staging requires MEDIUM confidence (≥50)
- Approval must be "approved"
- Deterministic validation must pass

### Rollback
**GET** `/rollback/:environment/:targetVersionId` - Evaluate eligibility (read-only)
**POST** `/rollback/:environment/:targetVersionId` - Execute rollback

Enforces:
- Target version must have been previously deployed
- Target version must pass current approval checks
- Same agent only (no cross-agent rollbacks)

### Audit Log Access
**GET** `/audit-log` - All audit entries
**GET** `/audit-log/version/:versionId` - Entries for specific version

Each entry includes evidence, confidence score, and confidence level.

### Webhook Subscription
**POST** `/webhooks/subscribe` - Subscribe to governance events

Events:
- `approval_evaluated`
- `promotion_executed`
- `rollback_executed`
- `promotion_evaluated`
- `rollback_evaluated`

---

## 🧪 Testing and Verification

### Test Coverage

The implementation has **prototype-level verification** with 150 automated tests:

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| test-deterministic.ts | 17 | Validation gates, missing data, invalid ranges, stale data |
| test-evidence.ts | 25 | Benchmark/policy/deployment evidence collection |
| test-confidence.ts | 24 | Confidence scoring, thresholds, enforcement |
| test-phase1-integration.ts | 56 | End-to-end approval, promotion, rollback with confidence |
| test-governance.ts | 28 | Backward compatibility, core workflow |
| **Total** | **150** | **All passing ✅** |

### Test Categories

✅ **Deterministic Gates** - Validates all hard validation rules
✅ **Evidence Collection** - Verifies structured evidence building
✅ **Confidence Scoring** - Tests all confidence levels and factors
✅ **Confidence Enforcement** - Confirms promotion blocking based on confidence
✅ **Audit Log Enhancement** - Verifies evidence/confidence in audit entries
✅ **Backward Compatibility** - Ensures Phase 1 preserves existing behavior
✅ **End-to-End Integration** - Full workflow validation

---

## 📊 Current Synthetic Data

### Agents
- **agent-001**: Policy Review Agent (status: draft)
- **agent-002**: Benchmark Summary Agent (status: approved)

### Versions
- **ver-001**: agent-001 v1.0.0 (rejected - failed policy check, LOW confidence)
- **ver-002**: agent-002 v1.0.0 (approved - all checks pass, HIGH confidence ~90)
- **ver-003**: agent-002 v1.1.0 (approved - all checks pass, HIGH confidence ~92)
- **ver-004**: agent-002 v1.2.0 (approved - all checks pass, HIGH confidence ~94)

### Initial Deployments
- **Staging**: ver-001 (agent-001)
- **Production**: ver-003 (agent-002)

*Note: Deployment state resets when server restarts*

---

## 🔐 Governance Rules

### Deterministic Validation (Hard Gates)

A version **fails validation** if:
- ❌ Missing benchmark data
- ❌ Missing policy check data
- ❌ Benchmark scores exceed maxScore or are negative
- ❌ Invalid policy severity levels
- ❌ Contradictory state (e.g., passed=true but score below 80% threshold)
- ❌ Data older than 30 days (stale)

Validation failures **block approval** immediately.

### Approval Criteria

After passing validation, a version is:

**Approved** if:
- ✅ Passes ALL benchmarks
- ✅ Passes ALL policy checks
- ✅ Has valid, fresh data

**Rejected** if:
- ❌ Fails any policy check

**Blocked pending remediation** if:
- ⚠️ Fails benchmarks (but policies pass)

All decisions include confidence scores.

### Confidence Scoring

**Calculation:**
- Benchmark score (35% weight)
- Policy score (35% weight)
- Data quality score (30% weight)
- Deployment history bonus (up to +10 points)

**Classification:**
- LOW: < 50
- MEDIUM: 50-79
- HIGH: ≥ 80

### Promotion Enforcement

**Production promotion requires:**
- ✅ Approval status = "approved"
- ✅ HIGH confidence (≥80)
- ✅ Valid environment

**Staging promotion requires:**
- ✅ Approval status = "approved"
- ✅ MEDIUM confidence (≥50) or higher
- ✅ Valid environment

LOW confidence blocks all promotions.

### Rollback Rules

A version can be rolled back if:
- ✅ Target version was previously deployed to that environment
- ✅ Target version belongs to the same agent
- ✅ Target version passes current approval checks (including confidence)
- ✅ Target version is different from currently deployed

---

## 📝 API Reference

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Success with message:**
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
  "message": "Error description",
  "data": { ... }  // optional
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad request or denied action (e.g., LOW confidence blocks promotion)
- `404` - Resource not found
- `401` - Unauthorized (inbound webhook secret validation)

### Governance Endpoints

| Method | Endpoint | Description | State Change |
|--------|----------|-------------|--------------|
| GET | `/versions/:id/approval` | Check approval with confidence | No |
| GET | `/versions/:id/promotion/:env` | Evaluate promotion with confidence check | No |
| POST | `/versions/:id/promotion/:env` | Execute promotion (enforces confidence) | Yes |
| GET | `/rollback/:env/:targetId` | Evaluate rollback | No |
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
| GET | `/audit-log` | All audit entries with evidence |
| GET | `/audit-log/version/:id` | Audit entries for version |

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhooks` | List webhook subscriptions |
| POST | `/webhooks/subscribe` | Subscribe to events |
| DELETE | `/webhooks/:id` | Unsubscribe |
| POST | `/webhooks/test/:id` | Test webhook delivery |

---

## 🔜 Future Roadmap

Potential enhancements (not yet implemented):

1. **Zapier Integration**
   - Add Zapier Platform CLI integration
   - Implement actions: check approval, promote, rollback, get audit log
   - Implement triggers: approval_evaluated, promotion_executed, rollback_executed
   - See `ZAPIER_READINESS.md` for details

2. **Database Persistence**
   - Replace in-memory data stores with PostgreSQL or MongoDB
   - Preserve audit log across restarts
   - Add database migrations

3. **Authentication & Authorization**
   - Add API key authentication for main routes
   - Implement role-based access control
   - Secure inbound webhooks beyond shared secret

4. **Configuration Management**
   - Make confidence thresholds configurable
   - Make validation rules configurable (freshness window, pass threshold)
   - Environment-based configuration

5. **Dashboard Enhancements**
   - Add rollback controls
   - Add webhook subscription management
   - Add confidence trend charts
   - Add audit export controls

6. **Enhanced Observability**
   - Structured logging
   - Metrics and alerting
   - Performance monitoring

---

## 📖 Additional Documentation

- **CLAUDE.md** - Project governance, working rules, and conventions
- **ZAPIER_READINESS.md** - Future Zapier integration guide with suggested actions/triggers
- **backend/package.json** - Dependencies and scripts

---

## 🤝 Contributing

This is a prototype following specific conventions documented in `CLAUDE.md`. When making changes:

1. Read `CLAUDE.md` first to understand project principles
2. Inspect existing code to understand patterns
3. Make minimal, targeted changes
4. Run tests to verify (`npm test`)
5. Keep everything local-first and beginner-friendly
6. Avoid over-engineering or production-scale complexity

---

## 📄 License

ISC

---

## 🎯 Project Status

**Prototype Complete for Current Scope**

✅ Core governance workflow implemented
✅ Phase 1 assurance hardening complete (deterministic validation, evidence, confidence)
✅ Comprehensive test coverage (150 tests passing)
✅ API consistency and documentation
✅ Webhook infrastructure for future triggers
✅ Clean separation for future Zapier integration
✅ Beginner-friendly codebase

**This is a working prototype, not a production system.**

The foundation is ready for future enhancements like Zapier integration, database persistence, and authentication when those features are requested.

---

*Last Updated: 2026-04-18*
*150/150 tests passing ✅ | Phase 1 assurance hardening complete*
