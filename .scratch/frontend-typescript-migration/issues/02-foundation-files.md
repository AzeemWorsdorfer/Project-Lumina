# 02 — Foundation Files

**What to build:** Convert the no-JSX utility and service files to TypeScript, with hand-written API types. These are the leaf dependencies that every other module imports from — getting them typed first pays dividends downstream.

**Blocked by:** 01 — Tooling & Foundation Types

**Status:** ready-for-agent

- [ ] Convert `src/config.js` → `src/config.ts` (typed `API_BASE_URL`)
- [ ] Convert `src/lib/supabase.js` → `src/lib/supabase.ts` (typed Supabase client)
- [ ] Convert `src/utils/mapTransform.js` → `src/utils/mapTransform.ts` (typed `nodeToBackend`, `edgeToBackend`, color constants)
- [ ] Convert `src/services/api.js` → `src/services/api.ts` (typed all API functions with response/request types, `authFetch` signature)
- [ ] Import shared types from `src/types/index.ts`
- [ ] Verify: `npm run typecheck` passes, `npm run build` succeeds
