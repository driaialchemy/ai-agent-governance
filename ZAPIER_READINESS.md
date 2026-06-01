# Zapier Integration Readiness

This document explains how the AI Agent Governance system is prepared for future Zapier integration.

## Current Status

✅ **Core workflow is Zapier-ready** - The system has clean, consistent APIs that can be exposed as Zapier actions and triggers without major refactoring.

⚠️ **This is a local-first prototype** - No Zapier SDK integration yet, no production database, no authentication. This document prepares the foundation for when Zapier integration is requested.

## Architecture Overview

The codebase follows a clean separation between:
- **Core business logic** (approval.ts, promotion.ts, rollback.ts)
- **API layer** (server.ts)
- **Webhook infrastructure** (webhooks/)
- **Data layer** (data/, lib/)

This separation makes it straightforward to expose core functions as Zapier actions.

## Zapier Actions (Ready to Implement)

These operations are state-changing and map naturally to Zapier actions:

### 1. Check Approval Status
**Endpoint:** `GET /versions/:versionId/approval`
**Core Function:** `evaluateVersionForApproval(versionId)`
**Input Fields:**
- `versionId` (string, required)

**Output Fields:**
- `decision` (approved | rejected | blocked_pending_remediation)
- `reason` (string)
- `confidence.level` (LOW | MEDIUM | HIGH)
- `confidence.score` (number, 0-100)
- `benchmarkPassed` (boolean)
- `policyPassed` (boolean)
- `failedPolicyChecks` (array of strings)
- `validationErrors` (array of strings)
- `evidence` (structured object)

**Use Case:** Check if a version is ready for promotion before triggering a deployment workflow.

---

### 2. Promote Version
**Endpoint:** `POST /versions/:versionId/promotion/:environment`
**Core Function:** `performPromotion(versionId, environment)`
**Input Fields:**
- `versionId` (string, required)
- `environment` (dropdown: staging | production, required)

**Output Fields:**
- `allowed` (boolean)
- `reason` (string)
- `versionId` (string)
- `targetEnvironment` (string)
- `approvalDecision` (string)
- `confidence.level` (LOW | MEDIUM | HIGH)
- `confidence.score` (number, 0-100)
- `evidence` (structured object)

**Use Case:** Promote an approved agent version to staging or production.

**Enforcement:**
- Staging requires MEDIUM confidence (≥50)
- Production requires HIGH confidence (≥80)
- Approval must be "approved"
- Deterministic validation must pass

---

### 3. Rollback Version
**Endpoint:** `POST /rollback/:environment/:targetVersionId`
**Core Function:** `performRollback(environment, targetVersionId)`
**Input Fields:**
- `environment` (dropdown: staging | production, required)
- `targetVersionId` (string, required)

**Output Fields:**
- `allowed` (boolean)
- `reason` (string)
- `environment` (string)
- `currentVersionId` (string or null)
- `targetVersionId` (string)
- `confidence.level` (LOW | MEDIUM | HIGH)
- `confidence.score` (number, 0-100)
- `evidence` (structured object)

**Use Case:** Roll back to a previously deployed version after detecting issues.

**Enforcement:**
- Target version must have been previously deployed
- Target version must pass current approval checks
- Same agent only (no cross-agent rollbacks)

---

### 4. Get Audit Log
**Endpoint:** `GET /audit-log` or `GET /audit-log/version/:versionId`
**Core Function:** `getAllAuditLogEntries()` or `getAuditLogEntriesByVersionId(versionId)`
**Input Fields:**
- `versionId` (string, optional - filters by version)

**Output Fields:** Array of audit entries with:
- `id` (string)
- `timestamp` (ISO 8601 string)
- `actionType` (approval_evaluated | promotion_executed | rollback_executed | etc.)
- `versionId` (string)
- `environment` (staging | production, optional)
- `outcome` (string)
- `reason` (string)
- `fromVersionId` (string, optional)
- `toVersionId` (string, optional)
- `confidenceScore` (number, 0-100, optional)
- `confidenceLevel` (LOW | MEDIUM | HIGH, optional)
- `evidence` (structured object, optional)

**Use Case:** Retrieve governance history for compliance reporting or debugging.

---

## Zapier Triggers (Ready to Implement)

The webhook system is already in place and can fire events to Zapier. These events map naturally to Zapier triggers:

### 1. Approval Evaluated
**Event Type:** `approval_evaluated`
**When It Fires:** After `evaluateVersionForApproval()` is called (on audit log write)
**Payload:** Full `AuditLogEntry` including evidence and confidence

**Use Case:** Notify a team channel when a version is evaluated for approval, especially if it fails.

---

### 2. Promotion Executed
**Event Type:** `promotion_executed`
**When It Fires:** After `performPromotion()` successfully completes
**Payload:** Full `AuditLogEntry` including:
- `fromVersionId` (previous version)
- `toVersionId` (new version)
- `environment` (staging or production)
- `evidence` and `confidence`

**Use Case:** Trigger downstream workflows when a version is promoted to production (e.g., notify customers, update documentation, start monitoring).

---

### 3. Rollback Executed
**Event Type:** `rollback_executed`
**When It Fires:** After `performRollback()` successfully completes
**Payload:** Full `AuditLogEntry` including:
- `fromVersionId` (version being rolled back from)
- `toVersionId` (version being restored)
- `environment` (staging or production)
- `evidence` and `confidence`

**Use Case:** Alert the team when a rollback occurs, trigger incident response workflows.

---

### 4. Promotion Evaluated
**Event Type:** `promotion_evaluated`
**When It Fires:** After `evaluateVersionForPromotion()` is called (audit logged)
**Payload:** Full `AuditLogEntry` with eligibility decision

**Use Case:** Track promotion attempts and denials for compliance and debugging.

---

### 5. Rollback Evaluated
**Event Type:** `rollback_evaluated`
**When It Fires:** After `evaluateVersionForRollback()` is called (audit logged)
**Payload:** Full `AuditLogEntry` with eligibility decision

**Use Case:** Track rollback attempts for compliance.

---

## Webhook Infrastructure

The webhook system is already implemented and ready for Zapier:

### Subscribing to Events
**Endpoint:** `POST /webhooks/subscribe`
**Body:**
```json
{
  "url": "https://hooks.zapier.com/hooks/catch/...",
  "events": ["promotion_executed", "rollback_executed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload Format
All webhook events receive:
```json
{
  "event": "promotion_executed",
  "data": {
    "id": "audit-123",
    "timestamp": "2026-04-18T10:30:00Z",
    "actionType": "promotion_executed",
    "versionId": "ver-002",
    "environment": "production",
    "outcome": "success",
    "reason": "...",
    "fromVersionId": "ver-001",
    "toVersionId": "ver-002",
    "confidenceScore": 95,
    "confidenceLevel": "HIGH",
    "evidence": { ... }
  }
}
```

### Security
- Webhook secret validation (X-Webhook-Secret header)
- Configurable via `WEBHOOK_INBOUND_SECRET` environment variable

---

## API Consistency

All endpoints follow consistent patterns:

### Success Response
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human-readable error message",
  "data": { ... }  // optional, includes decision details
}
```

### Status Codes
- `200` - Success
- `400` - Bad request or denied action (e.g., promotion not allowed)
- `404` - Resource not found
- `401` - Unauthorized (webhook secret validation)

---

## Helper Functions for Consistency

The `apiHelpers.ts` module provides:
- `validateVersionExists(versionId)` - Check version exists, return standard error
- `validateEnvironment(environment)` - Check valid environment, return standard error
- `successResponse(data, message?)` - Build success response
- `errorResponse(message, data?)` - Build error response

These helpers reduce duplication and ensure API consistency across all routes.

---

## Core Function Exports

All core governance functions are exported and reusable:

**From `approval.ts`:**
- `evaluateVersionForApproval(versionId, logEvaluation = true): ApprovalResult`

**From `promotion.ts`:**
- `evaluateVersionForPromotion(versionId, targetEnvironment, logEvaluation = true): PromotionDecision`
- `performPromotion(versionId, targetEnvironment): PromotionDecision`

**From `rollback.ts`:**
- `evaluateVersionForRollback(environment, targetVersionId, logEvaluation = true): RollbackDecision`
- `performRollback(environment, targetVersionId): RollbackDecision`

**From `auditLog.ts`:**
- `getAllAuditLogEntries(): AuditLogEntry[]`
- `getAuditLogEntriesByVersionId(versionId): AuditLogEntry[]`

These can be called directly by Zapier integration code without going through HTTP routes.

---

## Inbound Webhook Handlers

The `webhooks/inboundHandler.ts` module provides ready-to-use functions that wrap core logic with consistent error handling:

- `handleInboundApprovalCheck(versionId)` - Returns `{ success, data?, message? }`
- `handleInboundPromotion(versionId, environment)` - Returns `{ success, data?, message? }`
- `handleInboundRollback(environment, targetVersionId)` - Returns `{ success, data?, message? }`

These handlers are already used by the inbound webhook endpoints and can be reused by Zapier integration code.

---

## Type Definitions

All result types have JSDoc comments explaining their purpose and fields:
- `ApprovalResult` - Approval evaluation output
- `PromotionDecision` - Promotion evaluation/execution output
- `RollbackDecision` - Rollback evaluation/execution output
- `AuditLogEntry` - Audit log entry with evidence and confidence
- `Evidence` - Structured evidence from benchmarks and policies
- `ConfidenceScore` - Confidence score with level and factor breakdown

These types are well-documented for future Zapier developers.

---

## What's NOT Included (By Design)

This is a local-first prototype. The following are intentionally NOT implemented yet:

- ❌ Zapier SDK integration
- ❌ Zapier CLI app definition
- ❌ Database persistence (all data is in-memory)
- ❌ Authentication/authorization
- ❌ Multi-tenant support
- ❌ Rate limiting
- ❌ Production deployment configuration

These would be added when building the actual Zapier integration.

---

## Next Steps for Zapier Integration

When ready to build the Zapier integration:

1. **Install Zapier Platform**
   ```bash
   npm install -g zapier-platform-cli
   zapier init ai-agent-governance-app
   ```

2. **Define Actions** (in `creates/` folder)
   - `checkApproval.js` - Wraps `/versions/:id/approval`
   - `promoteVersion.js` - Wraps `/versions/:id/promotion/:env` POST
   - `rollbackVersion.js` - Wraps `/rollback/:env/:id` POST

3. **Define Triggers** (in `triggers/` folder)
   - `approvalEvaluated.js` - Webhook for approval_evaluated events
   - `promotionExecuted.js` - Webhook for promotion_executed events
   - `rollbackExecuted.js` - Webhook for rollback_executed events

4. **Add Authentication**
   - Implement API key or OAuth2
   - Add auth to all endpoints
   - Update inbound webhook secret validation

5. **Add Database**
   - Replace in-memory data stores with PostgreSQL/MongoDB
   - Add database migrations
   - Preserve audit log across restarts

6. **Deploy to Production**
   - Set up hosting (Railway, Render, or AWS)
   - Configure environment variables
   - Set up monitoring and logging

7. **Test with Zapier CLI**
   ```bash
   zapier test
   zapier push
   ```

---

## Testing the Current API

The API can be tested locally:

```bash
# Start server
cd backend
npx tsx src/server.ts

# Check approval status
curl http://localhost:3000/versions/ver-002/approval

# Promote a version
curl -X POST http://localhost:3000/versions/ver-002/promotion/staging

# Rollback
curl -X POST http://localhost:3000/rollback/staging/ver-001

# Get audit log
curl http://localhost:3000/audit-log
```

All endpoints return consistent JSON responses ready for Zapier consumption.

---

## Summary

**This codebase is well-prepared for Zapier integration:**

✅ Clean separation between core logic and API layer
✅ Consistent API response shapes
✅ Comprehensive type definitions with JSDoc
✅ Webhook infrastructure for triggers
✅ Reusable helper functions
✅ Inbound webhook handlers for actions
✅ All governance actions are audited

**When you're ready to build the Zapier app**, you can:
1. Wrap the existing endpoints as Zapier actions
2. Use the webhook system as Zapier triggers
3. Add authentication and database persistence
4. Deploy and test with Zapier Platform CLI

The hard work of designing a clean, consistent governance API is already done.
