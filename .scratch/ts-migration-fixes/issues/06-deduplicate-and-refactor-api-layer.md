# 06 — Deduplicate and Refactor API Layer

**What to build:** Reduce duplication and improve maintainability of the API layer by merging duplicate transformation functions, extracting shared auth header logic, and bundling repeated parameter groups.

**Blocked by:** 04 — Clean Up Unsafe Type Casts in API Layer (changes overlap in `src/services/api.ts`).

**Status:** done

- [x] Merge `nodeToBackend`/`edgeToBackend` in `src/services/api.ts` with the equivalent functions in `src/utils/mapTransform.ts` — import from one source instead of duplicating.
- [x] Extract the repetitive auth-header-building logic (appears in `authFetch`, `getSocraticHintStream`, Dashboard's `fetchSessions`, `handleCreateSession`, and `handleDelete`) into a shared helper.
- [x] Bundle the repeated parameter group `(sessionId, nodes, edges, token)` into a request context type used across all API functions.
- [x] Verify: `npm run typecheck` passes, all API endpoints work as before.
