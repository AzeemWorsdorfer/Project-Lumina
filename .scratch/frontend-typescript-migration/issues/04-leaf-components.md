# 04 — Leaf Components

**What to build:** Convert the small, focused UI components to TypeScript. These have no page-level imports and consume contexts/hooks that are already typed from tickets 02–03.

**Blocked by:** 03 — Hooks & Contexts

**Status:** ready-for-agent

- [ ] Convert `src/components/EditableNode.jsx` → `.tsx`:
  - `interface EditableNodeProps` (data, selected, type-specific props from @xyflow/react)
- [ ] Convert `src/components/PomodoroTimer.jsx` → `.tsx`:
  - `interface PomodoroTimerProps` or inline state types
- [ ] Convert `src/components/ProtectedRoute.jsx` → `.tsx`:
  - `interface ProtectedRouteProps` (children)
- [ ] Convert `src/components/Toolbar.jsx` → `.tsx`:
  - `interface ToolbarProps` (callbacks for add, delete, hint, quiz, undo, redo, help)
- [ ] Convert `src/components/Sidebar.jsx` → `.tsx`:
  - `interface SidebarProps` (session list, onSelect, upload handler)
- [ ] Verify: `npm run typecheck` passes, `npm run build` succeeds
