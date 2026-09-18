import React, { useState } from 'react';
import { Clock, FileText, Star, Grid, List, ArrowUpDown } from 'lucide-react';
import { NoteItem } from '../types';
import { StaticHeaderTimer } from './StaticHeaderTimer';

interface RecentViewProps {
  notes: NoteItem[];
  onSelectNote: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  darkMode?: boolean;
  defaultView?: 'grid' | 'list';
  defaultSort?: 'recent' | 'name' | 'name-desc' | 'oldest';
  compact?: boolean;
}

export const RecentView: React.FC<RecentViewProps> = ({
  notes,
  onSelectNote,
  onToggleFavorite,
  darkMode = false,
  defaultView = 'list',
  defaultSort = 'recent',
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [sortOrder, setSortOrder] = useState<'recent' | 'name' | 'name-desc' | 'oldest'>(defaultSort);

  const sortedNotes = [...notes].sort((a, b) => {
    if (sortOrder === 'name') return a.title.localeCompare(b.title);
    if (sortOrder === 'name-desc') return b.title.localeCompare(a.title);
    if (sortOrder === 'oldest') return a.created - b.created;
    return b.updated - a.updated;
  });

  return (
    <div className={`flex-1 overflow-y-auto px-6 select-none max-w-5xl mx-auto w-full ${compact ? 'py-4 px-4' : 'py-6 px-8'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">
            Timeline History
          </span>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Notes
          </h1>
        </div>

        {/* Static Study Timer */}
        <div className="flex items-center justify-center">
          <StaticHeaderTimer darkMode={darkMode} />
        </div>

        {/* View and Sort Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-600 dark:text-zinc-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Title: A-Z</option>
              <option value="name-desc">Title: Z-A</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

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
              <Grid className="w-4 h-4" />
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
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {sortedNotes.length > 0 ? (
        viewMode === 'list' ? (
          <div className="flex flex-col gap-2">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className={`flex items-center justify-between rounded-xl border transition-colors ${
                  compact ? 'p-2.5' : 'p-3.5'
                } ${
                  darkMode
                    ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800'
                    : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/20 shadow-2xs'
                }`}
              >
                <div
                  onClick={() => onSelectNote(note.id)}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
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

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(note.updated).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => onToggleFavorite(note.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                    title={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        note.favorite ? 'text-amber-400 fill-amber-400' : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  compact ? 'p-3.5' : 'p-4'
                } ${
                  darkMode
                    ? 'bg-zinc-800/60 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500/40'
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] dark:text-purple-300">
                      {note.subject || 'General'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(note.id);
                      }}
                      className="p-1 text-gray-400 hover:text-amber-400"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          note.favorite ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h4 className={`text-sm font-bold truncate mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
        <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
          <Clock className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-zinc-300">No recent notes</h3>
          <p className="text-sm text-gray-400 mt-1">Notes you edit will appear here in chronological order.</p>
        </div>
      )}
    </div>
  );
};
