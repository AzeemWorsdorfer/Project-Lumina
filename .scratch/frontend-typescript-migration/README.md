# Frontend TypeScript Migration

6 tickets sequenced in dependency order (blockers first):

| # | Ticket | File | Blocked by |
|---|--------|------|------------|
| 01 | Tooling & Foundation Types | `issues/01-tooling-and-foundation-types.md` | None |
| 02 | Foundation Files | `issues/02-foundation-files.md` | 01 |
| 03 | Hooks & Contexts | `issues/03-hooks-and-contexts.md` | 02 |
| 04 | Leaf Components | `issues/04-leaf-components.md` | 03 |
| 05 | Pages & Composition Roots | `issues/05-pages-and-composition-roots.md` | 04 |
| 06 | Cleanup & Final Verification | `issues/06-cleanup-and-final-verification.md` | 05 |

## Decisions (from spec)

- **Strategy:** Incremental, layer-by-layer
- **Strictness:** `tsc --strict true`
- **Type-check:** `npm run typecheck` (separate, not in build)
- **API types:** Hand-written, not codegen
- **Component props:** Inline `interface ComponentNameProps` per file
- **Contexts:** `T | null` with guard hooks
