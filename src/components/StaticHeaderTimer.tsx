import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Timer as TimerIcon,
  Flame,
  Coffee,
  Clock,
  ChevronDown,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Flag,
  Settings2,
  X,
  Sparkles,
  Target,
} from 'lucide-react';
import { useStudyTimer, TimerMode, PomodoroStage } from '../context/StudyTimerContext';
import { useGoals } from '../context/GoalsContext';

interface StaticHeaderTimerProps {
  darkMode?: boolean;
  className?: string;
}

export const StaticHeaderTimer: React.FC<StaticHeaderTimerProps> = ({
  darkMode = false,
  className = '',
}) => {
  const {
    mode,
    isRunning,
    pomodoroStage,
    pomodoroCycle,
    timeLeft,
    totalDuration,
    stopwatchElapsedMs,
    laps,
    settings,
    completionNotice,
    clearCompletionNotice,
    togglePlayPause,
    reset,
    setMode,
    setPomodoroStage,
    adjustTime,
    setCountdownMinutes,
    setCustomDuration,
    recordLap,
    clearLaps,
    updateSettings,
    formatTime,
    formatStopwatch,
    selectedSubject,
    selectedGoalId,
    setSelectedSubject,
    setSelectedGoalId,
  } = useStudyTimer();

  const { activeGoals, getGoalById } = useGoals();
  const linkedGoal = selectedGoalId ? getGoalById(selectedGoalId) : undefined;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customH, setCustomH] = useState<number>(0);
  const [customM, setCustomM] = useState<number>(25);
  const [customS, setCustomS] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPopoverOpen]);

  // Calculate percentage for subtle progress bar
  const progressPercent = Math.max(
    0,
    Math.min(100, mode === 'stopwatch' ? 100 : totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0)
  );

  const activeColor =
    mode === 'pomodoro'
      ? pomodoroStage === 'focus'
        ? 'text-[#7F56D9] dark:text-purple-400'
        : 'text-emerald-600 dark:text-emerald-400'
      : mode === 'countdown'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-indigo-600 dark:text-indigo-400';

  const activeBg =
    mode === 'pomodoro'
      ? pomodoroStage === 'focus'
        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/80'
        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
      : mode === 'countdown'
      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80'
      : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80';

  const activeProgressBar =
    mode === 'pomodoro'
      ? pomodoroStage === 'focus'
        ? 'bg-[#7F56D9]'
        : 'bg-emerald-500'
      : mode === 'countdown'
      ? 'bg-amber-500'
      : 'bg-indigo-500';

  return (
    <div
      ref={containerRef}
      id="static-global-header-timer"
      className={`relative inline-flex items-center select-none ${className}`}
    >
      {/* The Static Header Pill */}
      <div
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-xl border shadow-2xs transition-all relative overflow-hidden ${
          darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-800'
        }`}
      >
        {/* Subtle bottom progress line */}
        {mode !== 'stopwatch' && (
          <div
            className="absolute bottom-0 left-0 h-[2.5px] transition-all duration-500 ease-linear rounded-b-xl"
            style={{
              width: `${progressPercent}%`,
              backgroundColor:
                mode === 'pomodoro'
                  ? pomodoroStage === 'focus'
                    ? '#7F56D9'
                    : '#10B981'
                  : '#F59E0B',
            }}
          />
        )}

        {/* Mode & Stage Icon & Label Toggle (Clicking opens popover) */}
        <button
          type="button"
          id="header-timer-mode-toggle-btn"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-90 ${activeBg}`}
          title="Change timer mode or duration"
        >
          {mode === 'pomodoro' ? (
            pomodoroStage === 'focus' ? (
              <Flame className="w-3.5 h-3.5 text-[#7F56D9] shrink-0" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )
          ) : mode === 'countdown' ? (
            <TimerIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          )}

          <span className={`text-[11px] font-bold ${activeColor}`}>
            {mode === 'pomodoro'
              ? pomodoroStage === 'focus'
                ? `Focus (${pomodoroCycle}/${settings.pomodoroCyclesBeforeLongBreak})`
                : 'Break'
              : mode === 'countdown'
              ? 'Timer'
              : 'Stopwatch'}
          </span>
          <ChevronDown className="w-3 h-3 text-gray-400 dark:text-zinc-500 shrink-0" />
        </button>

        {/* Digital Time Display */}
        <span
          id="header-timer-digits"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`font-mono font-bold text-xs sm:text-sm tracking-tight cursor-pointer px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
            isRunning ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-600 dark:text-zinc-400'
          }`}
          title="Click to configure timer"
        >
          {mode === 'stopwatch' ? formatStopwatch(stopwatchElapsedMs) : formatTime(timeLeft)}
        </span>

        {/* Quick Play / Pause Button */}
        <button
          type="button"
          id="header-timer-play-btn"
          onClick={togglePlayPause}
          className={`p-1 sm:p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
            isRunning
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
              : 'bg-[#7F56D9] text-white hover:bg-[#6941C6] shadow-2xs'
          }`}
          title={isRunning ? 'Pause Timer' : 'Start Timer'}
          aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
        >
          {isRunning ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Reset Button */}
        <button
          type="button"
          id="header-timer-reset-btn"
          onClick={reset}
          className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Reset Timer"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Completion Notification Banner / Toast */}
      {completionNotice && (
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-lg text-xs font-semibold whitespace-nowrap animate-in fade-in slide-in-from-top-2 ${
            darkMode
              ? 'bg-zinc-900 border-purple-800 text-purple-200'
              : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#7F56D9] shrink-0" />
          <span>{completionNotice}</span>
          <button
            onClick={clearCompletionNotice}
            className="p-0.5 rounded text-purple-400 hover:text-purple-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dropdown Floating Popover for Full Controls & Mode Switching */}
      {isPopoverOpen && (
        <div
          id="header-timer-dropdown-popover"
          className={`absolute top-full left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-80 sm:w-88 rounded-2xl border shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 ${
            darkMode
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
              : 'bg-white border-gray-200 text-gray-900 shadow-purple-500/5'
          }`}
        >
          {/* Header Row: Title & Close */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <TimerIcon className="w-4 h-4 text-[#7F56D9]" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Study Timer
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`p-1.5 rounded-lg border transition-colors ${
                  settings.soundEnabled
                    ? darkMode
                      ? 'border-zinc-700 text-amber-400 bg-zinc-800'
                      : 'border-gray-200 text-amber-600 bg-gray-50'
                    : 'border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
                title={settings.soundEnabled ? 'Chime sound enabled' : 'Chime sound muted'}
              >
                {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsPopoverOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Goal Link & Subject Selector */}
          <div className="my-2.5 p-2 rounded-xl border bg-gray-50/70 dark:bg-zinc-800/40 border-gray-200/80 dark:border-zinc-700/60 text-xs">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-[#7F56D9]" />
                <span>Linked Goal</span>
              </span>
              {linkedGoal && (
                <span className="text-[10px] font-semibold text-[#7F56D9] dark:text-purple-300">
                  {linkedGoal.currentProgress}/{linkedGoal.targetValue} {linkedGoal.unit}
                </span>
              )}
            </div>
            <select
              value={selectedGoalId || ''}
              onChange={(e) => {
                const gid = e.target.value;
                setSelectedGoalId(gid ? gid : null);
                const g = gid ? getGoalById(gid) : undefined;
                if (g && g.subject && g.subject !== 'All Subjects') {
                  setSelectedSubject(g.subject);
                }
              }}
              className={`w-full px-2 py-1 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#7F56D9] cursor-pointer ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="">Auto-link to daily/subject goal</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* 3 Main Mode Selectors */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-gray-100/70 dark:bg-zinc-800/60 border border-gray-200/80 dark:border-zinc-700/60 my-3">
            <button
              type="button"
              onClick={() => setMode('pomodoro')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'pomodoro'
                  ? 'bg-white dark:bg-zinc-700 text-[#7F56D9] dark:text-purple-300 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Pomodoro</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('countdown')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'countdown'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              <TimerIcon className="w-3 h-3" />
              <span>Countdown</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('stopwatch')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'stopwatch'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Stopwatch</span>
            </button>
          </div>

          {/* Mode-Specific Subcontrols */}
          {mode === 'pomodoro' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-1 p-1 rounded-lg bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPomodoroStage('focus')}
                  className={`flex-1 py-1 text-center rounded-md text-xs font-semibold transition-all ${
                    pomodoroStage === 'focus'
                      ? 'bg-[#7F56D9] text-white shadow-2xs'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  Focus ({settings.pomodoroFocusMinutes}m)
                </button>
                <button
                  type="button"
                  onClick={() => setPomodoroStage('short_break')}
                  className={`flex-1 py-1 text-center rounded-md text-xs font-semibold transition-all ${
                    pomodoroStage === 'short_break'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  Break ({settings.pomodoroShortBreakMinutes}m)
                </button>
                <button
                  type="button"
                  onClick={() => setPomodoroStage('long_break')}
                  className={`flex-1 py-1 text-center rounded-md text-xs font-semibold transition-all ${
                    pomodoroStage === 'long_break'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
                  }`}
                >
                  Long ({settings.pomodoroLongBreakMinutes}m)
                </button>
              </div>

              {/* Cycle progress dots */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 px-1">
                <span>Cycle {pomodoroCycle} of {settings.pomodoroCyclesBeforeLongBreak}</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: settings.pomodoroCyclesBeforeLongBreak }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i + 1 < pomodoroCycle
                          ? 'bg-[#7F56D9]'
                          : i + 1 === pomodoroCycle
                          ? 'bg-[#7F56D9] ring-2 ring-purple-300 dark:ring-purple-700'
                          : 'bg-gray-200 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'countdown' && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 block uppercase">
                Quick Presets:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCountdownMinutes(m)}
                    className={`py-1 rounded-lg text-xs font-semibold border transition-all ${
                      totalDuration === m * 60
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-gray-50 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-amber-300'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'stopwatch' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={!isRunning}
                  onClick={recordLap}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isRunning
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                      : 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Split Lap</span>
                </button>
                {laps.length > 0 && (
                  <button
                    type="button"
                    onClick={clearLaps}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Clear Laps ({laps.length})
                  </button>
                )}
              </div>

              {laps.length > 0 && (
                <div className="max-h-28 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800 text-xs font-mono rounded-lg border border-gray-100 dark:border-zinc-800">
                  {laps.slice(0, 5).map((lap) => (
                    <div key={lap.id} className="flex justify-between px-2.5 py-1 text-gray-600 dark:text-zinc-400">
                      <span>Lap {lap.id}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">+{formatStopwatch(lap.lapTimeMs)}</span>
                      <span className="text-gray-400">{formatStopwatch(lap.totalTimeMs)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Duration adjustments & Custom Duration button */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            {mode !== 'stopwatch' ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustTime(-60)}
                  className="px-2 py-1 rounded-md text-xs font-medium border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  title="Subtract 1 minute"
                >
                  -1m
                </button>
                <button
                  type="button"
                  onClick={() => adjustTime(60)}
                  className="px-2 py-1 rounded-md text-xs font-medium border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  title="Add 1 minute"
                >
                  +1m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomH(Math.floor(timeLeft / 3600));
                    setCustomM(Math.floor((timeLeft % 3600) / 60));
                    setCustomS(timeLeft % 60);
                    setShowCustomModal(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#7F56D9] dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Custom</span>
                </button>
              </div>
            ) : (
              <div />
            )}

            {/* Quick Play/Pause inside dropdown */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={reset}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={togglePlayPause}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs ${
                  isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#7F56D9] hover:bg-[#6941C6]'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Duration Modal */}
      {showCustomModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
          onClick={() => setShowCustomModal(false)}
        >
          <div
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
              darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-[#7F56D9]" />
                <span>Custom Duration</span>
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1 uppercase">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customH}
                  onChange={(e) => setCustomH(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className={`w-full text-center py-1.5 rounded-lg border font-mono font-bold text-base ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1 uppercase">Minutes</label>
                <input
                  type="number"
                  min="1"
                  max="59"
                  value={customM}
                  onChange={(e) => setCustomM(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-full text-center py-1.5 rounded-lg border font-mono font-bold text-base ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1 uppercase">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customS}
                  onChange={(e) => setCustomS(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-full text-center py-1.5 rounded-lg border font-mono font-bold text-base ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomDuration(customH, customM, customS);
                  setShowCustomModal(false);
                  setIsPopoverOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#7F56D9] text-white hover:bg-[#6941C6]"
              >
                Set Duration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaticHeaderTimer;
