import { GoalItem } from '../types';

export const GOALS_STORAGE_KEY = 'ns_goals_data';

export const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'goal_daily_study',
    title: 'Daily Study Sprint',
    description: 'Dedicate at least 60 minutes to active, uninterrupted study sessions every day.',
    type: 'study_time',
    subject: 'All Subjects',
    targetValue: 60,
    currentProgress: 25,
    unit: 'minutes',
    cadence: 'daily',
    completed: false,
    deadline: undefined,
    subGoals: [
      { id: 'sub_1', title: 'Complete first 25m Pomodoro focus block', completed: true, completedAt: Date.now() - 3600000 },
      { id: 'sub_2', title: 'Active recall & summary notes (20m)', completed: false },
      { id: 'sub_3', title: 'Review flashcards or topic quiz (15m)', completed: false },
    ],
    sessionLogs: [
      {
        id: 'log_1',
        timestamp: Date.now() - 3600000,
        durationMinutes: 25,
        subject: 'dbms',
        mode: 'pomodoro',
      },
    ],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'goal_dbms_review',
    title: 'Master DBMS Week 6 Topics',
    description: 'Complete thorough handwritten notes and diagram canvas for Week 6 database topics.',
    type: 'subject_topic',
    subject: 'dbms',
    targetValue: 3,
    currentProgress: 1,
    unit: 'topics',
    cadence: 'none',
    completed: false,
    deadline: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    subGoals: [
      { id: 'sub_dbms_1', title: 'Relational Algebra & Tuple Calculus', completed: true, completedAt: Date.now() - 7200000 },
      { id: 'sub_dbms_2', title: 'B+ Tree Indexing & Search Tree Operations', completed: false },
      { id: 'sub_dbms_3', title: 'Query Execution & Cost Estimation Plans', completed: false },
    ],
    sessionLogs: [
      {
        id: 'log_dbms_1',
        timestamp: Date.now() - 7200000,
        durationMinutes: 30,
        subject: 'dbms',
        mode: 'countdown',
      },
    ],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 'goal_exam_prep',
    title: 'Midterm Exam Readiness',
    description: 'Solve past papers and finalize structured topic mindmaps before test day.',
    type: 'deadline',
    subject: 'All Subjects',
    targetValue: 4,
    currentProgress: 2,
    unit: 'tasks',
    cadence: 'weekly',
    completed: false,
    deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    subGoals: [
      { id: 'sub_exam_1', title: 'Compile high-yield formulas & cheat sheet', completed: true, completedAt: Date.now() - 14400000 },
      { id: 'sub_exam_2', title: 'Complete 2 timed mock exams', completed: true, completedAt: Date.now() - 7200000 },
      { id: 'sub_exam_3', title: 'Review missed questions & weak spots', completed: false },
      { id: 'sub_exam_4', title: 'Final rapid concept flashcard run', completed: false },
    ],
    sessionLogs: [],
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 7200000,
  },
];

export function loadGoalsFromStorage(): GoalItem[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(INITIAL_GOALS));
      return INITIAL_GOALS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_GOALS;
  } catch (err) {
    console.warn('Failed to load goals from storage:', err);
    return INITIAL_GOALS;
  }
}

export function saveGoalsToStorage(goals: GoalItem[]): void {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (err) {
    console.warn('Failed to save goals to storage:', err);
  }
}
