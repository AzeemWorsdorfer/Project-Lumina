# 03 — Harden Environment Variable Loading

**What to build:** Replace unsafe `as string` casts on `import.meta.env` properties in `supabase.ts` with proper fallback or guard, matching the pattern used in `config.ts`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Replace `import.meta.env.VITE_SUPABASE_URL as string` with a fallback that crashes explicitly with a clear message if the variable is missing.
- [ ] Do the same for `VITE_SUPABASE_ANON_KEY`.
- [ ] Verify: `npm run typecheck` passes, missing env vars produce a clear error at runtime, present vars work as before.
