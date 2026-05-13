import { useState, useRef, useEffect } from "react";
import { CircleX, Trash2, Lightbulb, Loader2, X, ChevronDown, Plus, Undo2, Redo2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { NODE_COLORS, DEFAULT_NODE_COLOR } from "../utils/mapTransform.js";

const COLOR_NAMES = Object.keys(NODE_COLORS);

const isMac = typeof navigator !== "undefined"
  && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const mod = isMac ? "⌘" : "Ctrl";

const Toolbar = ({
  onAddNode,
  onClearAll,
  onDeleteSelected,
  nodeCount,
  selectedNodeCount,
  selectedEdgeCount = 0,
  onGetHint,
  hints = [],
  isGeneratingHint = false,
  onUndo,
  onRedo,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedHint, setSelectedHint] = useState(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_NODE_COLOR);
  const dropdownRef = useRef(null);
  const nodeMenuRef = useRef(null);
  const helpRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (nodeMenuRef.current && !nodeMenuRef.current.contains(event.target)) {
        setShowNodeMenu(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddNode = () => {
    onAddNode("textCard", selectedColor);
    setShowNodeMenu(false);
    toast.success("Added card", { duration: 1500 });
  };

  const handleClearAll = () => {
    if (nodeCount === 0) {
      toast.info("Nothing to clear");
      return;
    }
    toast.warning("Clear all nodes?", {
      cancel: { label: "Cancel", action: () => {} },
      action: {
        label: "Clear All",
        onClick: () => {
          onClearAll();
          toast.success("All nodes cleared");
        },
      },
    });
  };

  const handleDeleteSelected = () => {
    const total = selectedNodeCount + selectedEdgeCount;
    if (total === 0) {
      toast.info("Nothing selected");
      return;
    }
    onDeleteSelected();
    toast.success(`Deleted ${total} item${total > 1 ? "s" : ""}`, { duration: 1500 });
  };

  const handleGetHint = async () => {
    if (nodeCount === 0) {
      toast.error("Add some nodes to the map first");
      return;
    }
    setShowDropdown(false);
    await onGetHint();
  };

  return (
    <>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <div className="bg-glass rounded-lg p-1.5 shadow-theme-xl">
          <div className="flex flex-col gap-1">
            <button
              onClick={onUndo}
              className="p-2 bg-elevated hover:bg-secondary rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center"
              title={`Undo (${mod}+Z)`}
              aria-label={`Undo (${mod}+Z)`}
            >
              <Undo2 className="w-4 h-4 text-secondary group-hover:text-primary" />
            </button>
            <button
              onClick={onRedo}
              className="p-2 bg-elevated hover:bg-secondary rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center"
              title={`Redo (${mod}+Shift+Z)`}
              aria-label={`Redo (${mod}+Shift+Z)`}
            >
              <Redo2 className="w-4 h-4 text-secondary group-hover:text-primary" />
            </button>
          </div>
        </div>

        <div className="relative" ref={nodeMenuRef}>
          <div className="bg-glass rounded-lg p-1.5 flex flex-col gap-1 shadow-theme-xl">
            <button
              onClick={() => setShowNodeMenu(!showNodeMenu)}
              className="p-2 bg-elevated hover:bg-accent active:bg-accent-hover rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center"
              title="Add Node (Tab=child, Enter=sibling)"
              aria-label="Add node"
            >
              <Plus className="w-4 h-4 text-secondary group-hover:text-on-accent" />
            </button>
          </div>

          <div className={`absolute right-full mr-2 top-0 w-56 origin-top-right bg-glass rounded-lg shadow-theme-xl overflow-hidden transition-[opacity,transform] duration-150 ease-out-expo ${
            showNodeMenu
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}>
              <div className="p-3 border-b border-default">
                <p className="text-xs text-muted uppercase font-medium mb-2">Color</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_NAMES.map((colorName) => (
                    <button
                      key={colorName}
                      onClick={() => setSelectedColor(NODE_COLORS[colorName])}
                      className={`w-8 h-8 rounded-md transition active:scale-[0.9] duration-150 ease-out-expo ${
                        selectedColor === NODE_COLORS[colorName]
                          ? "ring-2 ring-white scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: NODE_COLORS[colorName] }}
                      title={colorName}
                      aria-label={`Select ${colorName} color`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleAddNode}
                  className="w-full p-2 bg-accent hover:bg-accent-hover rounded-md transition active:scale-[0.97] duration-150 ease-out-expo text-sm font-medium text-on-accent flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Card
                </button>
              </div>
            </div>
        </div>

        <div className="bg-glass rounded-lg p-2 shadow-theme-xl">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedNodeCount === 0 && selectedEdgeCount === 0}
            className="p-2 bg-elevated hover:bg-destructive disabled:hover:bg-elevated disabled:cursor-not-allowed rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center w-full"
            title="Delete Selected (Delete/Backspace)"
            aria-label="Delete selected items"
          >
            <Trash2 className="w-4 h-4 text-secondary group-hover:text-on-accent disabled:group-hover:text-secondary" />
          </button>
        </div>

        <div className="bg-glass rounded-lg p-2 shadow-theme-xl">
          <button
            onClick={handleClearAll}
            className="p-2 bg-elevated hover:bg-destructive rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center w-full"
            title="Clear All"
            aria-label="Clear all nodes"
          >
            <CircleX className="w-4 h-4 text-secondary group-hover:text-on-accent" />
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className="bg-glass rounded-lg p-1.5 shadow-theme-xl">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isGeneratingHint}
              className="p-2 bg-elevated hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center relative"
              title="Get Hint"
              aria-label="Get hint"
            >
              {isGeneratingHint ? (
                <Loader2 className="w-4 h-4 animate-spin text-on-accent" />
              ) : (
                <Lightbulb className="w-4 h-4 text-secondary group-hover:text-on-accent" />
              )}
              {hints.length > 0 && !isGeneratingHint && (
                <span className="absolute -top-1 -right-1 bg-accent text-on-accent text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {hints.length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-muted absolute -bottom-1 left-1/2 -translate-x-1/2 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`absolute right-0 top-full mt-2 w-72 origin-top-right bg-glass rounded-lg shadow-theme-xl overflow-hidden transition-[opacity,transform] duration-150 ease-out-expo ${
            showDropdown
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}>
              <div className="p-2 border-b border-default">
                <button
                  onClick={handleGetHint}
                  disabled={isGeneratingHint || nodeCount === 0}
                  className="w-full p-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition active:scale-[0.97] duration-150 ease-out-expo text-sm font-medium text-on-accent flex items-center justify-center gap-2 shadow-theme-lg"
                >
                  {isGeneratingHint ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      Get New Hint
                    </>
                  )}
                </button>
              </div>

              {hints.length > 0 && (
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  <p className="px-3 py-2 text-xs text-muted font-medium uppercase">Previous Hints</p>
                  {hints.map((hint, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedHint(hint);
                        setShowDropdown(false);
                      }}
                      className="w-full p-3 text-left hover:bg-secondary transition active:scale-[0.98] duration-150 ease-out-expo border-b border-default last:border-0"
                    >
                      <p className="text-sm text-secondary line-clamp-2 font-serif">{hint}</p>
                      <p className="text-xs text-muted mt-1">Hint #{hints.length - index}</p>
                    </button>
                  ))}
                </div>
              )}

              {hints.length === 0 && (
                <div className="p-4 text-center text-muted text-sm">
                  No hints yet. Add some nodes and get a hint!
                </div>
              )}
            </div>
        </div>

        <div className="relative" ref={helpRef}>
          <div className="bg-glass rounded-lg p-2 shadow-theme-xl">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 bg-elevated hover:bg-accent rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center w-full"
              title="Keyboard Shortcuts"
              aria-label="Keyboard shortcuts"
            >
              <HelpCircle className="w-4 h-4 text-secondary group-hover:text-on-accent" />
            </button>
          </div>

          <div className={`absolute right-0 top-full mt-2 w-64 origin-top-right bg-glass rounded-lg shadow-theme-xl overflow-hidden transition-[opacity,transform] duration-150 ease-out-expo ${
            showHelp
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}>
              <div className="p-3">
                <p className="text-xs text-muted uppercase font-medium mb-3">Keyboard Shortcuts</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">Shift + Click node</span>
                    <span className="text-xs text-muted">Connect nodes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">Delete / Backspace</span>
                    <span className="text-xs text-muted">Delete selected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">Escape</span>
                    <span className="text-xs text-muted">Cancel / Deselect</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">{mod}+Z</span>
                    <span className="text-xs text-muted">Undo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">{mod}+Shift+Z</span>
                    <span className="text-xs text-muted">Redo</span>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {selectedHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={() => setSelectedHint(null)}>
          <div className="bg-glass-strong rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-default">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                <h2 className="font-semibold text-primary font-serif">Socratic Hint</h2>
              </div>
              <button
                onClick={() => setSelectedHint(null)}
                className="p-1 hover:bg-secondary rounded-md transition active:scale-[0.9] duration-150 ease-out-expo"
                aria-label="Close hint"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <p className="text-primary leading-relaxed whitespace-pre-wrap font-serif">{selectedHint}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
