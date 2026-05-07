import { useState, useRef, useEffect } from "react";
import { Square, StickyNote, CircleX, Trash2, GitBranch, Lightbulb, Loader2, X, ChevronDown, Plus, Undo2, Redo2 } from "lucide-react";
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
  edgeSource = null,
  onCancelEdge = null,
  onUndo,
  onRedo,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedHint, setSelectedHint] = useState(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_NODE_COLOR);
  const [selectedNodeType, setSelectedNodeType] = useState("textCard");
  const dropdownRef = useRef(null);
  const nodeMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (nodeMenuRef.current && !nodeMenuRef.current.contains(event.target)) {
        setShowNodeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddNode = () => {
    onAddNode(selectedNodeType, selectedColor);
    setShowNodeMenu(false);
    toast.success(`Added ${selectedNodeType === "stickyNote" ? "sticky note" : "text card"}`, { duration: 1500 });
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
        <div className="glass rounded-lg p-1.5 shadow-xl">
          <div className="flex flex-col gap-1">
            <button
              onClick={onUndo}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center"
              title={`Undo (${mod}+Z)`}
            >
              <Undo2 className="w-4 h-4 text-slate-300 group-hover:text-white" />
            </button>
            <button
              onClick={onRedo}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center"
              title={`Redo (${mod}+Shift+Z)`}
            >
              <Redo2 className="w-4 h-4 text-slate-300 group-hover:text-white" />
            </button>
          </div>
        </div>

        <div className="relative" ref={nodeMenuRef}>
          <div className="glass rounded-lg p-1.5 flex flex-col gap-1 shadow-xl">
            <button
              onClick={() => setShowNodeMenu(!showNodeMenu)}
              className="p-2 bg-slate-700 hover:bg-amber-600 active:bg-amber-500 rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center"
              title={`Add Node (Tab=child, Enter=sibling)`}
            >
              <Plus className="w-4 h-4 text-slate-300 group-hover:text-white" />
            </button>
          </div>

          <div className={`absolute right-full mr-2 top-0 w-56 origin-top-right glass rounded-lg shadow-xl overflow-hidden transition-[opacity,transform] duration-150 ease-out-expo ${
            showNodeMenu 
              ? 'opacity-100 scale-100 pointer-events-auto' 
              : 'opacity-0 scale-95 pointer-events-none'
          }`}>
              <div className="p-3 border-b border-slate-700/30">
                <p className="text-xs text-slate-400 uppercase font-medium mb-2">Node Type</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedNodeType("textCard")}
                    className={`flex-1 p-2 rounded-md text-xs font-medium transition active:scale-[0.97] duration-150 ease-out-expo flex items-center justify-center gap-1 ${
                      selectedNodeType === "textCard" 
                        ? "bg-amber-600 text-white" 
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <Square className="w-3 h-3" />
                    Card
                  </button>
                  <button
                    onClick={() => setSelectedNodeType("stickyNote")}
                    className={`flex-1 p-2 rounded-md text-xs font-medium transition active:scale-[0.97] duration-150 ease-out-expo flex items-center justify-center gap-1 ${
                      selectedNodeType === "stickyNote" 
                        ? "bg-amber-600 text-white" 
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <StickyNote className="w-3 h-3" />
                    Note
                  </button>
                </div>
              </div>

              <div className="p-3 border-b border-slate-700/30">
                <p className="text-xs text-slate-400 uppercase font-medium mb-2">Color</p>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_NAMES.map((colorName) => (
                    <button
                      key={colorName}
                      onClick={() => setSelectedColor(NODE_COLORS[colorName])}
                      className={`w-8 h-8 rounded-md transition active:scale-[0.9] duration-150 ease-out-expo ${
                        selectedColor === NODE_COLORS[colorName] 
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110" 
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: NODE_COLORS[colorName] }}
                      title={colorName}
                    />
                  ))}
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleAddNode}
                  className="w-full p-2 bg-amber-600 hover:bg-amber-500 rounded-md transition active:scale-[0.97] duration-150 ease-out-expo text-sm font-medium text-white flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add {selectedNodeType === "stickyNote" ? "Note" : "Card"}
                </button>
              </div>
            </div>
        </div>

        <div className="glass rounded-lg p-2 shadow-xl">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedNodeCount === 0 && selectedEdgeCount === 0}
            className="p-2 bg-slate-700 hover:bg-red-600 disabled:hover:bg-slate-700 disabled:cursor-not-allowed rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center w-full"
            title={`Delete Selected (Delete/Backspace)`}
          >
            <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-white disabled:group-hover:text-slate-300" />
          </button>
        </div>

        <div className="glass rounded-lg p-2 shadow-xl">
          <button
            onClick={handleClearAll}
            className="p-2 bg-slate-700 hover:bg-red-600 rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center w-full"
            title="Clear All"
          >
            <CircleX className="w-4 h-4 text-slate-300 group-hover:text-white" />
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className="glass rounded-lg p-1.5 shadow-xl">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isGeneratingHint}
              className="p-2 bg-slate-700 hover:bg-amber-600 disabled:bg-amber-800 disabled:cursor-not-allowed rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center relative"
              title="Get Hint"
            >
              {isGeneratingHint ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Lightbulb className="w-4 h-4 text-slate-300 group-hover:text-white" />
              )}
              {hints.length > 0 && !isGeneratingHint && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {hints.length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-slate-400 absolute -bottom-1 left-1/2 -translate-x-1/2 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`absolute right-0 top-full mt-2 w-72 origin-top-right glass rounded-lg shadow-xl overflow-hidden transition-[opacity,transform] duration-150 ease-out-expo ${
            showDropdown 
              ? 'opacity-100 scale-100 pointer-events-auto' 
              : 'opacity-0 scale-95 pointer-events-none'
          }`}>
              <div className="p-2 border-b border-slate-700/30">
                <button
                  onClick={handleGetHint}
                  disabled={isGeneratingHint || nodeCount === 0}
                  className="w-full p-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-md transition active:scale-[0.97] duration-150 ease-out-expo text-sm font-medium text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
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
                  <p className="px-3 py-2 text-xs text-slate-500 font-medium uppercase">Previous Hints</p>
                  {hints.map((hint, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedHint(hint);
                        setShowDropdown(false);
                      }}
                      className="w-full p-3 text-left hover:bg-slate-700/50 transition active:scale-[0.98] duration-150 ease-out-expo border-b border-slate-700/30 last:border-0"
                    >
                      <p className="text-sm text-slate-300 line-clamp-2 font-serif">{hint}</p>
                      <p className="text-xs text-slate-500 mt-1">Hint #{hints.length - index}</p>
                    </button>
                  ))}
                </div>
              )}
              
              {hints.length === 0 && (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No hints yet. Add some nodes and get a hint!
                </div>
              )}
            </div>
        </div>

        <div className={`glass rounded-lg p-2 text-xs text-center shadow-xl transition duration-150 ease-out-expo ${
          edgeSource ? "!border-amber-500 text-amber-400" : "!border-slate-700/30 text-slate-400"
        }`}>
          <div className="flex items-center gap-1 justify-center mb-1">
            <GitBranch className={`w-3 h-3 ${edgeSource ? "text-amber-400" : ""}`} />
            <span>Connect</span>
          </div>
          <p>Shift + Click</p>
          {edgeSource ? (
            <button 
              onClick={onCancelEdge}
              className="mt-1 text-amber-500 hover:text-amber-400 underline transition active:scale-[0.95] duration-150 ease-out-expo"
            >
              Cancel (Esc)
            </button>
          ) : (
            <p>two nodes</p>
          )}
        </div>
      </div>

      {selectedHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedHint(null)}>
          <div className="glass-strong rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h2 className="font-semibold text-white font-serif">Socratic Hint</h2>
              </div>
              <button
                onClick={() => setSelectedHint(null)}
                className="p-1 hover:bg-slate-700/50 rounded-md transition active:scale-[0.9] duration-150 ease-out-expo"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-serif">{selectedHint}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
