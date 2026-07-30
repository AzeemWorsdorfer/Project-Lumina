# 04 — Clean Up Unsafe Type Casts in API Layer

**What to build:** Remove unnecessary and mis-typed `as string` casts in `src/services/api.ts` where the expression already handles the optional/`undefined` case with a `||` fallback.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Remove `as string` from `(edge.style?.stroke as string) || DEFAULT_EDGE_COLOR` — the `||` already handles the `undefined`, and the cast lies about the type before the `||`.
- [ ] Check for any other similar patterns in the same file and fix those too.
- [ ] Verify: `npm run typecheck` passes.
