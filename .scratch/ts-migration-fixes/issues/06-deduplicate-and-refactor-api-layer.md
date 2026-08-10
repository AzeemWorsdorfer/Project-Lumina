# 06 — Deduplicate and Refactor API Layer

**What to build:** Reduce duplication and improve maintainability of the API layer by merging duplicate transformation functions, extracting shared auth header logic, and bundling repeated parameter groups.

**Blocked by:** 04 — Clean Up Unsafe Type Casts in API Layer (changes overlap in `src/services/api.ts`).

**Status:** done

- [x] Merge `nodeToBackend`/`edgeToBackend` in `src/services/api.ts` with the equivalent functions in `src/utils/mapTransform.ts` — import from one source instead of duplicating.
- [x] Extract the repetitive auth-header-building logic (appears in `authFetch`, `getSocraticHintStream`, Dashboard's `fetchSessions`, `handleCreateSession`, and `handleDelete`) into a shared helper.
- [x] Bundle the repeated parameter group `(sessionId, nodes, edges, token)` into a request context type used across all API functions.
- [x] Verify: `npm run typecheck` passes, all API endpoints work as before.

## Comments

### Verification on 2026-08-10
- `npm run typecheck`: PASS (zero errors, `tsc --noEmit` exited cleanly).
- All four checkboxes hold in code:
  - `reactFlowToBackend` is imported (`api.ts:11`); no `nodeToBackend`/`edgeToBackend` exist anywhere in `frontend/src`.
  - `buildAuthHeaders` is exported and consumed by `authFetch` (`api.ts:67`), `getSocraticHintStream` (`api.ts:170`), and `Dashboard.tsx` (`fetchSessions` line 52, `handleCreateSession` line 93, `handleDelete` line 145).
  - `MindMapRequestContext` (`api.ts:44`) is destructured by all four mind-map API functions: `saveMindMap` (line 113), `getSocraticHint` (line 140), `getSocraticHintStream` (line 167), `generateQuiz` (line 227).

### Tracker inconsistency
- 06's stated blocker (issue 04) is still `ready-for-agent`. The `as string` cast 04 targets lives at `frontend/src/utils/mapTransform.ts:103` (not in `api.ts` as 04's body suggests) and is still present.
- 06's `done` status therefore doesn't reflect its blocker chain. Recommend either resolving 04 first and re-marking 06, or dropping the `Blocked by: 04` line if the cast genuinely doesn't block this work (it touches a different file than 06's edits).

### Optional follow-ups (out of 06's scope)
- Extract a `parseErrorResponse` helper to deduplicate the error-parse block between `authFetch` (`api.ts:71-78`) and `getSocraticHintStream` (`api.ts:187-192`).
- Replace `authFetch`'s manual header-merge loop (`api.ts:56-65`) with a single spread or `Headers` constructor.
- Move `Dashboard.tsx`'s three inline `fetch` calls (`fetchSessions`, `handleCreateSession`, `handleDelete`) into `api.ts` wrappers, mirroring the `MindMapRequestContext` discipline and removing the 401/error-parse repetition.
