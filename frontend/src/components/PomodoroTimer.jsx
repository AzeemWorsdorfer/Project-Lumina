import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Play, Pause, RotateCcw, X, ChevronDown, Minimize2, Maximize2 } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  { name: "Focus", work: 25 * 60, break: 5 * 60 },
  { name: "Deep Work", work: 50 * 60, break: 10 * 60 },
];

const BREATHING_PHASE_DURATION = 3000;
const BREATHING_ROUNDS = 3;

export default function PomodoroTimer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [state, setState] = useState("idle");
  const [presetIndex, setPresetIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(PRESETS[0].work);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingRound, setBreathingRound] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const breathingIntervalRef = useRef(null);

  const currentPreset = PRESETS[presetIndex];
  const isBreak = state === "break";
  const isActive = state === "session" || state === "break" || state === "breathing";

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
      breathingIntervalRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    clearTimers();
    if (state === "session") {
      toast.success("Session complete! Time for a break.", {
        description: `${currentPreset.break / 60} minutes remaining.`,
      });
      setState("break");
      setTimeRemaining(currentPreset.break);
    } else if (state === "break") {
      toast.success("Break over! Ready for another session?", {
        description: "Click to start a new focus session.",
      });
      setState("idle");
      setTimeRemaining(currentPreset.work);
      setIsExpanded(false);
      setIsMinimized(false);
    }
  }, [state, currentPreset, clearTimers]);

  useEffect(() => {
    if ((state === "session" || state === "break") && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimers();
  }, [state, isPaused, handleComplete, clearTimers]);

  useEffect(() => {
    if (state === "breathing") {
      let phaseIndex = breathingPhase;
      let round = breathingRound;

      breathingIntervalRef.current = setInterval(() => {
        phaseIndex++;
        if (phaseIndex >= 4) {
          phaseIndex = 0;
          round++;
          if (round > BREATHING_ROUNDS) {
            clearTimers();
            setState("session");
            setTimeRemaining(currentPreset.work);
            return;
          }
          setBreathingRound(round);
        }
        setBreathingPhase(phaseIndex);
      }, BREATHING_PHASE_DURATION);
    }
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, clearTimers, currentPreset]);

  const startBreathing = () => {
    setBreathingPhase(0);
    setBreathingRound(1);
    setState("breathing");
    setIsExpanded(true);
  };

  const skipBreathing = () => {
    clearTimers();
    setState("session");
    setTimeRemaining(currentPreset.work);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const reset = () => {
    clearTimers();
    setState("idle");
    setTimeRemaining(currentPreset.work);
    setBreathingPhase(0);
    setBreathingRound(1);
    setIsPaused(false);
    setIsExpanded(false);
    setIsMinimized(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBreathingText = () => {
    const phases = ["Inhale", "Hold", "Exhale", "Hold"];
    return phases[breathingPhase];
  };

  const getBreathingAnimation = () => {
    switch (breathingPhase) {
      case 0: return "scale-inhale";
      case 1: return "scale-hold";
      case 2: return "scale-exhale";
      case 3: return "scale-hold";
      default: return "scale-hold";
    }
  };

  const handlePresetChange = (index) => {
    setPresetIndex(index);
    if (state === "idle") {
      setTimeRemaining(PRESETS[index].work);
    }
  };

  const totalTime = isBreak ? currentPreset.break : currentPreset.work;
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (state === "idle" && !isExpanded) {
    return (
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:bg-slate-700 transition-all duration-200 shadow-xl"
        >
          <Clock size={18} />
          <span className="text-sm font-medium">Start Focus</span>
        </button>
      </div>
    );
  }

  if (state === "breathing") {
    return (
      <div className="absolute top-4 right-4 z-40">
        <div
          onClick={skipBreathing}
          className="w-72 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl p-6 cursor-pointer select-none"
        >
          <div className="flex flex-col items-center">
            <p className="text-slate-400 text-sm mb-4">
              Tap to skip
            </p>
            
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <div className="breathing-ring" />
              <div className={`breathing-circle ${getBreathingAnimation()}`} />
              <span className="absolute text-2xl font-light text-slate-200 z-10">
                {getBreathingText()}
              </span>
            </div>
            
            <p className="text-slate-500 text-sm">
              Round {breathingRound} of {BREATHING_ROUNDS}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if ((isExpanded || isActive) && !isMinimized) {
    return (
      <div className="absolute top-4 right-4 z-40 w-72 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-xl">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <span className="font-medium text-slate-200">
                {isBreak ? "Break" : "Focus"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {(state === "session" || state === "break") && (
                <button
                  onClick={toggleMinimize}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Minimize2 size={16} />
                </button>
              )}
              <button
                onClick={reset}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <select
              value={presetIndex}
              onChange={(e) => handlePresetChange(Number(e.target.value))}
              disabled={state !== "idle"}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-md text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50"
            >
              {PRESETS.map((preset, index) => (
                <option key={preset.name} value={index}>
                  {preset.name} ({preset.work / 60}m / {preset.break / 60}m)
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-700"
              />
              <circle
                cx="64"
                cy="64"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-amber-500 transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-light text-slate-200">
                {formatTime(timeRemaining)}
              </span>
              {isPaused && (
                <span className="text-xs text-slate-500 mt-1">Paused</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {state === "idle" && (
              <button
                onClick={startBreathing}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                <Play size={18} />
                <span>Start</span>
              </button>
            )}
            {(state === "session" || state === "break") && (
              <>
                <button
                  onClick={togglePause}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button
                  onClick={reset}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if ((state === "session" || state === "break") && isMinimized) {
    return (
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={toggleMinimize}
          className="flex items-center gap-3 px-4 py-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-full text-slate-300 hover:bg-slate-700 transition-all duration-200 shadow-xl"
        >
          <Clock size={16} className={isBreak ? "text-emerald-400" : "text-amber-500"} />
          <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
          <Maximize2 size={14} className="text-slate-500" />
        </button>
      </div>
    );
  }

  return null;
}
