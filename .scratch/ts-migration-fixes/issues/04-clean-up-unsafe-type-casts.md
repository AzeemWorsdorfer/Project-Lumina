# 04 — Clean Up Unsafe Type Casts in Map Transform

**What to build:** Remove unnecessary and mis-typed `as string` casts in `src/utils/mapTransform.ts` where the expression already handles the optional/`undefined` case with a `||` fallback.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Remove `as string` from `(edge.style?.stroke as string) || DEFAULT_EDGE_COLOR` — the `||` already handles the `undefined`, and the cast lies about the type before the `||`.
- [x] Check for any other similar patterns in the same file and fix those too.
- [x] Verify: `npm run typecheck` passes.

## Comments

### Verification on 2026-08-10
- `grep -rn "as string" frontend/src` → only one match (`mapTransform.ts:103` before edit); none after.
- `grep -rn "\bas [A-Za-z]" frontend/src/utils/mapTransform.ts` → no remaining casts in this file. The two casts in `api.ts` (`options.headers as Record<string, string>` at line 59 and `as Error & { status: number }` at line 75) are different patterns (no `||` fallback; first is a HeadersInit narrowing inside a manual loop, second is an error-object augmentation) and not in scope.
- `npm run typecheck`: PASS (zero errors, `tsc --noEmit` exited cleanly).
- Change made: `mapTransform.ts:103` now reads `color: edge.style?.stroke || DEFAULT_EDGE_COLOR,`. Type is unchanged (`string`); the redundant `as string` is gone.

### Body correction
- Original body said the cast lived in `src/services/api.ts`. It's actually in `src/utils/mapTransform.ts:103`. Front matter updated to reflect the correct file.

### Tracker follow-up
- 06 listed this issue as its blocker. Now that 04 is resolved, the blocker chain in 06 is satisfied; no change to 06's status needed (06 was verified independently on 2026-08-10).
