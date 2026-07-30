# 05 — Add Missing User Type and Fix tsconfig Strictness

**What to build:** Fill two gaps from the TypeScript migration spec: add a `User` type to the shared types file, and enable `strict: true` in `tsconfig.node.json`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Add `User` type to `src/types/index.ts` matching the Supabase user shape (as referenced in the migration spec).
- [ ] Update `AuthContext.tsx` to import `User` from shared types instead of from `@supabase/supabase-js` (optional — only if the shared User type is preferable).
- [ ] Add `"strict": true` to `tsconfig.node.json` to match `tsconfig.app.json`.
- [ ] Verify: `npm run typecheck` and `npm run build` both pass.
