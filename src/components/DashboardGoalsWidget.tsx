import React from 'react';
import {
  Target,
  Clock,
  Flame,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useGoals } from '../context/GoalsContext';
import { useStudyTimer } from '../context/StudyTimerContext';
import { GoalItem } from '../types';

interface DashboardGoalsWidgetProps {
  darkMode?: boolean;
  compact?: boolean;
  onViewAllGoals: () => void;
  onCreateGoal?: () => void;
  onNavigateToTimer?: () => void;
}

export const DashboardGoalsWidget: React.FC<DashboardGoalsWidgetProps> = ({
  darkMode = false,
  compact = false,
  onViewAllGoals,
  onCreateGoal,
  onNavigateToTimer,
}) => {
  const { activeGoals, dailyGoals, todayStudyMinutes } = useGoals();
  const { startSessionForGoal } = useStudyTimer();

  const primaryDailyGoal = dailyGoals.find((g) => g.type === 'study_time');
  const topActiveGoals = activeGoals.slice(0, 3);

  const handleFocusGoal = (goal: GoalItem) => {
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

  return (
    <div
      id="dashboard-goals-widget"
      className={`rounded-2xl border p-5 mb-8 transition-all shadow-xs ${
        darkMode ? 'bg-zinc-850/90 border-zinc-800' : 'bg-white border-gray-200'
      }`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] dark:text-purple-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
              Goals & Study Targets
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">
              {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''} • {todayStudyMinutes}m focused today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCreateGoal && (
            <button
              type="button"
              onClick={onCreateGoal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 text-[#7F56D9] dark:text-purple-300 text-xs font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          <button
            type="button"
            onClick={onViewAllGoals}
            className="flex items-center gap-1 text-xs font-semibold text-[#7F56D9] dark:text-purple-400 hover:text-[#6941C6] cursor-pointer transition-colors"
          >
            <span>All Goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Daily Target Progress Strip (if active) */}
      {primaryDailyGoal && (
        <div
          className={`mb-4 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            darkMode ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50/60 border-purple-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-[#7F56D9] uppercase tracking-wider">
                Daily Focus Target
              </span>
              <div className="text-xs font-bold text-gray-900 dark:text-white">
                {primaryDailyGoal.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-40">
              <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                <span>
                  {primaryDailyGoal.currentProgress}/{primaryDailyGoal.targetValue}m
                </span>
                <span>
                  {Math.min(100, Math.round((primaryDailyGoal.currentProgress / primaryDailyGoal.targetValue) * 100))}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
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
            </div>

            <button
              type="button"
              onClick={() => handleFocusGoal(primaryDailyGoal)}
              className="p-1.5 rounded-lg bg-[#7F56D9] text-white hover:bg-[#6941C6] transition-all cursor-pointer"
              title="Start Timer for Daily Target"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* Top Active Goals List */}
      {topActiveGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topActiveGoals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentProgress / Math.max(1, goal.targetValue)) * 100));

            return (
              <div
                key={goal.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  darkMode
                    ? 'bg-zinc-800/40 border-zinc-750 hover:bg-zinc-800/80 hover:border-purple-500/30'
                    : 'bg-gray-50/70 border-gray-200/80 hover:bg-white hover:border-purple-200 hover:shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {goal.subject || 'General'}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {percent}%
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate mb-2" title={goal.title}>
                    {goal.title}
                  </h4>

                  <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[#7F56D9] rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-700/60 text-[11px] text-gray-500">
                  <span>
                    {goal.currentProgress}/{goal.targetValue} {goal.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFocusGoal(goal)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#7F56D9] hover:underline cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Focus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 text-xs text-gray-500">
          <span>No active goals right now. </span>
          <button
            type="button"
            onClick={onViewAllGoals}
            className="text-[#7F56D9] font-semibold hover:underline"
          >
            Create a goal to track your study progress
          </button>
        </div>
      )}
    </div>
  );
};
export default DashboardGoalsWidget;
