import { StudySession } from '../types';

export const SESSIONS_STORAGE_KEY = 'ns_study_sessions';

export const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 'session_init_1',
    subjectId: 'dbms',
    goalId: 'goal_daily_study',
    sessionType: 'pomodoro',
    startTime: Date.now() - 3600000 - 1500000,
    endTime: Date.now() - 3600000,
    duration: 1500,
    durationMinutes: 25,
  },
  {
    id: 'session_init_2',
    subjectId: 'dbms',
    goalId: 'goal_dbms_review',
    sessionType: 'countdown',
    startTime: Date.now() - 7200000 - 1800000,
    endTime: Date.now() - 7200000,
    duration: 1800,
    durationMinutes: 30,
  },
];

export function loadSessionsFromStorage(): StudySession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_SESSIONS;
  } catch (err) {
    console.warn('Failed to load sessions from storage:', err);
    return INITIAL_SESSIONS;
  }
}

export function saveSessionsToStorage(sessions: StudySession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save sessions to storage:', err);
  }
}
