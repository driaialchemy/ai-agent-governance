# ZAPIER_BUILD_PROMPT_CHAIN_UPDATED_V2.md

This file gives you a short, usable prompt chain for this Zapier-oriented build.

Use:
- `CLAUDE.md` with Claude Code
- `AGENTS.md` with Codex
- the prompts below as your execution chain

---

## What this build is

This is a **Zapier-oriented AI Agent Assurance build**.

Current repo state:
- agent registry
- synthetic benchmark and policy checks
- approval logic
- promotion to staging/production
- rollback
- audit logging
- REST API
- tests

Target direction:
- harden governance into assurance
- make decisions evidence-based
- add deterministic validation
- add confidence-aware promotion logic
- prepare the system to be usable in Zapier workflows later

Current status:
- Phase 1 implementation is complete for **prototype scope**
- strict review was completed
- at least one real logic defect was found and fixed
- the build should be treated as **prototype-ready**, not “production-ready”

---

## How to use this file

### For Claude Code
1. Put `CLAUDE.md` in the repo root
2. Open Claude Code in the repo
3. Paste **Prompt 1** first
4. After the plan comes back, paste **Prompt 2**
5. When that finishes, paste **Prompt 3**
6. After review is complete, paste **Prompt 4**

### For Codex
1. Put `AGENTS.md` in the repo root
2. Open Codex in the repo
3. Paste **Prompt 1** first
4. After the plan comes back, paste **Prompt 2**
5. When that finishes, paste **Prompt 3**
6. After review is complete, paste **Prompt 4**

---

# Prompt 1 — Inspect and Plan

```text
Read the repo instructions first and follow them strictly.

This is a Zapier-oriented build, but do not add Zapier integration yet unless required.

First, inspect the relevant files and summarize the current workflow for:
- approval
- promotion
- rollback
- audit logging
- tests

Then produce a short implementation plan for Phase 1 only.

Phase 1 scope:
- deterministic validation
- evidence builder
- confidence scoring
- approval hardening
- audit log enhancement
- promotion hardening

Constraints:
- keep changes minimal
- keep everything local-first
- keep naming beginner-friendly
- preserve current API conventions unless necessary
- do not jump ahead to multi-agent orchestration
- do not add database, auth, or frontend

Output:
1. current flow summary
2. files to create
3. files to modify
4. assumptions
5. risks
6. test plan

Do not code yet.
```

---

# Prompt 2 — Implement Phase 1

```text
Proceed with implementation.

Implement Phase 1 assurance hardening with minimal repo disruption.

Create:
- src/deterministicChecks.ts
- src/evidenceBuilder.ts
- src/confidence.ts

Modify as needed:
- src/approval.ts
- src/auditLog.ts
- src/promotion.ts
- relevant tests

Required behavior:
- deterministic validation must run before judgment logic
- missing benchmark data must fail deterministically
- missing policy data must fail deterministically
- invalid score ranges must fail deterministically
- contradictory state must fail deterministically
- every approval-related decision must include explicit evidence
- confidence must be computed explicitly
- production promotion requires high confidence
- staging promotion may allow medium confidence
- any deterministic failure blocks promotion

Zapier-oriented guidance:
- keep core logic modular
- preserve clear inputs and outputs
- avoid building fake Zapier integration
- make future automation exposure easier by keeping business logic separable

After implementation:
- run relevant tests
- summarize files changed
- summarize what was implemented
- summarize what was intentionally left out
- report verification results
- report remaining risks
```

---

# Prompt 3 — Review and Tighten

```text
Perform a strict review of the Phase 1 changes you just made.

Do not assume the implementation summary is correct. Verify by inspecting the actual code, types, routes, and tests.

Primary goal:
Confirm that Phase 1 was implemented correctly, minimally, and in a way that preserves later Zapier usability.

Review for all of the following:

1. Scope and architectural discipline
- scope drift beyond Phase 1
- unnecessary abstractions or folder complexity
- anything that makes the repo less beginner-friendly
- anything that makes later Zapier actions/triggers harder to expose

2. Core assurance correctness
- deterministic validation really runs before judgment logic
- missing benchmark data fails deterministically
- missing policy data fails deterministically
- invalid score ranges fail deterministically
- contradictory state fails deterministically
- deterministic failures actually block promotion

3. Confidence and promotion enforcement
- confidence is truly enforced, not just informational
- production promotion requires HIGH confidence
- staging promotion allows MEDIUM or HIGH confidence only
- LOW confidence blocks promotion
- approval, promotion, and rollback use confidence consistently
- no unsafe promotion path bypasses confidence or validation

4. Evidence and auditability
- every approval-related decision includes explicit evidence
- audit log entries contain the required evidence/confidence fields
- evidence structure is consistent and JSON-serializable
- no mismatch between evidence, confidence, and final decision
- no audit gaps for executed actions

5. API and type integrity
- additive changes only unless absolutely necessary
- no broken API response shapes
- no inconsistent type definitions across files
- no route/business-logic coupling that should be separated
- file naming and structure remain aligned with the prompt chain unless there is a strong reason not to

6. Testing and verification
- confirm the claimed tests actually exist
- confirm tests cover deterministic gates, evidence, confidence, promotion enforcement, audit logging, backward compatibility, and end-to-end flow
- identify missing edge cases or brittle tests
- run or inspect relevant verification steps where possible

If you find clear issues, fix them.

Then provide exactly this output:

1. Final files changed
2. What you verified successfully
3. Issues found and fixes made
4. Remaining limitations or risks
5. Recommended next step

Important constraints:
- keep changes minimal
- do not add database, auth, frontend, or multi-agent orchestration
- do not add fake Zapier integration
- preserve local-first design
- preserve beginner-friendly structure
- prefer simple, explicit logic over clever abstraction
```

---

# Prompt 4 — Prepare for Zapier Readiness

Use this only after Phase 1 is complete and Prompt 3 review is finished.

```text
Now prepare the codebase for future Zapier use without building the integration itself.

Read the repo instructions first and follow them strictly.

Context:
- This is still a local-first prototype
- Phase 1 assurance hardening is complete for prototype scope
- Do not claim the system is production-ready
- The goal now is to make later Zapier exposure easier, not to add new assurance phases

Goal:
Make the core assurance workflow easier to expose later through Zapier actions or triggers while preserving simplicity.

Focus on these areas only:

1. Business logic separation
- identify route-only logic that should be separated from reusable core logic
- move or refactor only where necessary
- keep changes minimal
- do not redesign the whole repo

2. Input and output clarity
- review the shapes used by approval, promotion, rollback, and audit-log responses
- make them clearer and more consistent where helpful
- preserve backward compatibility
- prefer additive changes over breaking changes

3. Zapier-oriented workflow exposure
- identify the best future Zapier actions this repo could support
- identify the best future Zapier triggers this repo could support
- keep recommendations grounded in the current codebase
- do not add Zapier SDK code
- do not add fake trigger polling code unless explicitly necessary for a very small interface extraction

4. Beginner-friendly maintainability
- keep naming explicit
- avoid clever abstractions
- avoid premature generalization
- keep the repo understandable to a novice user

5. Risk review
- identify anything in the current code that would make future Zapier integration awkward
- identify any response-shape inconsistencies, hidden coupling, or unnecessary complexity
- fix clear issues if they are small and local

Constraints:
- do not add database, auth, frontend, queues, or multi-agent orchestration
- do not change the project into a production architecture
- do not remove working Phase 1 assurance behavior
- do not over-engineer “Zapier readiness”

If you find clear, small, local improvements that support future Zapier actions/triggers, make them.

Then provide exactly this output:

1. Files reviewed
2. Files changed
3. What was improved for future Zapier use
4. Suggested future Zapier actions
5. Suggested future Zapier triggers
6. Remaining risks or follow-up items
7. Recommended next step
```

---

## Recommended order

1. Inspect and Plan
2. Implement Phase 1
3. Review and Tighten
4. Prepare for Zapier Readiness

---

## Important note

For this build, the right near-term goal is:
1. assurance hardening first
2. review and correction second
3. Zapier readiness preparation third

The most important improvements first are:
- deterministic checks
- evidence
- confidence
- safer promotion logic
- better auditability

After that, the most important Zapier-preparation work is:
- clearer business-logic boundaries
- cleaner input/output shapes
- easier future action/trigger exposure

That is what will make the project actually usable later in Zapier.
