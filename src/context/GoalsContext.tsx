import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { GoalItem, SubGoalItem, GoalSessionLog, GoalType, GoalCadence, StudySession } from '../types';
import { loadGoalsFromStorage, saveGoalsToStorage, GOALS_STORAGE_KEY } from '../utils/goalsStorage';
import { loadSessionsFromStorage, saveSessionsToStorage, SESSIONS_STORAGE_KEY } from '../utils/sessionsStorage';

interface GoalsContextType {
  goals: GoalItem[];
  sessions: StudySession[];
  activeGoals: GoalItem[];
  completedGoals: GoalItem[];
  dailyGoals: GoalItem[];
  weeklyGoals: GoalItem[];
  overdueGoals: GoalItem[];
  todayStudyMinutes: number;
  weeklyStudyMinutes: number;
  addGoal: (goalData: Omit<GoalItem, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'currentProgress'> & { currentProgress?: number; completed?: boolean }) => GoalItem;
  updateGoal: (id: string, updates: Partial<GoalItem>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalComplete: (id: string) => void;
  toggleSubGoal: (goalId: string, subGoalId: string) => void;
  addSubGoal: (goalId: string, title: string) => void;
  removeSubGoal: (goalId: string, subGoalId: string) => void;
  logSessionToGoals: (params: {
    durationMinutes: number;
    goalId?: string;
    subject?: string;
    mode?: string;
  }) => { updatedGoalsCount: number; completedGoalTitles: string[] };
  recordCompletedSession: (sessionData: {
    subjectId: string;
    goalId?: string | null;
    sessionType: 'pomodoro' | 'countdown' | 'stopwatch';
    startTime: number;
    endTime: number;
    duration: number;
    durationMinutes?: number;
  }) => { session: StudySession; updatedGoalsCount: number; completedGoalTitles: string[] };
  getGoalById: (id: string) => GoalItem | undefined;
  celebrationNotice: string | null;
  clearCelebrationNotice: () => void;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<GoalItem[]>(() => loadGoalsFromStorage());
  const [sessions, setSessions] = useState<StudySession[]>(() => loadSessionsFromStorage());
  const [celebrationNotice, setCelebrationNotice] = useState<string | null>(null);

  // Sync to localStorage whenever goals or sessions change
  useEffect(() => {
    saveGoalsToStorage(goals);
  }, [goals]);

  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  // Listen to cross-tab updates via native browser storage event (never fires in same window, preventing loops)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === GOALS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setGoals(parsed);
          }
        } catch {
          // ignore parsing error
        }
      } else if (e.key === SESSIONS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setSessions(parsed);
          }
        } catch {
          // ignore parsing error
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const clearCelebrationNotice = useCallback(() => setCelebrationNotice(null), []);

  // Helper to test if a timestamp is today
  const isToday = (ts: number): boolean => {
    const d = new Date(ts);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Helper to test if a timestamp is within the last 7 days
  const isPast7Days = (ts: number): boolean => {
    const now = Date.now();
    return now - ts <= 7 * 86400000;
  };

  // Compute today's and this week's total study minutes directly from the single source of truth: sessions
  const { todayStudyMinutes, weeklyStudyMinutes } = useMemo(() => {
    let today = 0;
    let week = 0;
    sessions.forEach((s) => {
      const ts = s.endTime || s.startTime;
      if (isToday(ts)) {
        today += s.durationMinutes;
      }
      if (isPast7Days(ts)) {
        week += s.durationMinutes;
      }
    });
    return { todayStudyMinutes: Math.round(today), weeklyStudyMinutes: Math.round(week) };
  }, [sessions]);

  // Check if a goal is overdue
  const isOverdue = (goal: GoalItem): boolean => {
    if (goal.completed || !goal.deadline) return false;
    const deadlineDate = new Date(`${goal.deadline}T23:59:59`);
    return deadlineDate.getTime() < Date.now();
  };

  // Filtered collections
  const activeGoals = useMemo(() => goals.filter((g) => !g.completed), [goals]);
  const completedGoals = useMemo(
    () => [...goals.filter((g) => g.completed)].sort((a, b) => (b.completedAt || b.updatedAt) - (a.completedAt || a.updatedAt)),
    [goals]
  );
  const dailyGoals = useMemo(() => goals.filter((g) => g.cadence === 'daily'), [goals]);
  const weeklyGoals = useMemo(() => goals.filter((g) => g.cadence === 'weekly'), [goals]);
  const overdueGoals = useMemo(() => activeGoals.filter(isOverdue), [activeGoals]);

  const getGoalById = useCallback((id: string) => goals.find((g) => g.id === id), [goals]);

  const addGoal = useCallback(
    (
      goalData: Omit<GoalItem, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'currentProgress'> & {
        currentProgress?: number;
        completed?: boolean;
      }
    ): GoalItem => {
      const now = Date.now();
      const newGoal: GoalItem = {
        ...goalData,
        id: `goal_${now}_${Math.random().toString(36).substr(2, 5)}`,
        currentProgress: goalData.currentProgress ?? 0,
        completed: goalData.completed ?? false,
        subGoals: goalData.subGoals ?? [],
        sessionLogs: goalData.sessionLogs ?? [],
        createdAt: now,
        updatedAt: now,
      };

      setGoals((prev) => [newGoal, ...prev]);
      return newGoal;
    },
    []
  );

  const updateGoal = useCallback((id: string, updates: Partial<GoalItem>) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const updated: GoalItem = {
          ...g,
          ...updates,
          updatedAt: Date.now(),
        };

        // If newly completed
        if (updates.completed === true && !g.completed) {
          updated.completedAt = Date.now();
        } else if (updates.completed === false) {
          updated.completedAt = undefined;
        }

        return updated;
      })
    );
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const toggleGoalComplete = useCallback((id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const nextCompleted = !g.completed;
        const updated: GoalItem = {
          ...g,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
          updatedAt: Date.now(),
        };
        // If completing, ensure progress matches target
        if (nextCompleted && updated.currentProgress < updated.targetValue) {
          updated.currentProgress = updated.targetValue;
        }
        return updated;
      })
    );
  }, []);

  const toggleSubGoal = useCallback((goalId: string, subGoalId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const subGoals = (g.subGoals || []).map((sub) => {
          if (sub.id !== subGoalId) return sub;
          const next = !sub.completed;
          return {
            ...sub,
            completed: next,
            completedAt: next ? Date.now() : undefined,
          };
        });

        // Recalculate progress for task_note or sub-goal based goals
        let currentProgress = g.currentProgress;
        const completedCount = subGoals.filter((s) => s.completed).length;
        if (g.type === 'task_note' || g.type === 'subject_topic') {
          currentProgress = completedCount;
        }

        const allDone = subGoals.length > 0 && completedCount === subGoals.length;
        const newlyCompleted = allDone && !g.completed;

        if (newlyCompleted) {
          setCelebrationNotice(`🎉 Goal Achieved: "${g.title}" is 100% complete!`);
        }

        return {
          ...g,
          subGoals,
          currentProgress,
          completed: allDone ? true : g.completed,
          completedAt: allDone ? (g.completedAt || Date.now()) : g.completedAt,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const addSubGoal = useCallback((goalId: string, title: string) => {
    if (!title.trim()) return;
    const newSub: SubGoalItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      completed: false,
    };
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const nextSubGoals = [...(g.subGoals || []), newSub];
        return {
          ...g,
          subGoals: nextSubGoals,
          targetValue: (g.type === 'task_note' || g.type === 'subject_topic') ? nextSubGoals.length : g.targetValue,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const removeSubGoal = useCallback((goalId: string, subGoalId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const nextSubGoals = (g.subGoals || []).filter((s) => s.id !== subGoalId);
        const completedCount = nextSubGoals.filter((s) => s.completed).length;
        return {
          ...g,
          subGoals: nextSubGoals,
          currentProgress: (g.type === 'task_note' || g.type === 'subject_topic') ? completedCount : g.currentProgress,
          targetValue: (g.type === 'task_note' || g.type === 'subject_topic') ? Math.max(1, nextSubGoals.length) : g.targetValue,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  // Record a completed study session and update goals automatically
  const recordCompletedSession = useCallback(
    (sessionData: {
      subjectId: string;
      goalId?: string | null;
      sessionType: 'pomodoro' | 'countdown' | 'stopwatch';
      startTime: number;
      endTime: number;
      duration: number;
      durationMinutes?: number;
    }): { session: StudySession; updatedGoalsCount: number; completedGoalTitles: string[] } => {
      const now = Date.now();
      const calculatedMins =
        sessionData.durationMinutes ??
        Math.max(0.5, Math.round((sessionData.duration / 60) * 10) / 10);

      const newSession: StudySession = {
        id: `session_${now}_${Math.random().toString(36).substr(2, 5)}`,
        subjectId: sessionData.subjectId || 'General',
        goalId: sessionData.goalId || undefined,
        sessionType: sessionData.sessionType,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        duration: sessionData.duration,
        durationMinutes: calculatedMins,
      };

      // 1. Add to sessions list
      setSessions((prev) => [newSession, ...prev]);

      // 2. Prepare goal session log
      const newLog: GoalSessionLog = {
        id: newSession.id,
        timestamp: newSession.endTime,
        durationMinutes: newSession.durationMinutes,
        subject: newSession.subjectId,
        mode: newSession.sessionType,
      };

      let updatedCount = 0;
      const completedTitles: string[] = [];

      // 3. Update goals
      setGoals((prev) =>
        prev.map((goal) => {
          let shouldContribute = false;

          // Explicitly selected goal
          if (newSession.goalId && goal.id === newSession.goalId) {
            shouldContribute = true;
          }
          // Daily or weekly active study goal matching subject or 'All Subjects'
          else if (
            goal.type === 'study_time' &&
            !goal.completed &&
            (!goal.subject || goal.subject === 'All Subjects' || goal.subject.toLowerCase() === newSession.subjectId.toLowerCase())
          ) {
            shouldContribute = true;
          }

          if (!shouldContribute) return goal;

          updatedCount++;
          const nextLogs = [newLog, ...(goal.sessionLogs || [])];

          // Recompute progress strictly according to cadence
          let newProgress = 0;
          if (goal.cadence === 'daily') {
            newProgress = nextLogs
              .filter((l) => isToday(l.timestamp))
              .reduce((sum, l) => sum + l.durationMinutes, 0);
          } else if (goal.cadence === 'weekly') {
            newProgress = nextLogs
              .filter((l) => isPast7Days(l.timestamp))
              .reduce((sum, l) => sum + l.durationMinutes, 0);
          } else {
            newProgress = nextLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
          }

          newProgress = Math.round(newProgress * 10) / 10;
          const isNowDone = newProgress >= goal.targetValue;
          const wasDone = goal.completed;

          if (isNowDone && !wasDone) {
            completedTitles.push(goal.title);
          }

          return {
            ...goal,
            sessionLogs: nextLogs,
            currentProgress: newProgress,
            completed: isNowDone ? true : goal.completed,
            completedAt: isNowDone && !wasDone ? now : goal.completedAt,
            updatedAt: now,
          };
        })
      );

      if (completedTitles.length > 0) {
        setCelebrationNotice(`🎯 Goal Reached: "${completedTitles[0]}" completed! Outstanding focus!`);
      }

      return { session: newSession, updatedGoalsCount: updatedCount, completedGoalTitles: completedTitles };
    },
    []
  );

  // Backward compatibility alias for logSessionToGoals
  const logSessionToGoals = useCallback(
    ({
      durationMinutes,
      goalId,
      subject,
      mode = 'timer',
    }: {
      durationMinutes: number;
      goalId?: string;
      subject?: string;
      mode?: string;
    }) => {
      const now = Date.now();
      const validMode: 'pomodoro' | 'countdown' | 'stopwatch' =
        mode === 'pomodoro' || mode === 'countdown' || mode === 'stopwatch' ? mode : 'pomodoro';
      const durationSeconds = Math.round(durationMinutes * 60);

      const res = recordCompletedSession({
        subjectId: subject || 'General',
        goalId: goalId || undefined,
        sessionType: validMode,
        startTime: now - durationSeconds * 1000,
        endTime: now,
        duration: durationSeconds,
        durationMinutes,
      });

      return { updatedGoalsCount: res.updatedGoalsCount, completedGoalTitles: res.completedGoalTitles };
    },
    [recordCompletedSession]
  );

  return (
    <GoalsContext.Provider
      value={{
        goals,
        sessions,
        activeGoals,
        completedGoals,
        dailyGoals,
        weeklyGoals,
        overdueGoals,
        todayStudyMinutes,
        weeklyStudyMinutes,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleGoalComplete,
        toggleSubGoal,
        addSubGoal,
        removeSubGoal,
        logSessionToGoals,
        recordCompletedSession,
        getGoalById,
        celebrationNotice,
        clearCelebrationNotice,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};

export const useGoals = (): GoalsContextType => {
  const ctx = useContext(GoalsContext);
  if (!ctx) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return ctx;
};
