# Webhook System Build Documentation

This document describes the webhook integration system built for the AI Agent Registry. The system enables bidirectional webhook communication — outbound webhooks notify external tools (like Zapier) when governance events occur, and inbound webhooks allow external tools to trigger governance actions.

## Summary

The webhook system provides:
- **Outbound webhooks** - Automatically notify subscribers when governance actions occur (approval evaluations, promotions, rollbacks)
- **Inbound webhooks** - Allow authenticated external requests to trigger governance actions
- **Subscriber management** - API endpoints to register, list, and remove webhook subscribers
- **Security** - HMAC-SHA256 signature verification for outbound webhooks, secret-based authentication for inbound webhooks
- **Retry logic** - Automatic retry with exponential backoff for failed deliveries (3 attempts: 1s, 2s, 4s delays)

## Files Created

### Webhook Infrastructure (Prompt 1)
- **src/webhooks/types.ts** - TypeScript interfaces for webhook events, subscribers, payloads, and delivery results
- **src/data/webhookSubscribers.ts** - In-memory data store with synthetic webhook subscribers for testing
- **src/webhooks/webhookRegistry.ts** - Subscriber management functions (add, remove, list, filter by event)
- **src/webhooks/webhookDispatcher.ts** - Outbound webhook delivery with signature generation and retry logic

### Inbound Webhook Handlers (Prompt 3)
- **src/webhooks/inboundHandler.ts** - Request validation and routing for inbound webhook actions

### Tests (Prompt 4)
- **src/test-webhooks.ts** - Comprehensive automated test suite covering all webhook functionality

## Files Modified

### Integration into Governance Workflow (Prompt 2)
- **src/promotion.ts** - Added webhook dispatch after `promotion_executed` audit entry is created
- **src/rollback.ts** - Added webhook dispatch after `rollback_executed` audit entry is created
- **src/approval.ts** - Added webhook dispatch after `approval_evaluated` audit entry is created (POST path only)

### API Endpoints (Prompt 2 & 3)
- **src/server.ts** - Added 7 new webhook-related endpoints:
  - 4 subscriber management endpoints
  - 3 inbound action endpoints

### Testing & Documentation (Prompt 4)
- **package.json** - Updated test script to run both governance and webhook test suites
- **WEBHOOK_BUILD.md** - This document
- **README.md** - Updated with webhook endpoints and integration notes

## API Endpoints

### Outbound Webhook Management Endpoints (Prompt 2)

| Method | Path | Description | State Change | Auth Required |
|--------|------|-------------|--------------|---------------|
| GET | `/webhooks` | List all webhook subscribers | No | No |
| POST | `/webhooks/subscribe` | Register a new webhook subscriber | Yes | No |
| DELETE | `/webhooks/:id` | Remove a webhook subscriber | Yes | No |
| POST | `/webhooks/test/:id` | Send test ping to a subscriber | No | No |

**Request/Response Examples:**

```bash
# List all subscribers
curl http://localhost:3000/webhooks

# Subscribe to events
curl -X POST http://localhost:3000/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hooks.zapier.com/your/webhook/url",
    "events": ["promotion_executed", "rollback_executed", "approval_evaluated"],
    "secret": "your-secret-for-signature-verification"
  }'

# Remove a subscriber
curl -X DELETE http://localhost:3000/webhooks/sub-001

# Test webhook delivery
curl -X POST http://localhost:3000/webhooks/test/sub-001
```

### Inbound Webhook Action Endpoints (Prompt 3)

| Method | Path | Description | State Change | Auth Required |
|--------|------|-------------|--------------|---------------|
| POST | `/webhooks/actions/check-approval` | Evaluate approval status for a version | Yes (audit log) | Yes |
| POST | `/webhooks/actions/promote` | Promote a version to an environment | Yes (deployment + audit) | Yes |
| POST | `/webhooks/actions/rollback` | Rollback to a previous version | Yes (deployment + audit) | Yes |

**Authentication:** All inbound webhook endpoints require the `x-webhook-secret` header to match the configured secret.

**Request/Response Examples:**

```bash
# Check approval status
curl -X POST http://localhost:3000/webhooks/actions/check-approval \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: inbound-default-secret-change-me" \
  -d '{"versionId": "ver-002"}'

# Promote a version
curl -X POST http://localhost:3000/webhooks/actions/promote \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: inbound-default-secret-change-me" \
  -d '{
    "versionId": "ver-002",
    "environment": "staging"
  }'

# Rollback to previous version
curl -X POST http://localhost:3000/webhooks/actions/rollback \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: inbound-default-secret-change-me" \
  -d '{
    "environment": "staging",
    "targetVersionId": "ver-001"
  }'
```

### Total Endpoint Count

- **Original governance endpoints:** 16
- **Webhook management endpoints:** 4
- **Inbound webhook action endpoints:** 3
- **Total endpoints:** 23

## Environment Variables

### WEBHOOK_INBOUND_SECRET

Controls the shared secret required for inbound webhook authentication.

- **Default:** `inbound-default-secret-change-me`
- **Usage:** Set this environment variable to a strong secret in production
- **Example:** `export WEBHOOK_INBOUND_SECRET="your-production-secret"`

**Important:** The default secret is for prototype/testing only. Change it before deploying to production.

## Zapier Connection Guide

### Setting Up Outbound Webhooks (Registry → Zapier)

Zapier receives notifications when governance events occur in your registry.

**Steps:**

1. **Create a Zap in Zapier**
   - Choose "Webhooks by Zapier" as the trigger
   - Select "Catch Hook"
   - Copy the webhook URL provided by Zapier

2. **Register the webhook URL with your registry**
   ```bash
   curl -X POST http://localhost:3000/webhooks/subscribe \
     -H "Content-Type: application/json" \
     -d '{
       "url": "YOUR_ZAPIER_WEBHOOK_URL",
       "events": ["promotion_executed", "rollback_executed", "approval_evaluated"],
       "secret": "your-chosen-secret"
     }'
   ```

3. **Test the connection**
   - Trigger a governance action (e.g., promote a version)
   - Check Zapier to see if it received the webhook payload
   - The payload includes the full audit log entry with all governance metadata

4. **Add actions to your Zap**
   - Send Slack notifications
   - Create tickets in Jira
   - Log to spreadsheets
   - Trigger other workflows

**Webhook Payload Structure:**
```json
{
  "timestamp": "2026-04-15T10:30:00Z",
  "eventType": "promotion_executed",
  "data": {
    "id": "audit-123",
    "timestamp": "2026-04-15T10:30:00Z",
    "actionType": "promotion_executed",
    "versionId": "ver-002",
    "environment": "staging",
    "outcome": "success",
    "reason": "Version ver-002 successfully promoted to staging.",
    "fromVersionId": "ver-001",
    "toVersionId": "ver-002"
  }
}
```

**Signature Verification:** Each webhook includes an `x-webhook-signature` header containing an HMAC-SHA256 signature of the payload. Use your registered secret to verify authenticity.

### Setting Up Inbound Webhooks (Zapier → Registry)

Zapier can trigger governance actions in your registry.

**Steps:**

1. **Create a Zap in Zapier**
   - Choose your trigger (e.g., "New email in Gmail", "New Slack message", "Schedule")
   - Add an action: "Webhooks by Zapier"
   - Select "POST"

2. **Configure the webhook action**
   - **URL:** `http://your-registry-host:3000/webhooks/actions/promote`
   - **Payload Type:** JSON
   - **Headers:**
     ```
     Content-Type: application/json
     x-webhook-secret: inbound-default-secret-change-me
     ```
   - **Data:**
     ```json
     {
       "versionId": "ver-002",
       "environment": "staging"
     }
     ```

3. **Test the Zap**
   - Use Zapier's test feature
   - Verify the promotion succeeds
   - Check your registry's audit log

4. **Common Zap Patterns**
   - **Scheduled promotions:** Use Zapier's Schedule trigger to promote on a cron schedule
   - **Approval-based deployments:** Use form submissions or approvals to trigger promotions
   - **Conditional rollbacks:** Monitor external metrics and trigger rollbacks automatically
   - **Multi-step workflows:** Chain multiple governance actions together

**Available Actions:**
- `/webhooks/actions/check-approval` - Check if a version is approved
- `/webhooks/actions/promote` - Promote a version to staging or production
- `/webhooks/actions/rollback` - Rollback to a previous version

**Response Handling:** All inbound endpoints return JSON with `{success: true/false, data: {...}, message: "..."}`. Use Zapier's "Filter" step to handle success/failure cases.

## Limitations & Production Considerations

### Current Limitations (Prototype-Grade)

1. **In-memory data** - All webhook subscribers reset when server restarts. For production, persist subscribers to a database.

2. **Prototype-grade secret management** - Uses a single shared secret for all inbound webhooks. For production:
   - Use per-subscriber secrets for inbound webhooks
   - Store secrets securely (environment variables, secret management service)
   - Rotate secrets regularly

3. **No webhook delivery persistence** - Delivery results are not stored. For production:
   - Log all delivery attempts to a database
   - Implement a delivery queue with retry logic
   - Provide a UI to view delivery history and retry failed deliveries

4. **No rate limiting** - Inbound webhooks have no rate limiting. For production, add rate limiting to prevent abuse.

5. **No webhook signature verification UI** - Outbound webhooks include signatures, but there's no built-in verification example. For production, provide documentation and helper functions for signature verification.

6. **Fire-and-forget outbound dispatch** - Outbound webhooks are dispatched asynchronously but errors are only logged, not stored. For production, implement proper error tracking and alerting.

## Security Notes

- **Outbound webhooks:** Each delivery includes an `x-webhook-signature` header. Subscribers should verify this signature using their registered secret.
- **Inbound webhooks:** All action endpoints require the `x-webhook-secret` header. 401 Unauthorized is returned for missing/invalid secrets.
- **HTTPS strongly recommended:** For production, use HTTPS to protect secrets in transit.
- **Secret rotation:** Implement a process to rotate webhook secrets regularly.

## Testing

The webhook system includes comprehensive automated tests:

```bash
npm test
```

This runs both test suites:
- **test-governance.ts** - 28 assertions testing core governance workflow
- **test-webhooks.ts** - 38 assertions testing webhook functionality

All tests are deterministic and run without requiring a server or external dependencies.

## Next Steps for Production

1. **Add database persistence** - Store webhook subscribers in a database
2. **Implement delivery queue** - Use a message queue (Redis, RabbitMQ) for reliable delivery
3. **Add delivery history** - Track all webhook deliveries with timestamps, attempts, and results
4. **Build admin UI** - Provide a dashboard to manage subscribers and view delivery history
5. **Harden security** - Per-subscriber inbound secrets, webhook secret rotation, rate limiting
6. **Add monitoring** - Alert on failed deliveries, track delivery latency, monitor webhook health
7. **Implement webhook retries** - More sophisticated retry logic with exponential backoff and dead letter queue
