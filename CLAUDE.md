# Claude Code Working Rules

**AI Agent Registry and Promotion Workflow** - A beginner-friendly local-first prototype with synthetic data.

## Core Principles

1. **Keep it local-first** - No cloud services, no external databases unless explicitly requested
2. **Keep data synthetic and in-memory** - All data resets on server restart
3. **Avoid unnecessary refactors** - Only change what's needed for the current feature
4. **Keep names beginner-readable** - Explicit, descriptive naming over clever abbreviations
5. **Verify changes work** - Always run tests after making changes

## Working Discipline

### Before Making Changes

- **Inspect relevant files first** to understand current patterns and style
- Read existing code in the area you're modifying
- Identify what functions and patterns already exist
- Reuse existing patterns before creating new abstractions

### While Making Changes

- Make minimal clean changes focused on the current task
- Preserve current coding style unless there's a clear reason to change it
- Keep Express/backend changes simple - no heavy frameworks
- Don't introduce databases, frontend work, or Zapier integration unless explicitly requested
- Use beginner-readable explicit names

### After Making Changes

- Run relevant tests to verify the feature works
- Report honestly if something doesn't work
- Keep responses concrete and file-specific

## Project Structure

```
backend/src/
├── data/              # Synthetic in-memory data stores
│   ├── registry.ts
│   ├── benchmarks.ts
│   ├── policyChecks.ts
│   └── deploymentState.ts
├── lib/               # Lookup and query functions
│   ├── registryLookup.ts
│   ├── benchmarkLookup.ts
│   └── policyCheckLookup.ts
├── *.ts               # Core business logic
│   ├── approval.ts
│   ├── promotion.ts
│   ├── rollback.ts
│   └── auditLog.ts
├── server.ts          # Express API endpoints
├── test-*.ts          # Test scripts
└── scripts/           # Utility scripts
```

## Current Features

The system supports a full governance workflow:
- Agent and version registry
- Benchmark results and summaries
- Policy checks and compliance
- Approval evaluation
- Promotion evaluation and execution
- Rollback evaluation and execution
- Audit logging for all governance actions
- REST API endpoints
- Agent Risk Governance (path, evidence, policy, approval, test validation)

## Agent Risk Governance Rules

When assessing agent behavior for deployment:

- **Path validation** — Agents must stay within `permittedFolders`; restricted files and folders trigger risk findings
- **Evidence requirements** — Every risk finding must cite `sourceFile`, `lineNumber`, and `auditEntryId` when the active policy requires them
- **Policy classification** — Risk levels (`low`, `medium`, `high`, `critical`) are assigned per `RiskPolicySpec.riskClassification`
- **Human approval** — High and critical risks require human approval before deployment can proceed
- **Test gate** — Deployment is blocked when tests fail and the policy sets `blockIfTestsFail`
- **Spec mapping** — Every finding in a risk report must include `specMapping` linking back to the policy clause
- **Deployment recommendations** — Must cite test status, approval status, and spec mapping; `canDeploy` is false when tests fail, high/critical risks are unresolved, or approval is pending/rejected

## API Design Patterns

### Route Conventions

- **GET routes** - Evaluation only, read-only, no state mutation
  - Example: `GET /versions/:id/promotion/:env` checks eligibility
- **POST routes** - Execution, mutates state
  - Example: `POST /versions/:id/promotion/:env` performs promotion

### Response Format

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Success with message (for actions):
```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "data": { ... }  // optional
}
```

### Status Codes

- `200` - Success
- `400` - Bad request or denied action
- `404` - Resource not found

## Audit Logging

- Log all governance actions explicitly: `approval_evaluated`, `promotion_evaluated`, `promotion_executed`, `rollback_evaluated`
- Include `fromVersionId` and `toVersionId` for state-changing actions
- Add audit entries immediately after the action completes
- Keep audit log in-memory (resets on server restart)

## Response Requirements

When completing tasks, always provide:

1. **Files changed** - List of created or modified files
2. **Commands to test** - Exact PowerShell commands to run
3. **Expected output** - Pattern or example of what success looks like
4. **Assumptions made** - Any decisions or interpretations made

### PowerShell Command Format

Always provide exact commands:
```powershell
cd C:\Users\msell\OneDrive\AIAlchemy\aiagentgovernance\backend
npx tsx src/server.ts
```

Not vague instructions like "start the server".

## Not Yet Implemented

- Authentication/authorization
- Database persistence
- Frontend UI
- Zapier integration (planned for future)

## Testing

- Use `test-*.ts` files for feature-specific tests
- Run tests after implementing features
- Keep test output clear and readable
- Use `npx tsx` to run TypeScript files directly

## Key Constraints

- No database unless explicitly requested
- No frontend work unless explicitly requested
- No Zapier integration unless explicitly requested
- No authentication unless explicitly requested
- Keep everything in-memory and synthetic for now
