# AGENTS.md

## Project
Local-first TypeScript prototype for AI agent governance evolving into AI decision assurance for a Zapier-oriented build.

## Current state
The repo already supports:
- agent registry
- synthetic benchmark and policy evaluation
- approval decisions
- promotion to staging/production
- rollback
- audit logging
- REST API
- automated tests

## Target evolution
Upgrade from governance to assurance by implementing, in order:
1. deterministic validation
2. evidence-based decisions
3. confidence scoring
4. approval and promotion hardening
5. adversarial robustness testing
6. drift detection
7. multi-agent assurance with evaluator, policy, adversarial, and arbiter roles
8. deployment assurance and post-deployment monitoring
9. Zapier-facing integration readiness

## Core rules
- Stay local-first unless Zapier integration is explicitly being added
- Keep beginner-friendly naming and structure
- Make minimal, targeted changes
- Reuse existing patterns before inventing new ones
- Do not replace working modules wholesale unless necessary
- Keep API behavior consistent with current response conventions
- Preserve deterministic behavior where possible
- Prefer explicit code over clever abstractions
- Every meaningful change must include verification steps
- Build so the project can later be used in Zapier workflows without forcing premature complexity

## Required workflow
1. Explore relevant files first
2. Produce a concise implementation plan
3. Identify assumptions and risks
4. Implement only the requested phase
5. Add or update tests
6. Run relevant checks
7. Report:
   - files changed
   - what was implemented
   - what was not implemented
   - risks or follow-up items

## Zapier build guidance
- Keep core logic modular so it can be exposed later through Zapier actions or triggers
- Avoid adding database or auth layers unless explicitly requested
- Preserve clear input/output shapes for future automation use
- Prefer pure functions and separable business logic over tightly coupled route-only logic
- Do not build fake Zapier integration if the task is really core workflow hardening

## Assurance-specific rules
When implementing assurance features:
- Deterministic validation must run before judgment logic
- Every approval-related decision must include explicit evidence
- Confidence must be explicit if it affects approval or promotion
- Any deterministic failure blocks promotion
- Keep these distinct:
  - deterministic failures
  - benchmark failures
  - policy failures
  - confidence limitations
  - adversarial warnings
  - drift warnings
- Do not jump to multi-agent orchestration if Phase 1 hardening is incomplete
- Avoid architectural theater; evidence, confidence, and auditability matter more than adding more agents

## Done criteria
A task is only done when:
- code compiles
- relevant tests pass
- behavior matches requested scope
- no unrelated refactors were introduced
- output includes a concise verification summary

## Review standards
Always check for:
- drift from requested scope
- broken backward compatibility
- inconsistent naming
- incomplete audit logging
- missing edge cases
- unsafe approval/promotion logic
- synthetic-data overfitting risk
- circular validation risk
- unnecessary complexity
