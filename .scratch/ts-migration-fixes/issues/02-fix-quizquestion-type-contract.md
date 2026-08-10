# 02 — Fix QuizQuestion Type Contract

**What to build:** Align the shared `QuizQuestion` type with its actual runtime shape used by every consumer, and remove duplicate inline type definitions that have incompatible fields.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Change `QuizQuestion.correct_answer: string` to `correct_index: number` in `src/types/index.ts`.
- [x] Remove the inline `ToolbarQuizQuestion` interface in `src/components/Toolbar.tsx` — import from shared types instead.
- [x] Remove the inline `QuizQuestionData` interface in `src/components/Dashboard.tsx` — import from shared types instead.
- [x] Change `MapCanvasProps.quizzes` and `onAddQuiz` from `unknown` to the proper typed shape so TypeScript can catch contract violations.
- [x] Verify: `npm run typecheck` passes, quiz grading works end-to-end.
