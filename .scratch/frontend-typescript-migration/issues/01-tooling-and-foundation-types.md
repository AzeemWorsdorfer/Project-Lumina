# 01 — Tooling & Foundation Types

**What to build:** Add TypeScript tooling (compiler, config files, ESLint) and the shared domain types module so that the rest of the migration has a foundation to build on. After this ticket, `npm run typecheck` and `npm run build` both pass from a still-JS codebase.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Install `typescript` and `typescript-eslint` packages
- [ ] Create `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` with `strict: true`
- [ ] Update `eslint.config.js` to include TS parser and `tseslint.configs.recommended`
- [ ] Rename `vite.config.js` → `vite.config.ts`
- [ ] Create `src/types/index.ts` with domain types: `Session`, `MindMapNode`, `MindMapEdge`, `QuizQuestion`, `User`, `Theme`
- [ ] Add `/// <reference types="vite/client" />` (or equivalent in tsconfig) for `import.meta.env`
- [ ] Add `"typecheck": "tsc --noEmit"` to `package.json` scripts
- [ ] Verify: `npm run typecheck` passes, `npm run build` succeeds, `npm run lint` passes
