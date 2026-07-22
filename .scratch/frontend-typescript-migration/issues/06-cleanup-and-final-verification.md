# 06 — Cleanup & Final Verification

**What to build:** After all files are converted, clean up any remaining JS-only configuration and do a final verification pass across the whole pipeline.

**Blocked by:** 05 — Pages & Composition Roots

**Status:** ready-for-agent

- [ ] Remove any leftover `.js` source files that were skipped (confirm all are converted)
- [ ] Verify `npm run typecheck` passes with zero errors and zero `// @ts-nocheck` / `// @ts-ignore`
- [ ] Verify `npm run build` produces a clean production build
- [ ] Verify `npm run lint` passes with the updated `typescript-eslint` config
- [ ] Smoke test: login, session creation, mind map edit, hint generation, quiz
- [ ] Consider: removing `@eslint/js` config for JS-only patterns if no longer needed
