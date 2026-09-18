# TRUST taxonomy — ai-agent-governance

Classification vocabulary only. No runtime behavior change.

## T — Traceability

The agent and version registry is the system of record for what exists and which version is in play. Records live in `backend/src/data/registry.ts`; lookups are `backend/src/lib/registryLookup.ts`. Governance actions then append to `backend/src/auditLog.ts` so approval, promotion, and rollback can be traced to a version id.

## R — Runtime-guardrails

Policy checks are the runtime compliance gate before approval. Synthetic results are stored in `backend/src/data/policyChecks.ts` and queried through `backend/src/lib/policyCheckLookup.ts`. `backend/src/approval.ts` refuses or blocks a version when required policy checks are missing or failed.

## U — Uncertainty-monitoring

Rolling-window confidence flags live in `backend/src/lib/uncertaintyMonitor.ts` and are exposed at `GET /uncertainty-flags` from `backend/src/server.ts`. The monitor records `confidence` from inbound agent activity (`POST /agents/:id/activity`) and flags declining trends or low-confidence streaks (defaults N=5, threshold=0.5). Numeric `confidence` on inbound activity is recorded live; callers that omit it stay null and do not affect the window.

## S — Staged-autonomy

Promotion and rollback are the staged-autonomy controls. `backend/src/promotion.ts` evaluates then executes staging vs production moves; `backend/src/rollback.ts` evaluates then executes revert. Environment eligibility and prior-staging rules also come from specs in `backend/src/data/governanceSpecs.ts` via `backend/src/lib/specValidation.ts`.

## T — Testing-via-simulation

Benchmark evaluation is the simulation stand-in: versions are judged on stored benchmark results rather than a live production run. Data is `backend/src/data/benchmarks.ts`; summaries and pass/fail are `backend/src/lib/benchmarkLookup.ts`, consumed by `backend/src/approval.ts`.
