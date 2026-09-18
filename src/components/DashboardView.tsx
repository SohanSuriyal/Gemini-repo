import React, { useState } from 'react';
import { Plus, Search, BookOpen, Clock, FileText, ArrowRight, Grid, List, Timer } from 'lucide-react';
import { NoteItem } from '../types';
import { StaticHeaderTimer } from './StaticHeaderTimer';
import { DashboardGoalsWidget } from './DashboardGoalsWidget';

interface DashboardViewProps {
  notes: NoteItem[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: (subject?: string, topic?: string) => void;
  onViewSubject?: (subject: string) => void;
  onViewAllGoals?: () => void;
  onCreateGoal?: () => void;
  onNavigateToTimer?: () => void;
  darkMode?: boolean;
  defaultView?: 'grid' | 'list';
  defaultSort?: 'recent' | 'name' | 'name-desc' | 'oldest';
  compact?: boolean;
  customSubjects?: string[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  notes,
  onSelectNote,
  onCreateNote,
  onViewSubject,
  onViewAllGoals,
  onCreateGoal,
  onNavigateToTimer,
  darkMode = false,
  defaultView = 'grid',
  defaultSort = 'recent',
  compact = false,
  customSubjects = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);

  // Collect unique subjects including custom ones
  const subjects = Array.from(
    new Set([...notes.map((n) => n.subject).filter(Boolean), ...customSubjects])
  ).sort();

  const filteredNotes = notes
    .filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.topic.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (defaultSort === 'name') return a.title.localeCompare(b.title);
      if (defaultSort === 'name-desc') return b.title.localeCompare(a.title);
      if (defaultSort === 'oldest') return a.created - b.created;
      return b.updated - a.updated;
    });

  return (
    <div className={`flex-1 overflow-y-auto px-6 select-none max-w-6xl mx-auto w-full ${compact ? 'py-4 px-4' : 'py-6 px-8'}`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">
            Your learning library
          </span>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome back
          </h1>
        </div>

        {/* Static Header Timer */}
        <div className="flex items-center justify-center">
          <StaticHeaderTimer darkMode={darkMode} />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onCreateNote()}
            className="flex items-center gap-2 px-4 py-2 bg-[#7F56D9] text-white rounded-xl text-sm font-semibold hover:bg-[#6941C6] transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New note</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search all subjects, topics, or notes..."
          className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#7F56D9] ${
            darkMode
              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100 placeholder-zinc-500'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-2xs'
          }`}
        />
      </div>

      {/* Overview Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-7">
        {[
          { label: 'Total Notes', value: notes.length, icon: '📝' },
          { label: 'Subjects', value: subjects.length, icon: '📚' },
          { label: 'Starred Notes', value: notes.filter((n) => n.favorite).length, icon: '⭐' },
          { label: 'Drawings', value: notes.filter((n) => n.strokes?.length > 0).length, icon: '✏️' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`rounded-2xl border transition-all ${compact ? 'p-3' : 'p-4'} ${
              darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-2xs'
            }`}
          >
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{stat.label}</div>
            <div className={`text-xl font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Goals & Study Targets Widget */}
      {onViewAllGoals && (
        <DashboardGoalsWidget
          darkMode={darkMode}
          compact={compact}
          onViewAllGoals={onViewAllGoals}
          onCreateGoal={onCreateGoal}
          onNavigateToTimer={onNavigateToTimer}
        />
      )}

      {/* Subjects Section */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your Subjects</h2>
          {onViewSubject && subjects.length > 0 && (
            <button
              onClick={() => onViewSubject(subjects[0])}
              className="text-xs font-semibold text-[#7F56D9] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {subjects.map((sub) => {
              const subNotes = notes.filter((n) => n.subject?.toLowerCase() === sub.toLowerCase());
              const topics = Array.from(new Set(subNotes.map((n) => n.topic).filter(Boolean)));
              return (
                <div
                  key={sub}
                  onClick={() => onViewSubject && onViewSubject(sub)}
                  className={`rounded-2xl border transition-all cursor-pointer ${compact ? 'p-3.5' : 'p-4'} ${
                    darkMode
                      ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500/40'
                      : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-2xl mb-1.5">📚</div>
                  <h3 className={`text-base font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {sub}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mt-3">
                    <span>
                      {subNotes.length} note{subNotes.length !== 1 ? 's' : ''} · {topics.length} topic
                      {topics.length !== 1 ? 's' : ''}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">No subjects yet.</p>
          </div>
        )}
      </div>

      {/* Recent Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Notes</h2>
          <div className="flex rounded-xl border border-gray-200 dark:border-zinc-700 p-0.5 bg-gray-50 dark:bg-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-700 text-[#7F56D9] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-700 text-[#7F56D9] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredNotes.length > 0 ? (
          viewMode === 'list' ? (
            <div className="flex flex-col gap-2">
              {filteredNotes.slice(0, 8).map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`flex items-center justify-between rounded-xl border transition-colors cursor-pointer ${
                    compact ? 'p-2.5' : 'p-3.5'
                  } ${
                    darkMode
                      ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800'
                      : 'bg-white border-gray-200 hover:bg-purple-50/40 hover:border-purple-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[#7F56D9] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {note.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                        {note.subject || 'General'} {note.topic ? `· ${note.topic}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(note.updated).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredNotes.slice(0, 9).map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    compact ? 'p-3' : 'p-4'
                  } ${
                    darkMode
                      ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500/40'
                      : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] dark:text-purple-300">
                      {note.subject || 'General'}
                    </span>
                    <h4 className={`text-sm font-bold truncate mt-2 mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {note.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
                      {note.topic || 'General Topic'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-700/60 text-[11px] text-gray-400">
                    <span>{new Date(note.updated).toLocaleDateString()}</span>
                    <span>{note.strokes?.length ? `${note.strokes.length} strokes` : 'Text note'}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
            <p className="text-sm text-gray-500 dark:text-zinc-400">No matching notes found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
