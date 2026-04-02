import { useState, useRef, useEffect } from "react";
import { Square, CircleX, Trash2, GitBranch, Lightbulb, Loader2, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const Toolbar = ({ 
  onAddNode, 
  onClearAll, 
  onDeleteSelected, 
  nodeCount, 
  selectedNodeCount,
  onGetHint,
  hints = [],
  isGeneratingHint = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedHint, setSelectedHint] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddNode = (type) => {
    onAddNode(type);
    toast.success(`Added ${type} node`, { duration: 2000 });
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 flex flex-col gap-1 shadow-xl">
          <button
            onClick={() => handleAddNode("default")}
            className="p-2 bg-slate-700 hover:bg-amber-600 active:bg-amber-500 rounded-md transition-colors group flex items-center justify-center"
            title="Add Node"
          >
            <Square className="w-4 h-4 text-slate-300 group-hover:text-white" />
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl">
          <button
            onClick={onDeleteSelected}
            disabled={selectedNodeCount === 0}
            className="p-2 bg-slate-700 hover:bg-red-600 disabled:hover:bg-slate-700 disabled:cursor-not-allowed rounded-md transition-colors group flex items-center justify-center w-full"
            title="Delete Selected"
          >
            <Trash2 className="w-4 h-4 text-slate-300 group-hover:text-white disabled:group-hover:text-slate-300" />
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl">
          <button
            onClick={handleClearAll}
            className="p-2 bg-slate-700 hover:bg-red-600 rounded-md transition-colors group flex items-center justify-center w-full"
            title="Clear All"
          >
            <CircleX className="w-4 h-4 text-slate-300 group-hover:text-white" />
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 shadow-xl">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isGeneratingHint}
              className="p-2 bg-slate-700 hover:bg-amber-600 disabled:bg-amber-800 disabled:cursor-not-allowed rounded-md transition-colors group flex items-center justify-center relative"
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

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
              <div className="p-2 border-b border-slate-700">
                <button
                  onClick={handleGetHint}
                  disabled={isGeneratingHint || nodeCount === 0}
                  className="w-full p-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-md transition-colors text-sm font-medium text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
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
                      className="w-full p-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                    >
                      <p className="text-sm text-slate-300 line-clamp-2">{hint}</p>
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
          )}
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-xs text-slate-400 text-center shadow-xl">
          <div className="flex items-center gap-1 justify-center mb-1">
            <GitBranch className="w-3 h-3" />
            <span>Edge</span>
          </div>
          <p>Shift + Click</p>
          <p>two nodes</p>
        </div>
      </div>

      {selectedHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedHint(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h2 className="font-semibold text-white">Socratic Hint</h2>
              </div>
              <button
                onClick={() => setSelectedHint(null)}
                className="p-1 hover:bg-slate-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedHint}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
