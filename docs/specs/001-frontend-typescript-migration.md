# Frontend TypeScript Migration

## Problem Statement

The Project-Lumina frontend is written entirely in JavaScript (JSX), with no type safety. As the codebase grows (~2400 lines across 15 files), the lack of static types leads to runtime errors that could be caught at compile time, poor IDE support (no autocomplete on API responses, context values, or component props), and increased cognitive overhead for developers joining the project.

## Solution

Migrate the frontend from JavaScript (JSX) to TypeScript (TSX), incrementally, with strict type checking enabled. This provides compile-time type safety, better IDE tooling, and self-documenting interfaces — without a disruptive big-bang rewrite.

## User Stories

1. As a developer, I want API response shapes to be typed, so that I get autocomplete and compile-time errors when accessing fields that don't exist.
2. As a developer, I want component props to be typed via inline interfaces, so that I know exactly what props a component expects without reading its implementation.
3. As a developer, I want context providers to expose typed values with guard hooks, so that accessing context without a provider throws at dev time rather than silently failing.
4. As a developer, I want `npm run typecheck` to fail the build if type errors exist, so that type-level bugs never reach production.
5. As a developer, I want ESLint to understand TypeScript syntax, so that code style enforcement continues to work during and after migration.
6. As a developer, I want to be able to convert files incrementally (one at a time), so that I can keep shipping features during the migration.
7. As a developer, I want foundation files (config, API services, utility functions) converted first, so that the rest of the codebase benefits from typed imports immediately.
8. As a developer, I want runtime validation for critical external data (Supabase auth responses, API payloads), so that unexpected backend shapes are caught at the boundary.

## Implementation Decisions

### Migration Strategy: Incremental

Files will be converted one at a time in dependency order:

1. **Layer 0 — No JSX (`.js` → `.ts`):** `src/config.js`, `src/lib/supabase.js`, `src/utils/mapTransform.js`
2. **Layer 1 — Services (`.js` → `.ts`):** `src/services/api.js`
3. **Layer 2 — No UI hooks/contexts (`.jsx` → `.ts`):** `src/hooks/useKeyboardShortcuts.js`
4. **Layer 3 — Contexts (`.jsx` → `.tsx`):** `src/contexts/AuthContext.jsx`, `src/contexts/ThemeContext.jsx`
5. **Layer 4 — Leaf components (`.jsx` → `.tsx`):** `EditableNode`, `PomodoroTimer`, `ProtectedRoute`, `Toolbar`, `Sidebar`
6. **Layer 5 — Page components (`.jsx` → `.tsx`):** `LoginPage`, `SignupPage`
7. **Layer 6 — Composition roots (`.jsx` → `.tsx`):** `Dashboard`, `MapCanvas`, `PdfViewer`, `App`, `main`

Each layer can be completed, committed, and shipped independently. A file is "converted" when it compiles with `strict: true` and zero `// @ts-ignore` / `// @ts-nocheck` comments.

### TypeScript Configuration

- **`tsconfig.json`** with `strict: true`, `jsx: "react-jsx"`, `moduleResolution: "bundler"`, and `"types": ["vite/client"]` for `import.meta.env` support.
- Separate `tsconfig.app.json` for `src/` and `tsconfig.node.json` for `vite.config.ts`.
- `npm run typecheck` runs `tsc --noEmit` — not part of the local build but enforced in CI.
- Vite continues to use esbuild for stripping types (fast), not `tsc`. Type checking is opted into via `typecheck` script.

### Type Strictness

- `strict: true` — full strict mode from day one.
- No `noUncheckedIndexedAccess` (avoids excessive `T | undefined` during migration).
- Per-file escape hatches allowed temporarily: `// @ts-nocheck` at the top of a file that hasn't been converted yet, removed once converted.
- `any` is discouraged but allowed in specific cases (e.g., third-party event shapes). Prefer `unknown` if the type truly can't be known.

### Component Conventions

- Each component defines `interface ComponentNameProps` at the top of its file.
- Props interfaces are exported only if consumed by another file (e.g., wrapped HOCs).
- Children are typed as `React.ReactNode`.
- All event handlers are typed (e.g., `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent`).
- No `PropTypes` — they become the TypeScript interface.

### Context Providers

- Context values typed as `InterfaceName | null` (not `{}`).
- Each context gets a custom guard hook that throws if accessed outside the provider.
- Pattern: `export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error(...); return ctx; }`
- ThemeContext already follows this pattern; AuthContext needs to be updated.

### API Types

- Hand-written TypeScript interfaces matching backend response shapes, defined in `src/services/api.ts`.
- Key types: `Session`, `MindMapNode`, `MindMapEdge`, `QuizQuestion`, `SocraticHint`.
- Backend field naming convention (snake_case) preserved at the API boundary; frontend conventions (camelCase) used in React state.
- `mapTransform.js` already handles the snake_case ↔ camelCase conversion — its return types will be the typed interfaces consumed by components.

### Shared Types File

- `src/types/index.ts` will hold domain types shared across services, components, and contexts:
  - `Session` (id, title, pdf_url, created_at, updated_at)
  - `MindMapNode` (id, label, node_type, color, position, related_source_chunk_id, width, height)
  - `MindMapEdge` (id, source, target, label, edge_type, color)
  - `QuizQuestion` (question, options, correct_answer, explanation)
  - `SocraticHint` (hint_text, related_concept)
  - `User` (supabase user shape)
  - `Theme` ("light" | "dark")

### ESLint Integration

- Add `typescript-eslint` parser and config.
- Update `files` pattern to `['**/*.{js,jsx,ts,tsx}']`.
- Use `tseslint.configs.recommended` alongside existing React configs.
- No `@typescript-eslint/no-explicit-any` restriction initially — warn only.

### Targeted Seam for Verification

The single seam at which type correctness is verified is `npm run typecheck` (`tsc --noEmit`). No additional testing seams are introduced for the migration itself. Existing tests (none currently) would verify business logic independently.

## Testing Decisions

- **No new tests introduced for the migration itself.** The migration is a type-level transformation — the runtime behavior is unchanged.
- **Verification seam:** `tsc --noEmit` (aliased as `npm run typecheck`) must pass with zero errors.
- **Build verification:** `npm run build` must produce the same output as before the migration.
- **Manual verification:** Smoke-test key user flows (login, mind map creation, hint generation, quiz) after each layer is converted.
- **Future testing:** If/when unit tests are added, they should be written in `.tsx` and import types from the shared types module.

## Out of Scope

- Converting the backend (Python/FastAPI) to TypeScript.
- Adding runtime validation libraries (Zod, io-ts) — hand-written types are sufficient for now; Zod can be layered on later if API boundary guarantees are needed.
- Refactoring component logic or styling — the migration is a type-level transformation only, leaving behavior unchanged.
- Adding barrel exports or restructuring the file hierarchy — files stay where they are.
- Performance optimization — no runtime cost is introduced or removed by the migration.

## Further Notes

- `@types/react` and `@types/react-dom` are already in `devDependencies` — no need to install them.
- `@xyflow/react` ships its own types (`Node`, `Edge`, `useNodesState`, etc.) — these will be imported directly.
- `react-pdf` ships its own types — the PDF viewer component will use `DocumentProps`, `PageProps`, etc.
- `@supabase/supabase-js` ships its own types — `AuthUser`, `Session`, `AuthResponse` are available.
- `lucide-react` ships its own types — icon components will be typed as `LucideIcon`.
- `vite/client` provides types for `import.meta.env` — already referenced via `/// <reference types="vite/client" />` in a `env.d.ts` or `tsconfig.app.json` `types` field.
- Packages to install: `typescript`, `typescript-eslint`.
- Packages to create file for: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`.
- Files to update: `eslint.config.js`, `vite.config.ts` (rename from `.js`).
- Layout/rerender/PDF examples in the codebase serve as prior art for how typed React components should be written.
