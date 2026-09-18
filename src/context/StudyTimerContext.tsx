import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { playChimeSound } from '../utils/timerAudio';
import { useGoals } from './GoalsContext';

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';
export type PomodoroStage = 'focus' | 'short_break' | 'long_break';

export interface LapItem {
  id: number;
  lapTimeMs: number;
  totalTimeMs: number;
}

export interface TimerSettings {
  pomodoroFocusMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroCyclesBeforeLongBreak: number;
  countdownMinutes: number;
  soundEnabled: boolean;
  autoStartNextPomodoro: boolean;
}

export interface CompletedSessionInfo {
  durationMinutes: number;
  subject: string;
  goalTitle?: string;
  mode: TimerMode;
  stage?: PomodoroStage;
}

interface ActiveTimerPersistedState {
  mode: TimerMode;
  isRunning: boolean;
  pomodoroStage: PomodoroStage;
  pomodoroCycle: number;
  targetEndTime: number | null;
  sessionStartTime: number;
  sessionPlannedSeconds: number;
  pausedTimeLeft: number;
  totalDuration: number;
  selectedSubject: string;
  selectedGoalId: string | null;
  stopwatchRunning: boolean;
  stopwatchStartTime: number | null;
  stopwatchAccumulatedMs: number;
  savedAt: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  pomodoroFocusMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  pomodoroCyclesBeforeLongBreak: 4,
  countdownMinutes: 20,
  soundEnabled: true,
  autoStartNextPomodoro: false,
};

const TIMER_SETTINGS_KEY = 'ns_global_timer_settings';
const ACTIVE_TIMER_KEY = 'ns_active_timer_state';

interface StudyTimerContextType {
  mode: TimerMode;
  isRunning: boolean;
  pomodoroStage: PomodoroStage;
  pomodoroCycle: number;
  timeLeft: number;
  totalDuration: number;
  stopwatchElapsedMs: number;
  laps: LapItem[];
  settings: TimerSettings;
  completionNotice: string | null;
  completedSessionInfo: CompletedSessionInfo | null;
  selectedSubject: string;
  selectedGoalId: string | null;
  clearCompletionNotice: () => void;
  closeCompletedSessionModal: () => void;
  startNextSessionAfterComplete: () => void;
  togglePlayPause: () => void;
  reset: () => void;
  finishCurrentSession: () => void;
  setMode: (mode: TimerMode) => void;
  setPomodoroStage: (stage: PomodoroStage) => void;
  adjustTime: (deltaSeconds: number) => void;
  setCountdownMinutes: (minutes: number) => void;
  setCustomDuration: (hours: number, minutes: number, seconds: number) => void;
  setSelectedSubject: (subject: string) => void;
  setSelectedGoalId: (goalId: string | null) => void;
  startSessionForGoal: (params: {
    goalId: string;
    subject?: string;
    durationMinutes?: number;
    autoStart?: boolean;
  }) => void;
  recordLap: () => void;
  clearLaps: () => void;
  updateSettings: (partial: Partial<TimerSettings>) => void;
  formatTime: (seconds: number) => string;
  formatStopwatch: (ms: number) => string;
  logCurrentSessionToGoals?: (customMinutes?: number) => void;
}

const StudyTimerContext = createContext<StudyTimerContextType | undefined>(undefined);

export const StudyTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { recordCompletedSession, getGoalById } = useGoals();

  const [settings, setSettings] = useState<TimerSettings>(() => {
    try {
      const saved = localStorage.getItem(TIMER_SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const getStageDuration = useCallback((stage: PomodoroStage, s: TimerSettings = settings): number => {
    if (stage === 'focus') return Math.max(1, s.pomodoroFocusMinutes) * 60;
    if (stage === 'short_break') return Math.max(1, s.pomodoroShortBreakMinutes) * 60;
    return Math.max(1, s.pomodoroLongBreakMinutes) * 60;
  }, [settings]);

  // Load saved active timer state on initial mount
  const initialActiveState = useMemo<ActiveTimerPersistedState | null>(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const [mode, setModeState] = useState<TimerMode>(() => initialActiveState?.mode ?? 'pomodoro');
  const [pomodoroStage, setPomodoroStageState] = useState<PomodoroStage>(() => initialActiveState?.pomodoroStage ?? 'focus');
  const [pomodoroCycle, setPomodoroCycle] = useState<number>(() => initialActiveState?.pomodoroCycle ?? 1);
  const [selectedSubject, setSelectedSubject] = useState<string>(() => initialActiveState?.selectedSubject ?? 'General');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(() => initialActiveState?.selectedGoalId ?? null);

  // Derive initial timer values safely
  const initialValues = useMemo(() => {
    const defaultFocusSecs = settings.pomodoroFocusMinutes * 60;
    const defaultCountdownSecs = settings.countdownMinutes * 60;

    if (!initialActiveState) {
      return {
        isRunning: false,
        timeLeft: defaultFocusSecs,
        totalDuration: defaultFocusSecs,
        sessionPlanned: defaultFocusSecs,
        targetEndTime: 0,
        stopwatchRunning: false,
        stopwatchElapsed: 0,
      };
    }

    if (initialActiveState.mode === 'stopwatch') {
      let elapsed = initialActiveState.stopwatchAccumulatedMs || 0;
      if (initialActiveState.stopwatchRunning && initialActiveState.stopwatchStartTime) {
        elapsed += Math.max(0, Date.now() - initialActiveState.stopwatchStartTime);
      }
      return {
        isRunning: initialActiveState.stopwatchRunning,
        timeLeft: 0,
        totalDuration: 0,
        sessionPlanned: 0,
        targetEndTime: 0,
        stopwatchRunning: initialActiveState.stopwatchRunning,
        stopwatchElapsed: elapsed,
      };
    }

    // Pomodoro or Countdown
    const baseDuration =
      initialActiveState.mode === 'pomodoro'
        ? (initialActiveState.pomodoroStage === 'focus'
            ? defaultFocusSecs
            : initialActiveState.pomodoroStage === 'short_break'
            ? settings.pomodoroShortBreakMinutes * 60
            : settings.pomodoroLongBreakMinutes * 60)
        : defaultCountdownSecs;

    const planned = initialActiveState.sessionPlannedSeconds > 0 ? initialActiveState.sessionPlannedSeconds : baseDuration;
    const total = initialActiveState.totalDuration > 0 ? initialActiveState.totalDuration : planned;

    if (initialActiveState.isRunning && initialActiveState.targetEndTime) {
      const now = Date.now();
      const remaining = Math.ceil((initialActiveState.targetEndTime - now) / 1000);
      if (remaining > 0) {
        return {
          isRunning: true,
          timeLeft: remaining,
          totalDuration: total,
          sessionPlanned: planned,
          targetEndTime: initialActiveState.targetEndTime,
          stopwatchRunning: false,
          stopwatchElapsed: 0,
        };
      }
      // Finished while tab was closed: reset safely to planned duration instead of leaving at 0
      return {
        isRunning: false,
        timeLeft: planned,
        totalDuration: total,
        sessionPlanned: planned,
        targetEndTime: 0,
        stopwatchRunning: false,
        stopwatchElapsed: 0,
      };
    }

    // Paused state
    const pausedLeft = initialActiveState.pausedTimeLeft;
    const safeLeft = typeof pausedLeft === 'number' && pausedLeft > 0 ? pausedLeft : planned;
    return {
      isRunning: false,
      timeLeft: safeLeft,
      totalDuration: total,
      sessionPlanned: planned,
      targetEndTime: 0,
      stopwatchRunning: false,
      stopwatchElapsed: 0,
    };
  }, [settings, initialActiveState]);

  const [isRunning, setIsRunning] = useState<boolean>(() => initialValues.isRunning);
  const [timeLeft, setTimeLeft] = useState<number>(() => initialValues.timeLeft);
  const [totalDuration, setTotalDuration] = useState<number>(() => initialValues.totalDuration);
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState<number>(() => initialValues.stopwatchElapsed);
  const [laps, setLaps] = useState<LapItem[]>([]);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);
  const [completedSessionInfo, setCompletedSessionInfo] = useState<CompletedSessionInfo | null>(null);

  // Precision tracking refs to completely eliminate timer drift and state lag
  const targetEndTimeRef = useRef<number>(initialValues.targetEndTime);
  const sessionStartTimeRef = useRef<number>(initialActiveState?.sessionStartTime || 0);
  const sessionPlannedSecondsRef = useRef<number>(initialValues.sessionPlanned);

  // Stopwatch high-resolution refs
  const stopwatchBasePerfRef = useRef<number>(0);
  const stopwatchAccumulatedRef = useRef<number>(initialValues.stopwatchElapsed);
  const lastLapTimeRef = useRef<number>(0);

  // Synchronous state mirror refs for event callbacks & background tabs
  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;
  const modeRef = useRef<TimerMode>(mode);
  modeRef.current = mode;
  const timeLeftRef = useRef<number>(timeLeft);
  timeLeftRef.current = timeLeft;
  const pomodoroStageRef = useRef<PomodoroStage>(pomodoroStage);
  pomodoroStageRef.current = pomodoroStage;
  const pomodoroCycleRef = useRef<number>(pomodoroCycle);
  pomodoroCycleRef.current = pomodoroCycle;
  const selectedSubjectRef = useRef<string>(selectedSubject);
  selectedSubjectRef.current = selectedSubject;
  const selectedGoalIdRef = useRef<string | null>(selectedGoalId);
  selectedGoalIdRef.current = selectedGoalId;
  const totalDurationRef = useRef<number>(totalDuration);
  totalDurationRef.current = totalDuration;
  const settingsRef = useRef<TimerSettings>(settings);
  settingsRef.current = settings;

  const updateSettings = useCallback((partial: Partial<TimerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Timer settings storage error:', e);
      }
      return updated;
    });
  }, []);

  // Persist active timer state on discrete lifecycle events (safe, throttled, never at 50Hz)
  const saveActiveState = useCallback(() => {
    try {
      const currentIsRunning = isRunningRef.current;
      const currentMode = modeRef.current;
      const stateToSave: ActiveTimerPersistedState = {
        mode: currentMode,
        isRunning: currentIsRunning,
        pomodoroStage: pomodoroStageRef.current,
        pomodoroCycle: pomodoroCycleRef.current,
        targetEndTime: currentIsRunning && currentMode !== 'stopwatch' ? targetEndTimeRef.current : null,
        sessionStartTime: sessionStartTimeRef.current,
        sessionPlannedSeconds: sessionPlannedSecondsRef.current,
        pausedTimeLeft: timeLeftRef.current,
        totalDuration: totalDurationRef.current,
        selectedSubject: selectedSubjectRef.current,
        selectedGoalId: selectedGoalIdRef.current,
        stopwatchRunning: currentIsRunning && currentMode === 'stopwatch',
        stopwatchStartTime: currentIsRunning && currentMode === 'stopwatch' ? Date.now() : null,
        stopwatchAccumulatedMs: stopwatchAccumulatedRef.current,
        savedAt: Date.now(),
      };
      localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to persist active timer state:', e);
    }
  }, []);

  // Persist when core session parameters change
  useEffect(() => {
    saveActiveState();
  }, [isRunning, mode, pomodoroStage, pomodoroCycle, selectedSubject, selectedGoalId, saveActiveState]);

  // Handle window unload to ensure active timer state is always preserved
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveActiveState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveActiveState]);

  const clearCompletionNotice = useCallback(() => setCompletionNotice(null), []);
  const closeCompletedSessionModal = useCallback(() => setCompletedSessionInfo(null), []);

  // Handle natural timer finish
  const handleNaturalTimerFinish = useCallback(() => {
    const currentMode = modeRef.current;
    const currentStage = pomodoroStageRef.current;
    const currentCycle = pomodoroCycleRef.current;
    const currentSubject = selectedSubjectRef.current;
    const currentGoalId = selectedGoalIdRef.current;
    const currentSettings = settingsRef.current;

    const planned = sessionPlannedSecondsRef.current || (currentMode === 'pomodoro' ? getStageDuration(currentStage) : currentSettings.countdownMinutes * 60);
    const completedMinutes = Math.max(1, Math.round((planned / 60) * 10) / 10);
    const now = Date.now();
    const startTime = sessionStartTimeRef.current || now - planned * 1000;

    if (currentSettings.soundEnabled) {
      playChimeSound();
    }

    if (currentMode === 'pomodoro') {
      if (currentStage === 'focus') {
        recordCompletedSession({
          subjectId: currentSubject,
          goalId: currentGoalId,
          sessionType: 'pomodoro',
          startTime,
          endTime: now,
          duration: planned,
          durationMinutes: completedMinutes,
        });

        const linkedGoal = currentGoalId ? getGoalById(currentGoalId) : undefined;
        setCompletedSessionInfo({
          durationMinutes: completedMinutes,
          subject: currentSubject,
          goalTitle: linkedGoal ? linkedGoal.title : undefined,
          mode: 'pomodoro',
          stage: 'focus',
        });
      }

      let nextStage: PomodoroStage = 'short_break';
      let nextCycle = currentCycle;

      if (currentStage === 'focus') {
        if (currentCycle >= currentSettings.pomodoroCyclesBeforeLongBreak) {
          nextStage = 'long_break';
          nextCycle = 1;
          setCompletionNotice(`🎉 Focus completed (${completedMinutes}m logged to goal)! Finished ${currentSettings.pomodoroCyclesBeforeLongBreak} cycles.`);
        } else {
          nextStage = 'short_break';
          nextCycle = currentCycle + 1;
          setCompletionNotice(`✨ Focus complete (${completedMinutes}m logged to goal)! Take a quick break.`);
        }
      } else {
        nextStage = 'focus';
        setCompletionNotice(`💪 Break finished! Ready for the next focus session.`);
      }

      setPomodoroStageState(nextStage);
      setPomodoroCycle(nextCycle);
      const nextDur = getStageDuration(nextStage);
      setTimeLeft(nextDur);
      setTotalDuration(nextDur);
      sessionPlannedSecondsRef.current = nextDur;

      if (!currentSettings.autoStartNextPomodoro) {
        setIsRunning(false);
        targetEndTimeRef.current = 0;
        sessionStartTimeRef.current = 0;
      } else {
        targetEndTimeRef.current = Date.now() + nextDur * 1000;
        sessionStartTimeRef.current = Date.now();
        setIsRunning(true);
      }
    } else if (currentMode === 'countdown') {
      setIsRunning(false);
      targetEndTimeRef.current = 0;
      sessionStartTimeRef.current = 0;

      recordCompletedSession({
        subjectId: currentSubject,
        goalId: currentGoalId,
        sessionType: 'countdown',
        startTime,
        endTime: now,
        duration: planned,
        durationMinutes: completedMinutes,
      });

      const linkedGoal = currentGoalId ? getGoalById(currentGoalId) : undefined;
      setCompletedSessionInfo({
        durationMinutes: completedMinutes,
        subject: currentSubject,
        goalTitle: linkedGoal ? linkedGoal.title : undefined,
        mode: 'countdown',
      });

      setCompletionNotice(`🏁 Countdown complete (${completedMinutes}m study logged)!`);
      const resetDur = currentSettings.countdownMinutes * 60;
      setTimeLeft(resetDur);
      setTotalDuration(resetDur);
      sessionPlannedSecondsRef.current = resetDur;
    }
  }, [getStageDuration, getGoalById, recordCompletedSession]);

  // Keep a ref to handleNaturalTimerFinish so the interval loop NEVER tears down due to callback references
  const handleNaturalTimerFinishRef = useRef(handleNaturalTimerFinish);
  handleNaturalTimerFinishRef.current = handleNaturalTimerFinish;

  // Finish current session early and log progress
  const finishCurrentSession = useCallback(() => {
    const currentMode = modeRef.current;
    let elapsedSeconds = 0;
    let elapsedMinutes = 0;

    if (currentMode === 'stopwatch') {
      const now = performance.now();
      let totalMs = stopwatchAccumulatedRef.current;
      if (isRunningRef.current && stopwatchBasePerfRef.current > 0) {
        totalMs += Math.max(0, now - stopwatchBasePerfRef.current);
      }
      elapsedSeconds = Math.floor(totalMs / 1000);
      elapsedMinutes = Math.round((totalMs / 60000) * 10) / 10;
    } else {
      const planned = sessionPlannedSecondsRef.current;
      const currentLeft = timeLeftRef.current;
      elapsedSeconds = Math.max(0, planned - currentLeft);
      elapsedMinutes = Math.round((elapsedSeconds / 60) * 10) / 10;
    }

    setIsRunning(false);
    targetEndTimeRef.current = 0;

    // Only record if at least 15 seconds of focused study
    if (elapsedSeconds >= 15 || elapsedMinutes >= 0.25) {
      const finalMins = Math.max(1, Math.round(elapsedMinutes));
      const now = Date.now();
      const startTime = sessionStartTimeRef.current || now - elapsedSeconds * 1000;

      recordCompletedSession({
        subjectId: selectedSubjectRef.current,
        goalId: selectedGoalIdRef.current,
        sessionType: currentMode,
        startTime,
        endTime: now,
        duration: elapsedSeconds,
        durationMinutes: finalMins,
      });

      const linkedGoal = selectedGoalIdRef.current ? getGoalById(selectedGoalIdRef.current) : undefined;
      setCompletedSessionInfo({
        durationMinutes: finalMins,
        subject: selectedSubjectRef.current,
        goalTitle: linkedGoal ? linkedGoal.title : undefined,
        mode: currentMode,
        stage: currentMode === 'pomodoro' ? pomodoroStageRef.current : undefined,
      });

      if (settingsRef.current.soundEnabled) {
        playChimeSound();
      }
    }

    // Reset current timer values for the next round
    if (currentMode === 'stopwatch') {
      setStopwatchElapsedMs(0);
      stopwatchAccumulatedRef.current = 0;
      lastLapTimeRef.current = 0;
      setLaps([]);
    } else if (currentMode === 'pomodoro') {
      const dur = getStageDuration(pomodoroStageRef.current);
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
    } else {
      const dur = settingsRef.current.countdownMinutes * 60;
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
    }
    sessionStartTimeRef.current = 0;
  }, [getStageDuration, getGoalById, recordCompletedSession]);

  // Mode switching
  const setMode = useCallback((newMode: TimerMode) => {
    if (newMode === modeRef.current) return;
    setIsRunning(false);
    targetEndTimeRef.current = 0;
    sessionStartTimeRef.current = 0;
    setModeState(newMode);

    if (newMode === 'pomodoro') {
      const dur = getStageDuration(pomodoroStageRef.current);
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
    } else if (newMode === 'countdown') {
      const dur = settingsRef.current.countdownMinutes * 60;
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
    } else if (newMode === 'stopwatch') {
      setStopwatchElapsedMs(0);
      stopwatchAccumulatedRef.current = 0;
      lastLapTimeRef.current = 0;
      setLaps([]);
    }
  }, [getStageDuration]);

  // Pomodoro stage switching
  const setPomodoroStage = useCallback((newStage: PomodoroStage) => {
    setIsRunning(false);
    targetEndTimeRef.current = 0;
    sessionStartTimeRef.current = 0;
    setPomodoroStageState(newStage);
    const dur = getStageDuration(newStage);
    setTimeLeft(dur);
    setTotalDuration(dur);
    sessionPlannedSecondsRef.current = dur;
  }, [getStageDuration]);

  // Start next session directly after completion modal
  const startNextSessionAfterComplete = useCallback(() => {
    setCompletedSessionInfo(null);
    const currentMode = modeRef.current;
    if (currentMode === 'pomodoro') {
      const dur = getStageDuration(pomodoroStageRef.current);
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
      targetEndTimeRef.current = Date.now() + dur * 1000;
      sessionStartTimeRef.current = Date.now();
      setIsRunning(true);
    } else if (currentMode === 'countdown') {
      const dur = settingsRef.current.countdownMinutes * 60;
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
      targetEndTimeRef.current = Date.now() + dur * 1000;
      sessionStartTimeRef.current = Date.now();
      setIsRunning(true);
    }
  }, [getStageDuration]);

  // Direct goal focus session launcher
  const startSessionForGoal = useCallback(
    ({
      goalId,
      subject,
      durationMinutes = 25,
      autoStart = true,
    }: {
      goalId: string;
      subject?: string;
      durationMinutes?: number;
      autoStart?: boolean;
    }) => {
      setSelectedGoalId(goalId);
      if (subject && subject !== 'All Subjects') {
        setSelectedSubject(subject);
      }
      setModeState('pomodoro');
      setPomodoroStageState('focus');

      const dur = Math.max(1, durationMinutes) * 60;
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;

      if (autoStart) {
        targetEndTimeRef.current = Date.now() + dur * 1000;
        sessionStartTimeRef.current = Date.now();
        setIsRunning(true);
      } else {
        setIsRunning(false);
        targetEndTimeRef.current = 0;
        sessionStartTimeRef.current = 0;
      }
      setCompletionNotice(null);
      setCompletedSessionInfo(null);
    },
    []
  );

  // Play / Pause toggle
  const togglePlayPause = useCallback(() => {
    if (isRunningRef.current) {
      // PAUSE ACTION
      if (modeRef.current === 'stopwatch') {
        const now = performance.now();
        if (stopwatchBasePerfRef.current > 0) {
          stopwatchAccumulatedRef.current += Math.max(0, now - stopwatchBasePerfRef.current);
        }
        setStopwatchElapsedMs(stopwatchAccumulatedRef.current);
      } else {
        if (targetEndTimeRef.current > 0) {
          const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
        targetEndTimeRef.current = 0;
      }
      setIsRunning(false);
    } else {
      // PLAY ACTION
      if (modeRef.current === 'stopwatch') {
        stopwatchBasePerfRef.current = performance.now();
        setIsRunning(true);
      } else {
        const currentLeft = timeLeftRef.current;
        let startSecs = currentLeft;

        // If timer was at 0 or uninitialized, recharge to full valid duration!
        if (startSecs <= 0) {
          startSecs =
            modeRef.current === 'pomodoro'
              ? getStageDuration(pomodoroStageRef.current)
              : totalDuration > 0
              ? totalDuration
              : settingsRef.current.countdownMinutes * 60;
          setTimeLeft(startSecs);
          setTotalDuration(startSecs);
        }

        sessionPlannedSecondsRef.current = totalDuration > 0 ? totalDuration : startSecs;
        targetEndTimeRef.current = Date.now() + startSecs * 1000;
        if (!sessionStartTimeRef.current) {
          sessionStartTimeRef.current = Date.now();
        }
        setIsRunning(true);
      }
      setCompletionNotice(null);
    }
  }, [totalDuration, getStageDuration]);

  // Reset timer
  const reset = useCallback(() => {
    setIsRunning(false);
    setCompletionNotice(null);
    targetEndTimeRef.current = 0;
    sessionStartTimeRef.current = 0;

    const currentMode = modeRef.current;
    if (currentMode === 'stopwatch') {
      setStopwatchElapsedMs(0);
      stopwatchAccumulatedRef.current = 0;
      lastLapTimeRef.current = 0;
      setLaps([]);
    } else if (currentMode === 'pomodoro') {
      const dur = getStageDuration(pomodoroStageRef.current);
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
    } else {
      const dur = settingsRef.current.countdownMinutes * 60;
      setTimeLeft(dur);
      setTotalDuration(dur);
      sessionPlannedSecondsRef.current = dur;
    }
  }, [getStageDuration]);

  // Quick adjust (+/- delta seconds)
  const adjustTime = useCallback((deltaSeconds: number) => {
    if (modeRef.current === 'stopwatch') return;

    setTimeLeft((prev) => {
      const next = Math.max(10, prev + deltaSeconds);
      setTotalDuration((td) => Math.max(next, td + deltaSeconds));
      sessionPlannedSecondsRef.current = next;
      if (isRunningRef.current) {
        targetEndTimeRef.current = Date.now() + next * 1000;
      }
      return next;
    });
  }, []);

  const setCountdownMinutes = useCallback((minutes: number) => {
    setIsRunning(false);
    const secs = Math.max(1, minutes) * 60;
    setTimeLeft(secs);
    setTotalDuration(secs);
    sessionPlannedSecondsRef.current = secs;
    targetEndTimeRef.current = 0;
    sessionStartTimeRef.current = 0;

    if (modeRef.current === 'pomodoro') {
      const currentStage = pomodoroStageRef.current;
      if (currentStage === 'focus') {
        updateSettings({ pomodoroFocusMinutes: minutes });
      } else if (currentStage === 'short_break') {
        updateSettings({ pomodoroShortBreakMinutes: minutes });
      } else {
        updateSettings({ pomodoroLongBreakMinutes: minutes });
      }
    } else {
      updateSettings({ countdownMinutes: minutes });
    }
  }, [updateSettings]);

  const setCustomDuration = useCallback((hours: number, minutes: number, seconds: number) => {
    const totalSecs = Math.max(10, hours * 3600 + minutes * 60 + seconds);
    setIsRunning(false);
    sessionPlannedSecondsRef.current = totalSecs;
    targetEndTimeRef.current = 0;
    sessionStartTimeRef.current = 0;

    const currentMode = modeRef.current;
    if (currentMode === 'countdown') {
      setTimeLeft(totalSecs);
      setTotalDuration(totalSecs);
      updateSettings({ countdownMinutes: Math.max(1, Math.round(totalSecs / 60)) });
    } else if (currentMode === 'pomodoro') {
      const currentStage = pomodoroStageRef.current;
      const mins = Math.max(1, Math.round(totalSecs / 60));
      if (currentStage === 'focus') {
        updateSettings({ pomodoroFocusMinutes: mins });
      } else if (currentStage === 'short_break') {
        updateSettings({ pomodoroShortBreakMinutes: mins });
      } else {
        updateSettings({ pomodoroLongBreakMinutes: mins });
      }
      setTimeLeft(totalSecs);
      setTotalDuration(totalSecs);
    }
  }, [updateSettings]);

  const recordLap = useCallback(() => {
    if (modeRef.current !== 'stopwatch' || !isRunningRef.current) return;
    const now = performance.now();
    let currentTotal = stopwatchAccumulatedRef.current;
    if (stopwatchBasePerfRef.current > 0) {
      currentTotal += Math.max(0, now - stopwatchBasePerfRef.current);
    }
    const lapTime = Math.max(0, currentTotal - lastLapTimeRef.current);
    lastLapTimeRef.current = currentTotal;

    setLaps((prev) => [
      {
        id: prev.length + 1,
        lapTimeMs: lapTime,
        totalTimeMs: currentTotal,
      },
      ...prev,
    ]);
  }, []);

  const clearLaps = useCallback(() => {
    setLaps([]);
    lastLapTimeRef.current = 0;
  }, []);

  // Format helpers
  const formatTime = useCallback((totalSeconds: number): string => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, []);

  const formatStopwatch = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const centis = Math.floor((ms % 1000) / 10);
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(mins)}:${pad(secs)}.${pad(centis)}`;
    }
    return `${pad(mins)}:${pad(secs)}.${pad(centis)}`;
  }, []);

  const logCurrentSessionToGoals = useCallback((_customMinutes?: number) => {
    finishCurrentSession();
  }, [finishCurrentSession]);

  // MAIN RUNNING INTERVAL EFFECT
  // DEPENDS STRICTLY ON isRunning AND mode - never on timeLeft or callbacks!
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    if (mode === 'stopwatch') {
      stopwatchBasePerfRef.current = performance.now();
      const intervalId = window.setInterval(() => {
        const now = performance.now();
        const delta = Math.max(0, now - stopwatchBasePerfRef.current);
        setStopwatchElapsedMs(stopwatchAccumulatedRef.current + delta);
      }, 50);

      return () => {
        clearInterval(intervalId);
      };
    }

    // Countdown / Pomodoro
    // Ensure targetEndTimeRef is set in future
    if (!targetEndTimeRef.current || targetEndTimeRef.current <= Date.now()) {
      const currentLeft = timeLeftRef.current;
      const safeSecs =
        currentLeft > 0
          ? currentLeft
          : mode === 'pomodoro'
          ? getStageDuration(pomodoroStageRef.current)
          : settingsRef.current.countdownMinutes * 60;
      targetEndTimeRef.current = Date.now() + safeSecs * 1000;
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
    }

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const target = targetEndTimeRef.current;
      if (!target) return;

      const remaining = Math.max(0, Math.ceil((target - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalId);
        handleNaturalTimerFinishRef.current();
      }
    }, 250);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, mode, getStageDuration]);

  // TAB VISIBILITY & WINDOW FOCUS SYNCHRONIZATION
  // Guarantees zero-lag sync when switching browser tabs or waking device from sleep
  useEffect(() => {
    const handleSync = () => {
      if (!isRunningRef.current) return;

      if (modeRef.current === 'stopwatch') {
        const now = performance.now();
        if (stopwatchBasePerfRef.current > 0) {
          const delta = Math.max(0, now - stopwatchBasePerfRef.current);
          setStopwatchElapsedMs(stopwatchAccumulatedRef.current + delta);
        }
        return;
      }

      const target = targetEndTimeRef.current;
      if (target > 0) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((target - now) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          handleNaturalTimerFinishRef.current();
        }
      }
    };

    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
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
      startSessionForGoal,
      recordLap,
      clearLaps,
      updateSettings,
      formatTime,
      formatStopwatch,
      logCurrentSessionToGoals,
    }),
    [
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
      startSessionForGoal,
      recordLap,
      clearLaps,
      updateSettings,
      formatTime,
      formatStopwatch,
      logCurrentSessionToGoals,
    ]
  );

  return (
    <StudyTimerContext.Provider value={contextValue}>
      {children}
    </StudyTimerContext.Provider>
  );
};

export const useStudyTimer = (): StudyTimerContextType => {
  const ctx = useContext(StudyTimerContext);
  if (!ctx) {
    throw new Error('useStudyTimer must be used within a StudyTimerProvider');
  }
  return ctx;
};
export default StudyTimerProvider;
