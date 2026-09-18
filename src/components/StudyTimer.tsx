import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Timer as TimerIcon,
  Clock,
  Flame,
  Coffee,
  Flag,
  Volume2,
  VolumeX,
  Settings2,
  Plus,
  Minus,
  Sparkles,
  X,
  CheckCircle2,
  Target,
  BookOpen,
} from 'lucide-react';
import { useStudyTimer, TimerMode, PomodoroStage } from '../context/StudyTimerContext';
import { useGoals } from '../context/GoalsContext';

interface StudyTimerProps {
  darkMode?: boolean;
  compact?: boolean;
  className?: string;
  isStandalonePage?: boolean;
  subjects?: string[];
  onNavigateToGoals?: () => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({
  darkMode = false,
  compact = false,
  className = '',
  isStandalonePage = false,
  subjects = ['DBMS', 'Algorithms', 'Operating Systems', 'Mathematics', 'General'],
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
    completedSessionInfo,
    selectedSubject,
    selectedGoalId,
    clearCompletionNotice,
    closeCompletedSessionModal,
    startNextSessionAfterComplete,
    togglePlayPause,
    reset,
    finishCurrentSession,
    setMode,
    setPomodoroStage,
    adjustTime,
    setCountdownMinutes,
    setCustomDuration,
    setSelectedSubject,
    setSelectedGoalId,
    recordLap,
    clearLaps,
    updateSettings,
    formatTime,
    formatStopwatch,
  } = useStudyTimer();

  const { activeGoals, getGoalById } = useGoals();
  const linkedGoal = selectedGoalId ? getGoalById(selectedGoalId) : undefined;

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customH, setCustomH] = useState<number>(0);
  const [customM, setCustomM] = useState<number>(25);
  const [customS, setCustomS] = useState<number>(0);

  // Combine subjects with General and any custom subjects from active goals
  const availableSubjects = Array.from(
    new Set(['General', ...subjects, ...activeGoals.map((g) => g.subject).filter((s): s is string => !!s && s !== 'All Subjects')])
  );

  // Compute percentage progress for visual ring
  const progressPercent = Math.max(
    0,
    Math.min(100, mode === 'stopwatch' ? 100 : totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0)
  );

  // Elapsed time in current session
  const elapsedSeconds = mode === 'stopwatch' ? Math.floor(stopwatchElapsedMs / 1000) : Math.max(0, totalDuration - timeLeft);

  const handleApplyCustomDuration = () => {
    setCustomDuration(customH, customM, customS);
    setShowCustomModal(false);
  };

  const circumference = 2 * Math.PI * 135;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      id="study-timer-container"
      className={`max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 ${className}`}
    >
      {/* 1. Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#7F56D9] flex items-center justify-center">
              <TimerIcon className="w-5 h-5" />
            </span>
            Focus Study Timer
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Execution mode with automatic goal and subject progress sync
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl shadow-xs self-start md:self-auto">
          <button
            id="timer-mode-pomodoro"
            onClick={() => setMode('pomodoro')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'pomodoro'
                ? 'bg-white dark:bg-zinc-700 text-[#7F56D9] dark:text-purple-300 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Pomodoro
          </button>
          <button
            id="timer-mode-countdown"
            onClick={() => setMode('countdown')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'countdown'
                ? 'bg-white dark:bg-zinc-700 text-[#7F56D9] dark:text-purple-300 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Countdown
          </button>
          <button
            id="timer-mode-stopwatch"
            onClick={() => setMode('stopwatch')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'stopwatch'
                ? 'bg-white dark:bg-zinc-700 text-[#7F56D9] dark:text-purple-300 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TimerIcon className="w-3.5 h-3.5" />
            Stopwatch
          </button>
        </div>
      </div>

      {/* 2. Session Context Controls: Subject, Goal, Duration Presets */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                id="timer-subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#7F56D9]/30 transition-all cursor-pointer"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Goal Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Target Goal (Optional)
            </label>
            <div className="relative">
              <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
              <select
                id="timer-goal-select"
                value={selectedGoalId || ''}
                onChange={(e) => setSelectedGoalId(e.target.value ? e.target.value : null)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#7F56D9]/30 transition-all cursor-pointer truncate"
              >
                <option value="">No goal linked (General)</option>
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.subject || 'All Subjects'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration Presets (Pomodoro / Countdown) */}
          {mode !== 'stopwatch' ? (
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Duration Presets
              </label>
              <div className="flex items-center gap-1.5">
                {[15, 25, 45, 60].map((mins) => {
                  const isCurrent = Math.round(totalDuration / 60) === mins;
                  return (
                    <button
                      key={mins}
                      onClick={() => setCountdownMinutes(mins)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#7F56D9] text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
                  title="Set custom duration"
                >
                  Custom
                </button>
              </div>
            </div>
          ) : (
            <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-end">
              <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                Counting up elapsed study time
              </span>
            </div>
          )}
        </div>

        {/* Pomodoro Stage Sub-Bar */}
        {mode === 'pomodoro' && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPomodoroStage('focus')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  pomodoroStage === 'focus'
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-[#7F56D9] dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                Focus ({settings.pomodoroFocusMinutes}m)
              </button>
              <button
                onClick={() => setPomodoroStage('short_break')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  pomodoroStage === 'short_break'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                Short Break ({settings.pomodoroShortBreakMinutes}m)
              </button>
              <button
                onClick={() => setPomodoroStage('long_break')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  pomodoroStage === 'long_break'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200'
                }`}
              >
                Long Break ({settings.pomodoroLongBreakMinutes}m)
              </button>
            </div>

            <div className="text-xs font-bold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span>CYCLE {pomodoroCycle}/{settings.pomodoroCyclesBeforeLongBreak}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Running Session Status Pill/Banner */}
      {isRunning && (
        <div
          id="running-session-banner"
          className="bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7F56D9]"></span>
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              Active: <span className="text-[#7F56D9]">{selectedSubject}</span>
            </span>
            {linkedGoal && (
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-900/40 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                Goal: {linkedGoal.title}
              </span>
            )}
          </div>

          <div className="text-xs font-semibold text-gray-600 dark:text-zinc-400 flex items-center gap-3">
            <span>{formatTime(elapsedSeconds)} elapsed</span>
            {mode !== 'stopwatch' && <span>• {formatTime(timeLeft)} remaining</span>}
          </div>
        </div>
      )}

      {/* Completion Notice toast if triggered */}
      {completionNotice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{completionNotice}</span>
          </div>
          <button
            onClick={clearCompletionNotice}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Large Timer Display */}
      <div className="relative flex flex-col items-center justify-center py-6 md:py-10 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xs">
        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
          {/* Circular SVG Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
            {/* Background Track */}
            <circle
              cx="150"
              cy="150"
              r="135"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              className="text-gray-100 dark:text-zinc-800"
            />
            {/* Progress Arc */}
            <circle
              cx="150"
              cy="150"
              r="135"
              fill="transparent"
              stroke="#7F56D9"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* Central Digits & Labels */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight font-mono">
              {mode === 'stopwatch' ? formatStopwatch(stopwatchElapsedMs) : formatTime(timeLeft)}
            </span>

            <span className="mt-2 text-xs font-extrabold uppercase tracking-widest text-[#7F56D9] dark:text-purple-400">
              {mode === 'pomodoro'
                ? pomodoroStage === 'focus'
                  ? 'FOCUS'
                  : pomodoroStage === 'short_break'
                  ? 'SHORT BREAK'
                  : 'LONG BREAK'
                : mode.toUpperCase()}
            </span>

            {mode === 'pomodoro' && (
              <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wider">
                CYCLE {pomodoroCycle}/{settings.pomodoroCyclesBeforeLongBreak}
              </span>
            )}
          </div>
        </div>

        {/* Subtle quick adjust buttons when paused/not stopwatch */}
        {mode !== 'stopwatch' && !isRunning && (
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => adjustTime(-60)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
              title="Subtract 1 minute"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400 font-medium">Quick Adjust</span>
            <button
              onClick={() => adjustTime(60)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
              title="Add 1 minute"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 5. Primary Execution Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {/* Reset */}
          <button
            id="timer-reset-button"
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          {/* Start / Pause */}
          <button
            id="timer-play-pause-button"
            onClick={togglePlayPause}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#7F56D9] hover:bg-[#6941C6]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Start
              </>
            )}
          </button>

          {/* Finish / Stop Session early and log */}
          <button
            id="timer-finish-button"
            onClick={finishCurrentSession}
            disabled={!isRunning && elapsedSeconds < 15}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-xs ${
              isRunning || elapsedSeconds >= 15
                ? 'border-purple-300 dark:border-purple-700 text-[#7F56D9] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 cursor-pointer'
                : 'border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
            }`}
            title="Finish and record current session to goal"
          >
            <Square className="w-3.5 h-3.5" />
            Finish Session
          </button>

          {/* Lap for stopwatch */}
          {mode === 'stopwatch' && isRunning && (
            <button
              onClick={recordLap}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <Flag className="w-4 h-4" />
              Lap
            </button>
          )}

          {/* Settings */}
          <button
            id="timer-settings-button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            title="Timer Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Stopwatch Laps Table */}
        {mode === 'stopwatch' && laps.length > 0 && (
          <div className="w-full max-w-md mt-6 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Laps ({laps.length})</span>
              <button
                onClick={clearLaps}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Clear Laps
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
              {laps.map((lap) => (
                <div key={lap.id} className="flex justify-between px-3 py-1.5 font-mono">
                  <span className="text-gray-500">Lap {lap.id}</span>
                  <span className="text-gray-700 dark:text-zinc-300">{formatStopwatch(lap.lapTimeMs)}</span>
                  <span className="text-gray-400">{formatStopwatch(lap.totalTimeMs)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Session Complete Modal (Exact requested specification) */}
      {completedSessionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-[#7F56D9] mx-auto mb-3 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
              Session Complete
            </h2>

            <p className="text-sm font-bold text-[#7F56D9] mb-4">
              {completedSessionInfo.durationMinutes} minute{completedSessionInfo.durationMinutes !== 1 ? 's' : ''} focused
            </p>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/70 border border-gray-100 dark:border-zinc-800 text-xs text-left mb-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-zinc-400">Subject:</span>
                <span className="font-bold text-gray-900 dark:text-white">{completedSessionInfo.subject}</span>
              </div>
              {completedSessionInfo.goalTitle && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Goal:</span>
                  <span className="font-bold text-[#7F56D9] dark:text-purple-300">{completedSessionInfo.goalTitle}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-zinc-400">Session Type:</span>
                <span className="font-medium capitalize text-gray-800 dark:text-zinc-200">{completedSessionInfo.mode}</span>
              </div>
            </div>

            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-6 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Goal progress updated automatically.</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={closeCompletedSessionModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Done
              </button>
              <button
                onClick={startNextSessionAfterComplete}
                className="flex-1 py-2.5 rounded-xl bg-[#7F56D9] text-white text-xs font-bold hover:bg-[#6941C6] transition-all shadow-xs"
              >
                Start Another Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800 mb-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#7F56D9]" />
                Timer Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Focus Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={settings.pomodoroFocusMinutes}
                  onChange={(e) =>
                    updateSettings({ pomodoroFocusMinutes: Math.max(1, parseInt(e.target.value) || 25) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Short Break (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.pomodoroShortBreakMinutes}
                    onChange={(e) =>
                      updateSettings({ pomodoroShortBreakMinutes: Math.max(1, parseInt(e.target.value) || 5) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Long Break (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.pomodoroLongBreakMinutes}
                    onChange={(e) =>
                      updateSettings({ pomodoroLongBreakMinutes: Math.max(1, parseInt(e.target.value) || 15) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Cycles before Long Break
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={settings.pomodoroCyclesBeforeLongBreak}
                  onChange={(e) =>
                    updateSettings({ pomodoroCyclesBeforeLongBreak: Math.max(1, parseInt(e.target.value) || 4) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-700 dark:text-zinc-300">Play Chime Sound</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-[#7F56D9] focus:ring-[#7F56D9]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-gray-700 dark:text-zinc-300">Auto-Start Next Stage</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartNextPomodoro}
                    onChange={(e) => updateSettings({ autoStartNextPomodoro: e.target.checked })}
                    className="w-4 h-4 rounded text-[#7F56D9] focus:ring-[#7F56D9]"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#7F56D9] text-white text-xs font-bold hover:bg-[#6941C6] transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Custom Duration Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 shadow-2xl">
            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-3">Custom Timer Duration</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
              <div>
                <label className="block text-gray-500 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customH}
                  onChange={(e) => setCustomH(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customM}
                  onChange={(e) => setCustomM(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customS}
                  onChange={(e) => setCustomS(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-center font-bold"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2 rounded-lg border text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomDuration}
                className="flex-1 py-2 rounded-lg bg-[#7F56D9] text-white text-xs font-bold hover:bg-[#6941C6]"
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
