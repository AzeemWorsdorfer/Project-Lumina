# 01 — Fix Undo/Redo Indexing

**What to build:** Fix the undo/redo history indexing in MapCanvas so that redo reliably restores the next state after an undo.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `handleUndo` currently decrements `historyRef.current.index` after restoring `stack[index]` — instead, it should keep the cursor pointing at the restored state so redo can advance forward.
- [ ] `handleRedo` guards with `index >= stack.length - 2` and reads `stack[index + 2]` — after one undo this fires too early. Fix so redo reads the state *after* the current index.
- [ ] Ensure snapshots (taken before each mutation) plus the *current* live state form a complete timeline that supports both undo and redo.
- [ ] Verify: undo restores previous state, redo restores the undone state, new mutations after undo clear the redo stack.
