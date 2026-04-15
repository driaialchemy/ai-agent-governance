# AI Agent Registry and Promotion Workflow

A beginner-friendly local-first prototype for managing AI agent versions with governance workflows and webhook integration.

## Overview

This system provides a complete governance workflow for AI agent deployments:
- **Agent and Version Registry** - Track agents and their versions
- **Benchmark Results** - Store and evaluate performance benchmarks
- **Policy Compliance** - Enforce security and quality policies
- **Approval Workflow** - Automated approval based on benchmarks and policies
- **Promotion Management** - Controlled promotion to staging and production
- **Rollback Support** - Safe rollback to previously deployed versions
- **Audit Logging** - Complete audit trail of all governance actions
- **Webhook Integration** - Bidirectional webhooks for external tool integration (Zapier, etc.)

## Current Features

### Core Governance
- Agent and version registry with synthetic test data
- Benchmark results and performance summaries
- Policy check results and compliance tracking
- Automated approval evaluation (approved/rejected/blocked)
- Promotion evaluation and execution (staging/production)
- Rollback evaluation and execution
- Complete audit logging for all governance actions

### Webhook Integration
- **Outbound webhooks** - Notify external tools when governance events occur
- **Inbound webhooks** - Allow external tools to trigger governance actions
- **Subscriber management** - Register, list, and remove webhook subscribers
- **Security** - HMAC-SHA256 signatures for outbound, secret auth for inbound
- **Retry logic** - Automatic retry with exponential backoff for failed deliveries

See [WEBHOOK_BUILD.md](./WEBHOOK_BUILD.md) for detailed webhook documentation and Zapier integration guide.

### REST API
- 23 endpoints covering all governance and webhook functionality
- Standard JSON response format
- GET routes for read-only evaluation
- POST routes for state-changing execution

## Quick Start

### Prerequisites
- Node.js 18+ with npm
- TypeScript 6.0+

### Installation

```powershell
cd C:\Users\msell\OneDrive\AIAlchemy\zapierbuild1\backend
npm install
```

### Running the Server

```powershell
npx tsx src/server.ts
```

Server will start on `http://localhost:3000`

### Running Tests

```powershell
npm test
```

This runs both test suites:
- **Governance tests** - 28 assertions testing core workflow
- **Webhook tests** - 38 assertions testing webhook system
- **Total** - 66 assertions, all deterministic and fast

## API Reference

### Registry Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/agents` | List all registered agents |
| GET | `/agents/:agentId` | Get agent details |
| GET | `/agents/:agentId/versions` | List versions for an agent |
| GET | `/versions` | List all agent versions |
| GET | `/versions/:versionId` | Get version details |

### Benchmark Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/versions/:versionId/benchmarks` | Get benchmark results for a version |
| GET | `/versions/:versionId/benchmarks/summary` | Get benchmark summary (average score, pass/fail) |

### Policy Check Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/versions/:versionId/policy-checks` | Get policy check results for a version |
| GET | `/versions/:versionId/policy-checks/summary` | Get policy check summary (pass/fail, failed checks) |

### Approval Endpoint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/versions/:versionId/approval` | Evaluate approval status (read-only, no audit log) |

### Promotion Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/versions/:versionId/promotion/:environment` | Evaluate promotion eligibility (read-only) |
| POST | `/versions/:versionId/promotion/:environment` | Execute promotion (creates audit log, dispatches webhooks) |

### Rollback Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/deployments` | Get current deployment state for all environments |
| GET | `/rollback/:environment/:targetVersionId` | Evaluate rollback eligibility (read-only) |
| POST | `/rollback/:environment/:targetVersionId` | Execute rollback (creates audit log, dispatches webhooks) |

### Audit Log Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/audit-log` | Get all audit log entries |
| GET | `/audit-log/version/:versionId` | Get audit log entries for a specific version |

### Webhook Management Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/webhooks` | List all webhook subscribers |
| POST | `/webhooks/subscribe` | Register a new webhook subscriber |
| DELETE | `/webhooks/:id` | Remove a webhook subscriber |
| POST | `/webhooks/test/:id` | Send test ping to a subscriber |

### Inbound Webhook Action Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/webhooks/actions/check-approval` | Evaluate approval status | Yes (`x-webhook-secret`) |
| POST | `/webhooks/actions/promote` | Promote a version | Yes (`x-webhook-secret`) |
| POST | `/webhooks/actions/rollback` | Rollback to previous version | Yes (`x-webhook-secret`) |

**Total Endpoints:** 23

## API Response Format

All endpoints follow a consistent response format:

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
  "message": "Version ver-002 successfully promoted to staging.",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "data": { ... }  // optional
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request or denied action
- `401` - Unauthorized (invalid webhook secret)
- `404` - Resource not found

## Example Usage

### Check Approval Status

```bash
curl http://localhost:3000/versions/ver-002/approval
```

### Promote a Version

```bash
curl -X POST http://localhost:3000/versions/ver-002/promotion/staging
```

### Rollback to Previous Version

```bash
curl -X POST http://localhost:3000/rollback/staging/ver-001
```

### View Audit Log

```bash
curl http://localhost:3000/audit-log
```

### Register a Webhook Subscriber

```bash
curl -X POST http://localhost:3000/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hooks.zapier.com/your/url",
    "events": ["promotion_executed", "rollback_executed"],
    "secret": "your-signature-secret"
  }'
```

### Trigger Promotion via Inbound Webhook

```bash
curl -X POST http://localhost:3000/webhooks/actions/promote \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: inbound-default-secret-change-me" \
  -d '{
    "versionId": "ver-002",
    "environment": "staging"
  }'
```

## Project Structure

```
backend/src/
├── data/              # Synthetic in-memory data stores
│   ├── registry.ts
│   ├── benchmarks.ts
│   ├── policyChecks.ts
│   ├── deploymentState.ts
│   └── webhookSubscribers.ts
├── lib/               # Lookup and query functions
│   ├── registryLookup.ts
│   ├── benchmarkLookup.ts
│   └── policyCheckLookup.ts
├── webhooks/          # Webhook infrastructure
│   ├── types.ts
│   ├── webhookRegistry.ts
│   ├── webhookDispatcher.ts
│   └── inboundHandler.ts
├── *.ts               # Core business logic
│   ├── approval.ts
│   ├── promotion.ts
│   ├── rollback.ts
│   └── auditLog.ts
├── server.ts          # Express API endpoints
├── test-*.ts          # Test scripts
└── scripts/           # Utility scripts
```

## Environment Variables

### WEBHOOK_INBOUND_SECRET

Controls the shared secret required for inbound webhook authentication.

- **Default:** `inbound-default-secret-change-me`
- **Usage:** Set this before deploying to production
- **Example:** `export WEBHOOK_INBOUND_SECRET="your-production-secret"`

## Testing

The project includes comprehensive automated tests:

```bash
npm test
```

**Test Coverage:**
- **test-governance.ts** - 28 assertions covering core governance workflow
- **test-webhooks.ts** - 38 assertions covering webhook functionality
- **Total** - 66 assertions

All tests are deterministic, fast, and require no external dependencies or running server.

## Governance Workflow

### Approval Criteria

A version is approved if:
1. ✅ Has benchmark results
2. ✅ Has policy check results
3. ✅ Passes all benchmarks (score ≥ passing threshold)
4. ✅ Passes all policy checks (no failures)

States:
- **approved** - All criteria met, eligible for promotion
- **rejected** - Policy checks failed
- **blocked_pending_remediation** - Missing data or benchmarks failed

### Promotion Rules

A version can be promoted if:
1. ✅ Version exists in registry
2. ✅ Version is approved (meets all approval criteria)
3. ✅ Target environment is "staging" or "production"

### Rollback Rules

A version can be rolled back to if:
1. ✅ Current environment has a deployed version
2. ✅ Target version is different from current
3. ✅ Target version exists in registry
4. ✅ Target version belongs to same agent as current
5. ✅ Target version was previously deployed to this environment
6. ✅ Target version is approved

### Audit Logging

All governance actions are logged:
- `approval_evaluated` - Approval status was evaluated
- `promotion_evaluated` - Promotion eligibility was checked
- `promotion_executed` - Version was promoted to an environment
- `rollback_evaluated` - Rollback eligibility was checked
- `rollback_executed` - Environment was rolled back to previous version

Each audit entry includes:
- Unique ID
- Timestamp
- Action type
- Version ID
- Environment (if applicable)
- Outcome
- Reason
- From/To version IDs (for state changes)

## Data Model

### Synthetic Test Data

The system includes realistic synthetic data for testing:

**Agents:**
- `agent-001` - Code Review Agent
- `agent-002` - Data Analysis Agent
- `agent-003` - Test Generation Agent

**Versions:**
- `ver-001` - Code Review Agent v1.0.0 (rejected - security policy failure)
- `ver-002` - Code Review Agent v1.1.0 (approved)
- `ver-003` - Code Review Agent v1.2.0 (approved)
- Additional versions for other agents

**Benchmark Results:**
- Accuracy, latency, cost metrics for each version
- Passing thresholds enforced

**Policy Checks:**
- Security, bias, compliance checks
- Pass/fail results per version

All data resets on server restart (in-memory only).

## Design Patterns

### Route Conventions

- **GET routes** - Evaluation only, read-only, no state mutation
  - Example: `GET /versions/:id/promotion/:env` checks eligibility without logging
- **POST routes** - Execution, mutates state, creates audit logs
  - Example: `POST /versions/:id/promotion/:env` performs promotion and logs it

### Separation of Concerns

- **Evaluation functions** - Pure logic, no side effects, optional logging
- **Execution functions** - Call evaluation + mutate state + create audit logs
- **Webhook dispatch** - Fire-and-forget, non-blocking, logged errors don't fail actions

### Error Handling

- Governance actions return decision objects (allowed/denied) rather than throwing errors
- Inbound webhooks return consistent `{success, data, message}` format
- Outbound webhooks retry with exponential backoff, log failures but don't block

## Not Yet Implemented

The following features are not included in this prototype:

### Authentication & Authorization
- No user accounts or role-based access control
- Inbound webhooks use a simple shared secret (prototype-grade)
- For production: implement JWT-based auth, per-user permissions

### Database Persistence
- All data is in-memory and resets on server restart
- For production: persist to PostgreSQL, MongoDB, or similar

### Frontend UI
- No web interface for viewing or managing agents
- For production: build a React/Vue admin dashboard

### Webhook Hardening
- No persistent delivery queue or retry history
- No per-subscriber secrets for inbound webhooks
- No delivery dashboard or monitoring UI
- For production: implement delivery queue, track history, provide admin UI

### Advanced Features
- No scheduled deployments or gradual rollouts
- No deployment approval workflows (manual gates)
- No environment-specific configuration
- No integration tests against real external services

## Contributing

This is a prototype for learning and demonstration. Key principles:

1. **Keep it local-first** - No cloud dependencies
2. **Keep data synthetic** - Realistic but fake data
3. **Avoid over-engineering** - Simple, beginner-readable code
4. **Verify changes work** - Always run tests after changes

See [CLAUDE.md](../CLAUDE.md) for detailed working rules.

## License

ISC
