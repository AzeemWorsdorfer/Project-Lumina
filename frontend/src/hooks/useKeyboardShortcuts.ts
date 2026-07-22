import { useEffect, useCallback } from "react";

interface KeyboardShortcutHandlers {
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAddChild?: () => void;
  onAddSibling?: () => void;
  onDeselectAll?: () => void;
  onEditNode?: () => void;
  onSave?: () => void;
}

const isEditingElement = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  const tag = el?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable || false;
};

const isMac = typeof navigator !== "undefined"
  && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const modKey = (e: KeyboardEvent): boolean => isMac ? e.metaKey : e.ctrlKey;

const useKeyboardShortcuts = ({
  onDelete,
  onUndo,
  onRedo,
  onAddChild,
  onAddSibling,
  onDeselectAll,
  onEditNode,
  onSave,
}: KeyboardShortcutHandlers): void => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const editing = isEditingElement(e.target);

    if (modKey(e) && e.shiftKey && e.key === "Z") {
      e.preventDefault();
      onRedo?.();
      return;
    }

    if (modKey(e) && e.key === "z") {
      e.preventDefault();
      onUndo?.();
      return;
    }

    if (modKey(e) && e.key === "s") {
      e.preventDefault();
      onSave?.();
      return;
    }

    if (editing) return;

    if (modKey(e) && e.key === "e") {
      e.preventDefault();
      onEditNode?.();
      return;
    }

    switch (e.key) {
      case "Delete":
      case "Backspace":
        e.preventDefault();
        onDelete?.();
        break;
      case "Tab":
        e.preventDefault();
        onAddChild?.();
        break;
      case "Enter":
        if (!e.shiftKey) {
          e.preventDefault();
          onAddSibling?.();
        }
        break;
      case "Escape":
        e.preventDefault();
        onDeselectAll?.();
        break;
    }
  }, [onDelete, onUndo, onRedo, onAddChild, onAddSibling, onDeselectAll, onEditNode, onSave]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
