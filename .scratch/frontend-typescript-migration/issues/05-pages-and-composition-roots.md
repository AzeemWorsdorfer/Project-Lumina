# 05 — Pages & Composition Roots

**What to build:** Convert the page components and top-level composition roots to TypeScript. These are the last conversion step — they import everything from the previous tickets.

**Blocked by:** 04 — Leaf Components

**Status:** ready-for-agent

- [ ] Convert `src/pages/LoginPage.jsx` → `.tsx`
- [ ] Convert `src/pages/SignupPage.jsx` → `.tsx`
- [ ] Convert `src/components/Dashboard.jsx` → `.tsx`
- [ ] Convert `src/components/MapCanvas.jsx` → `.tsx`:
  - Use `@xyflow/react`'s built-in `Node`, `Edge` types with the app's domain types
  - Type undo/redo state, save/draft handlers
- [ ] Convert `src/components/PdfViewer.jsx` → `.tsx`
- [ ] Convert `src/App.jsx` → `.tsx`
- [ ] Convert `src/main.jsx` → `.tsx`
- [ ] Verify: `npm run typecheck` passes with zero errors, `npm run build` succeeds
