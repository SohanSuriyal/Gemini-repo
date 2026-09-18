import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  CheckSquare,
  Search,
  Filter,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Edit2,
  Award,
  CalendarClock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { GoalItem, GoalType, GoalCadence } from '../types';
import { useGoals } from '../context/GoalsContext';
import { useStudyTimer } from '../context/StudyTimerContext';
import { GoalModal } from './GoalModal';

interface GoalsViewProps {
  darkMode?: boolean;
  compact?: boolean;
  subjects: string[];
  onNavigateToTimer?: () => void;
}

type FilterTab = 'all' | 'cadence' | 'study_time' | 'subject_topic' | 'deadline' | 'completed';

export const GoalsView: React.FC<GoalsViewProps> = ({
  darkMode = false,
  compact = false,
  subjects,
  onNavigateToTimer,
}) => {
  const {
    goals,
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
    celebrationNotice,
    clearCelebrationNotice,
  } = useGoals();

  const { startSessionForGoal } = useStudyTimer();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [expandedChecklists, setExpandedChecklists] = useState<{ [goalId: string]: boolean }>({});
  const [expandedLogs, setExpandedLogs] = useState<{ [goalId: string]: boolean }>({});

  const toggleChecklistExpanded = (goalId: string) => {
    setExpandedChecklists((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const toggleLogsExpanded = (goalId: string) => {
    setExpandedLogs((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const handleStartTimerForGoal = (goal: GoalItem) => {
    startSessionForGoal({
      goalId: goal.id,
      subject: goal.subject,
      durationMinutes: 25,
      autoStart: true,
    });
    if (onNavigateToTimer) {
      onNavigateToTimer();
    }
  };

  // Filtered goals list based on activeTab, search, subject
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      // Tab filter
      if (activeTab === 'completed') {
        if (!goal.completed) return false;
      } else {
        if (activeTab === 'all' && goal.completed) return false;
        if (activeTab === 'cadence' && (goal.cadence === 'none' || goal.completed)) return false;
        if (activeTab === 'study_time' && (goal.type !== 'study_time' || goal.completed)) return false;
        if (activeTab === 'subject_topic' && ((goal.type !== 'subject_topic' && goal.type !== 'task_note') || goal.completed)) return false;
        if (activeTab === 'deadline' && (goal.type !== 'deadline' || goal.completed)) return false;
      }

      // Subject filter
      if (selectedSubjectFilter !== 'All') {
        if (goal.subject !== selectedSubjectFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = goal.title.toLowerCase().includes(q);
        const matchDesc = goal.description?.toLowerCase().includes(q);
        const matchSubject = goal.subject?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSubject) return false;
      }

      return true;
    });
  }, [goals, activeTab, selectedSubjectFilter, searchQuery]);

  // Format deadline badge string
  const formatDeadlineText = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [year, month, day] = deadline.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isUrgent: true };
    }
    return { text: `${diffDays} days left`, isOverdue: false };
  };

  // Find daily study goal if any for header widget
  const primaryDailyGoal = dailyGoals.find((g) => g.type === 'study_time');

  return (
    <div
      id="goals-view-container"
      className={`flex-1 overflow-y-auto px-6 select-none max-w-6xl mx-auto w-full ${
        compact ? 'py-4 px-4' : 'py-6 px-8'
      }`}
    >
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold tracking-wide uppercase text-purple-600 dark:text-purple-400">
            Study Targets & Milestones
          </span>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Goals Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Timer sessions automatically accumulate towards your study targets
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#7F56D9] text-white rounded-xl text-xs font-bold hover:bg-[#6941C6] transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Celebration Notice */}
      {celebrationNotice && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-semibold shadow-xs animate-in fade-in ${
            darkMode ? 'bg-purple-950/50 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#7F56D9]" />
            <span>{celebrationNotice}</span>
          </div>
          <button
            onClick={clearCelebrationNotice}
            className="p-1 rounded-lg text-purple-500 hover:text-purple-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Card 1: Active Goals */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-gray-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Goals</span>
            <Target className="w-4 h-4 text-[#7F56D9]" />
          </div>
          <div className="text-2xl font-black">{activeGoals.length}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {overdueGoals.length > 0 ? (
              <span className="text-amber-500 font-semibold">{overdueGoals.length} overdue</span>
            ) : (
              'All on schedule'
            )}
          </p>
        </div>

        {/* Card 2: Today's Study Progress */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-gray-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Focus</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black">{todayStudyMinutes}m</div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {primaryDailyGoal
              ? `${Math.round((todayStudyMinutes / primaryDailyGoal.targetValue) * 100)}% of daily target`
              : 'From timer sessions'}
          </p>
        </div>

        {/* Card 3: Weekly Focus Total */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-gray-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">7-Day Focus</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black">{weeklyStudyMinutes}m</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Total across all subjects</p>
        </div>

        {/* Card 4: Completed Goals */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            darkMode ? 'bg-zinc-850/80 border-zinc-800' : 'bg-white border-gray-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black">{completedGoals.length}</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Milestones achieved</p>
        </div>
      </div>

      {/* Daily Target Highlight Banner (if exists) */}
      {primaryDailyGoal && !primaryDailyGoal.completed && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            darkMode ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50/70 border-purple-200/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-[#7F56D9] dark:text-purple-300 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7F56D9] dark:text-purple-300 uppercase tracking-wider">
                  Today's Daily Target
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  {primaryDailyGoal.currentProgress}/{primaryDailyGoal.targetValue} {primaryDailyGoal.unit}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                {primaryDailyGoal.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 min-w-[240px]">
            <div className="flex-1">
              <div className="h-2 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7F56D9] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((primaryDailyGoal.currentProgress / primaryDailyGoal.targetValue) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="text-right text-[11px] font-semibold text-gray-500 mt-1">
                {Math.min(100, Math.round((primaryDailyGoal.currentProgress / primaryDailyGoal.targetValue) * 100))}%
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartTimerForGoal(primaryDailyGoal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7F56D9] hover:bg-[#6941C6] text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Study Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-zinc-800">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all' as FilterTab, label: 'Active', count: activeGoals.length },
            { id: 'cadence' as FilterTab, label: 'Daily & Weekly', count: dailyGoals.length + weeklyGoals.length },
            { id: 'study_time' as FilterTab, label: 'Study Time', count: activeGoals.filter((g) => g.type === 'study_time').length },
            { id: 'subject_topic' as FilterTab, label: 'Topics & Notes', count: activeGoals.filter((g) => g.type === 'subject_topic' || g.type === 'task_note').length },
            { id: 'deadline' as FilterTab, label: 'Deadlines', count: activeGoals.filter((g) => g.type === 'deadline').length },
            { id: 'completed' as FilterTab, label: 'Completed History', count: completedGoals.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-[#7F56D9] dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  activeTab === tab.id
                    ? 'bg-[#7F56D9] text-white'
                    : 'bg-gray-200/70 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Subject Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>

          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Goals Cards Grid */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
          {filteredGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentProgress / Math.max(1, goal.targetValue)) * 100));
            const deadlineInfo = formatDeadlineText(goal.deadline);
            const isExpandedChecklist = expandedChecklists[goal.id];
            const isExpandedLogs = expandedLogs[goal.id];
            const subGoalsList = goal.subGoals || [];
            const completedSubGoalsCount = subGoalsList.filter((s) => s.completed).length;

            return (
              <div
                key={goal.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-2xs ${
                  goal.completed
                    ? darkMode
                      ? 'bg-zinc-900/60 border-zinc-800 opacity-80'
                      : 'bg-gray-50/80 border-gray-200 opacity-85'
                    : darkMode
                    ? 'bg-zinc-850 border-zinc-800 hover:border-purple-500/40'
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Meta Tags */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Type Badge */}
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-[#7F56D9] dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                        {goal.type === 'study_time' && <Clock className="w-3 h-3" />}
                        {goal.type === 'subject_topic' && <BookOpen className="w-3 h-3" />}
                        {goal.type === 'task_note' && <CheckSquare className="w-3 h-3" />}
                        {goal.type === 'deadline' && <Calendar className="w-3 h-3" />}
                        <span>
                          {goal.type === 'study_time'
                            ? 'Study Time'
                            : goal.type === 'subject_topic'
                            ? 'Topic'
                            : goal.type === 'task_note'
                            ? 'Checklist'
                            : 'Deadline'}
                        </span>
                      </span>

                      {/* Subject Badge */}
                      {goal.subject && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                          {goal.subject}
                        </span>
                      )}

                      {/* Cadence Badge */}
                      {goal.cadence && goal.cadence !== 'none' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          {goal.cadence === 'daily' ? 'Daily Target' : 'Weekly Target'}
                        </span>
                      )}
                    </div>

                    {/* Deadline & Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {goal.completed ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      ) : deadlineInfo ? (
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            deadlineInfo.isOverdue
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : deadlineInfo.isUrgent
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                          }`}
                        >
                          <CalendarClock className="w-3 h-3" />
                          <span>{deadlineInfo.text}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`text-base font-bold tracking-tight mb-1 ${
                      goal.completed ? 'line-through text-gray-400 dark:text-zinc-500' : darkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {goal.title}
                  </h3>

                  {goal.description && (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Bar & Numerical stats */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-gray-500 dark:text-zinc-400">
                        {goal.currentProgress} / {goal.targetValue} {goal.unit}
                      </span>
                      <span className="font-bold text-[#7F56D9] dark:text-purple-400">{percent}%</span>
                    </div>

                    <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.completed
                            ? 'bg-emerald-500'
                            : percent >= 75
                            ? 'bg-[#7F56D9]'
                            : percent >= 40
                            ? 'bg-purple-500'
                            : 'bg-purple-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Sub-goals Section (Expandable) */}
                  {subGoalsList.length > 0 && (
                    <div className="mb-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => toggleChecklistExpanded(goal.id)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-700 py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>
                            Checklist ({completedSubGoalsCount}/{subGoalsList.length})
                          </span>
                        </span>
                        {isExpandedChecklist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpandedChecklist && (
                        <div className="mt-2 space-y-1.5 animate-in fade-in">
                          {subGoalsList.map((sub) => (
                            <div
                              key={sub.id}
                              onClick={() => toggleSubGoal(goal.id, sub.id)}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                sub.completed
                                  ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/40 text-gray-400 line-through'
                                  : darkMode
                                  ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={sub.completed}
                                onChange={() => {}}
                                className="rounded text-[#7F56D9] focus:ring-0 cursor-pointer pointer-events-none"
                              />
                              <span className="flex-1 truncate">{sub.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logged Timer Sessions Section */}
                  {goal.sessionLogs && goal.sessionLogs.length > 0 && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => toggleLogsExpanded(goal.id)}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{goal.sessionLogs.length} study session{goal.sessionLogs.length !== 1 ? 's' : ''} logged</span>
                        {isExpandedLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpandedLogs && (
                        <div className="mt-2 space-y-1 max-h-24 overflow-y-auto text-[11px] text-gray-500 font-mono">
                          {goal.sessionLogs.map((log) => (
                            <div key={log.id} className="flex justify-between py-0.5 border-b border-gray-100 dark:border-zinc-800">
                              <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="font-bold text-[#7F56D9]">+{log.durationMinutes}m</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800 mt-2">
                  <div className="flex items-center gap-1.5">
                    {/* Mark Complete Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleGoalComplete(goal.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        goal.completed
                          ? 'border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                          : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                      }`}
                      title={goal.completed ? 'Mark as active' : 'Mark as completed'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{goal.completed ? 'Reopen' : 'Complete'}</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary "Start Timer" for this goal */}
                  {!goal.completed && (
                    <button
                      type="button"
                      onClick={() => handleStartTimerForGoal(goal)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7F56D9] hover:bg-[#6941C6] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Focus Session</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 my-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {activeTab === 'completed' ? 'No completed goals yet' : 'No goals found in this view'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
            {activeTab === 'completed'
              ? 'Complete your study sessions and checklist milestones to build up your accomplishments history!'
              : 'Create a study time, topic mastery, or exam deadline goal to stay organized and motivated.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingGoal(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#7F56D9] text-white rounded-xl text-xs font-bold hover:bg-[#6941C6] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create your first goal</span>
          </button>
        </div>
      )}

      {/* Goal Creation/Editing Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={(data) => {
          if (editingGoal) {
            updateGoal(editingGoal.id, data);
          } else {
            addGoal(data);
          }
        }}
        initialGoal={editingGoal}
        subjects={subjects}
        darkMode={darkMode}
      />
    </div>
  );
};
export default GoalsView;
