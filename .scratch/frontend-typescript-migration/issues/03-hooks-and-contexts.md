# 03 — Hooks & Contexts

**What to build:** Convert the keyboard shortcuts hook, AuthContext, and ThemeContext to TypeScript. AuthContext gets a proper typed value interface and a guard hook (matching ThemeContext's existing pattern). After this ticket, any component can import typed auth/theme context values.

**Blocked by:** 02 — Foundation Files

**Status:** ready-for-agent

- [ ] Convert `src/hooks/useKeyboardShortcuts.js` → `src/hooks/useKeyboardShortcuts.ts`
- [ ] Convert `src/contexts/AuthContext.jsx` → `src/contexts/AuthContext.tsx`:
  - Define `interface AuthContextValue` (user, loading, signUp, signIn, signOut, getAccessToken)
  - Create `createContext<AuthContextValue | null>(null)`
  - Add guard hook: `useAuth()` throws if `!ctx`
- [ ] Convert `src/contexts/ThemeContext.jsx` → `src/contexts/ThemeContext.tsx`:
  - Define `interface ThemeContextValue` (theme, toggleTheme, setTheme)
  - Use `createContext<ThemeContextValue | null>(null)` (already done, just retype)
- [ ] Import `User` type from `src/types/index.ts` for AuthContext
- [ ] Verify: `npm run typecheck` passes, `npm run build` succeeds
