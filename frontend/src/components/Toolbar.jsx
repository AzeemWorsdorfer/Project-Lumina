import { useState, useRef, useEffect } from "react";
import { CircleX, Trash2, Lightbulb, Loader2, X, ChevronDown, Plus, Undo2, Redo2, HelpCircle, ListChecks, CheckCircle2, XCircle } from "lucide-react";
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
  onGenerateQuiz,
  quizzes = [],
  isGeneratingQuiz = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedHint, setSelectedHint] = useState(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showQuizDropdown, setShowQuizDropdown] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_NODE_COLOR);
  const dropdownRef = useRef(null);
  const nodeMenuRef = useRef(null);
  const helpRef = useRef(null);
  const quizDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedHint || selectedQuiz) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (nodeMenuRef.current && !nodeMenuRef.current.contains(event.target)) {
        setShowNodeMenu(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
      if (quizDropdownRef.current && !quizDropdownRef.current.contains(event.target)) {
        setShowQuizDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedHint, selectedQuiz]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (selectedQuiz) {
          setSelectedQuiz(null);
        } else if (selectedHint) {
          setSelectedHint(null);
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedHint, selectedQuiz]);

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

  const handleGenerateQuiz = async () => {
    if (nodeCount === 0) {
      toast.error("Add some nodes to the map first");
      return;
    }
    setShowQuizDropdown(false);
    await onGenerateQuiz();
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

          <div className={`absolute right-full mr-2 top-0 w-56 origin-top-right bg-glass rounded-lg shadow-theme-xl overflow-hidden z-50 transition-[opacity,transform] duration-150 ease-out-expo ${
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

          <div className={`absolute right-0 top-full mt-2 w-72 origin-top-right bg-glass rounded-lg shadow-theme-xl overflow-hidden z-50 transition-[opacity,transform] duration-150 ease-out-expo ${
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

        <div className="relative" ref={quizDropdownRef}>
          <div className="bg-glass rounded-lg p-1.5 shadow-theme-xl">
            <button
              onClick={() => setShowQuizDropdown(!showQuizDropdown)}
              disabled={isGeneratingQuiz}
              className="p-2 bg-elevated hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition active:scale-[0.95] duration-150 ease-out-expo group flex items-center justify-center relative"
              title="Take a Quiz"
              aria-label="Take a quiz"
            >
              {isGeneratingQuiz ? (
                <Loader2 className="w-4 h-4 animate-spin text-on-accent" />
              ) : (
                <ListChecks className="w-4 h-4 text-secondary group-hover:text-on-accent" />
              )}
              {quizzes.length > 0 && !isGeneratingQuiz && (
                <span className="absolute -top-1 -right-1 bg-accent text-on-accent text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {quizzes.length}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-muted absolute -bottom-1 left-1/2 -translate-x-1/2 transition-transform ${showQuizDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`absolute right-0 top-full mt-2 w-72 origin-top-right bg-glass rounded-lg shadow-theme-xl overflow-hidden z-50 transition-[opacity,transform] duration-150 ease-out-expo ${
            showQuizDropdown
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}>
              <div className="p-2 border-b border-default">
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz || nodeCount === 0}
                  className="w-full p-2 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition active:scale-[0.97] duration-150 ease-out-expo text-sm font-medium text-on-accent flex items-center justify-center gap-2 shadow-theme-lg"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ListChecks className="w-4 h-4" />
                      Generate Quiz
                    </>
                  )}
                </button>
              </div>

              {quizzes.length > 0 && (
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  <p className="px-3 py-2 text-xs text-muted font-medium uppercase">Previous Quizzes</p>
                  {quizzes.map((quiz, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedQuiz(quiz);
                        setShowQuizDropdown(false);
                      }}
                      className="w-full p-3 text-left hover:bg-secondary transition active:scale-[0.98] duration-150 ease-out-expo border-b border-default last:border-0"
                    >
                      <p className="text-sm text-secondary line-clamp-1">{quiz.questions?.[0]?.question || `Quiz #${quizzes.length - index}`}</p>
                      <p className="text-xs text-muted mt-1">Quiz #{quizzes.length - index} • {quiz.questions?.length || 0} questions</p>
                    </button>
                  ))}
                </div>
              )}

              {quizzes.length === 0 && (
                <div className="p-4 text-center text-muted text-sm">
                  No quizzes yet. Generate one to test yourself!
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

          <div className={`absolute right-0 top-full mt-2 w-64 origin-top-right bg-glass rounded-lg shadow-theme-xl overflow-hidden z-50 transition-[opacity,transform] duration-150 ease-out-expo ${
            showHelp
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}>
              <div className="p-3">
                <p className="text-xs text-muted uppercase font-medium mb-3">Keyboard Shortcuts</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">Double click canvas</span>
                    <span className="text-xs text-muted">Add node</span>
                  </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay" onClick={() => setSelectedHint(null)}>
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

      {selectedQuiz && (
        <QuizModal quiz={selectedQuiz} onClose={() => setSelectedQuiz(null)} />
      )}
    </>
  );
};

const QuizModal = ({ quiz, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleSelectAnswer = (questionIndex, optionIndex) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length < totalQuestions) {
      toast.error(`Answer all ${totalQuestions} questions first`);
      return;
    }
    setShowResults(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct_index) {
        correct++;
      }
    });
    return { correct, total: totalQuestions };
  };

  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const selectedOption = selectedAnswers[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay" onClick={onClose}>
      <div className="bg-glass-strong rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-default">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-primary font-serif">Quiz</h2>
            <span className="text-xs text-muted">({currentIndex + 1}/{totalQuestions})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-md transition active:scale-[0.9] duration-150 ease-out-expo"
            aria-label="Close quiz"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh] custom-scrollbar">
          {!showResults ? (
            <div className="space-y-6">
              <p className="text-lg text-primary font-serif">{currentQuestion?.question}</p>
              <div className="space-y-3">
                {currentQuestion?.options?.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => handleSelectAnswer(currentIndex, optIndex)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-150 ease-out-expo ${
                      selectedOption === optIndex
                        ? "border-accent bg-accent-subtle"
                        : "border-default hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedOption === optIndex
                          ? "border-accent bg-accent"
                          : "border-muted"
                      }`}>
                        {selectedOption === optIndex && (
                          <div className="w-2 h-2 rounded-full bg-on-accent" />
                        )}
                      </div>
                      <span className="text-primary">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIndex) => {
                const userAnswer = selectedAnswers[qIndex];
                const correct = userAnswer === q.correct_index;
                return (
                  <div key={qIndex} className="p-4 rounded-lg border border-default">
                    <div className="flex items-start gap-2 mb-2">
                      {correct ? (
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-primary font-serif">{q.question}</p>
                    </div>
                    <div className="ml-7 space-y-1 text-sm">
                      <p className="text-muted">
                        Your answer: <span className={correct ? "text-success" : "text-destructive"}>{q.options?.[userAnswer]}</span>
                      </p>
                      {!correct && (
                        <p className="text-muted">
                          Correct answer: <span className="text-success">{q.options?.[q.correct_index]}</span>
                        </p>
                      )}
                      <p className="text-secondary text-xs mt-2">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-default text-center">
                {(() => {
                  const { correct, total } = calculateScore();
                  const percentage = Math.round((correct / total) * 100);
                  return (
                    <div>
                      <p className="text-2xl font-serif text-primary">
                        {correct}/{total}
                      </p>
                      <p className={`text-lg font-medium ${
                        percentage >= 80 ? "text-success" : percentage >= 60 ? "text-accent" : "text-destructive"
                      }`}>
                        {percentage}%
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {!showResults && (
          <div className="flex items-center justify-between p-4 border-t border-default">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-sm bg-elevated hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition"
            >
              Previous
            </button>
            {currentIndex === totalQuestions - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!isAnswered}
                className="px-6 py-2 text-sm bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition text-on-accent font-medium"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover rounded-md transition text-on-accent font-medium"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
