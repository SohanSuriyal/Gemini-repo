import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Clock,
  BookOpen,
  CheckSquare,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  Repeat,
  CheckCircle2,
} from 'lucide-react';
import { GoalItem, GoalType, GoalCadence, SubGoalItem } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<GoalItem, 'id' | 'createdAt' | 'updatedAt' | 'completed' | 'currentProgress'> & {
    id?: string;
    currentProgress?: number;
    completed?: boolean;
  }) => void;
  initialGoal?: GoalItem | null;
  subjects: string[];
  darkMode?: boolean;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
  subjects,
  darkMode = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('study_time');
  const [subject, setSubject] = useState('All Subjects');
  const [targetValue, setTargetValue] = useState<number>(60);
  const [unit, setUnit] = useState('minutes');
  const [cadence, setCadence] = useState<GoalCadence>('none');
  const [deadline, setDeadline] = useState('');
  const [subGoals, setSubGoals] = useState<SubGoalItem[]>([]);
  const [newSubGoalTitle, setNewSubGoalTitle] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description || '');
      setType(initialGoal.type);
      setSubject(initialGoal.subject || 'All Subjects');
      setTargetValue(initialGoal.targetValue);
      setUnit(initialGoal.unit);
      setCadence(initialGoal.cadence || 'none');
      setDeadline(initialGoal.deadline || '');
      setSubGoals(initialGoal.subGoals || []);
    } else {
      setTitle('');
      setDescription('');
      setType('study_time');
      setSubject(subjects[0] || 'All Subjects');
      setTargetValue(60);
      setUnit('minutes');
      setCadence('none');
      setDeadline('');
      setSubGoals([]);
    }
    setErrors({});
  }, [initialGoal, isOpen, subjects]);

  // Sync unit based on type
  const handleTypeChange = (newType: GoalType) => {
    setType(newType);
    if (newType === 'study_time') {
      setUnit('minutes');
      setTargetValue(60);
    } else if (newType === 'subject_topic') {
      setUnit('topics');
      setTargetValue(3);
    } else if (newType === 'task_note') {
      setUnit('tasks');
      setTargetValue(5);
    } else if (newType === 'deadline') {
      setUnit('%');
      setTargetValue(100);
      if (!deadline) {
        const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
        setDeadline(nextWeek);
      }
    }
  };

  const handleAddSubGoal = () => {
    if (!newSubGoalTitle.trim()) return;
    const newSub: SubGoalItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: newSubGoalTitle.trim(),
      completed: false,
    };
    setSubGoals((prev) => [...prev, newSub]);
    setNewSubGoalTitle('');
  };

  const handleRemoveSubGoal = (id: string) => {
    setSubGoals((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Goal title is required';
    }
    if (targetValue <= 0 || isNaN(targetValue)) {
      newErrors.targetValue = 'Target value must be greater than 0';
    }
    if (type === 'deadline' && !deadline) {
      newErrors.deadline = 'A deadline date is required for deadline-based goals';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...(initialGoal ? { id: initialGoal.id, currentProgress: initialGoal.currentProgress, completed: initialGoal.completed } : {}),
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      subject: subject.trim(),
      targetValue: Number(targetValue),
      unit,
      cadence,
      deadline: deadline || undefined,
      subGoals,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] dark:text-purple-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {initialGoal ? 'Edit Study Goal' : 'Create New Study Goal'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Track progress through timer sessions and milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Goal Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
              Goal Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'study_time' as GoalType, label: 'Study Time', icon: Clock, desc: 'Auto-logs timer' },
                { id: 'subject_topic' as GoalType, label: 'Subject/Topic', icon: BookOpen, desc: 'Topic mastery' },
                { id: 'task_note' as GoalType, label: 'Tasks & Notes', icon: CheckSquare, desc: 'Checklists' },
                { id: 'deadline' as GoalType, label: 'Deadline', icon: Calendar, desc: 'Exam/Sprint date' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTypeChange(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#7F56D9] bg-purple-50/50 dark:bg-purple-950/40 text-[#7F56D9] dark:text-purple-300 ring-2 ring-[#7F56D9]/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/60 text-gray-600 dark:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-2" />
                    <div>
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] opacity-75">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
              Goal Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Operating System Concurrency"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
                errors.title
                  ? 'border-red-500 bg-red-50/20'
                  : darkMode
                  ? 'bg-zinc-800/90 border-zinc-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or notes about what success looks like..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
                darkMode ? 'bg-zinc-800/90 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>

          {/* Target Value, Unit & Subject Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                Target Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={targetValue}
                onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                className={`w-full px-3 py-2 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200'
                }`}
              />
              {errors.targetValue && (
                <p className="mt-1 text-[11px] text-red-500">{errors.targetValue}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. minutes, topics"
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] cursor-pointer ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200'
                }`}
              >
                <option value="All Subjects">All Subjects / General</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cadence & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                Cadence (Repeat Target)
              </label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as GoalCadence)}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] cursor-pointer ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200'
                }`}
              >
                <option value="none">One-time milestone</option>
                <option value="daily">Daily Target (resets daily progress)</option>
                <option value="weekly">Weekly Target (7-day window)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
                Deadline Date {type === 'deadline' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
                  errors.deadline
                    ? 'border-red-500 bg-red-50/20'
                    : darkMode
                    ? 'bg-zinc-800 border-zinc-700 text-white'
                    : 'bg-white border-gray-200'
                }`}
              />
              {errors.deadline && (
                <p className="mt-1 text-[11px] text-red-500">{errors.deadline}</p>
              )}
            </div>
          </div>

          {/* Sub-goals & Milestones Checklist Builder */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Sub-Goals & Milestones ({subGoals.length})
              </label>
              <span className="text-[11px] text-gray-400">Check off as you complete steps</span>
            </div>

            {/* Input to add sub-goal */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newSubGoalTitle}
                onChange={(e) => setNewSubGoalTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubGoal();
                  }
                }}
                placeholder="Add checklist milestone (e.g. Read Chapter 4, Solve quiz)"
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200'
                }`}
              />
              <button
                type="button"
                onClick={handleAddSubGoal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#7F56D9] dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* List of sub-goals */}
            {subGoals.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {subGoals.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs ${
                      darkMode ? 'bg-zinc-800/60 border-zinc-700/80' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-gray-400 font-mono text-[10px]">{idx + 1}.</span>
                      <span className={sub.completed ? 'line-through text-gray-400' : ''}>{sub.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubGoal(sub.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">No sub-goals added yet. Optional checklist items.</p>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#7F56D9] hover:bg-[#6941C6] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{initialGoal ? 'Save Changes' : 'Create Goal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default GoalModal;
