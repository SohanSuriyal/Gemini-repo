import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  Pencil,
  Upload,
  Trash2,
  BookOpen,
  PanelLeft,
  LayoutGrid,
} from 'lucide-react';

interface NotesHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onBack: () => void;
  onExport: () => void;
  onDelete: () => void;
  isSaved: boolean;
  subject?: string;
  topic?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  darkMode?: boolean;
  compact?: boolean;
  onOpenCanvas?: () => void;
}

export const NotesHeader: React.FC<NotesHeaderProps> = ({
  title,
  onTitleChange,
  onBack,
  onExport,
  onDelete,
  isSaved,
  subject,
  topic,
  isSidebarOpen = true,
  onToggleSidebar,
  darkMode = false,
  compact = false,
  onOpenCanvas,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed) {
      onTitleChange(trimmed);
    } else {
      setTitleDraft(title);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitleDraft(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-2 select-none border-b border-gray-100 dark:border-zinc-800/80 mb-2">
      {/* Left side: Back to notes + Sidebar Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        <button
          type="button"
          id="back-to-notes-btn"
          onClick={onBack}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-95 shadow-2xs cursor-pointer ${
            darkMode
              ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-800 active:bg-zinc-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'
          }`}
          title="Back to Dashboard"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
          <span className="hidden xs:inline sm:inline">Notes</span>
        </button>

        {onToggleSidebar && (
          <button
            type="button"
            id="toggle-subject-sidebar-header-btn"
            onClick={onToggleSidebar}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer ${
              isSidebarOpen
                ? 'border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-[#7F56D9] dark:text-purple-300'
                : darkMode
                  ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={isSidebarOpen ? 'Hide Subjects & Topics sidebar' : 'Show Subjects & Topics sidebar'}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7F56D9]" />
            <span className="hidden sm:inline">Topics</span>
          </button>
        )}

        <div className="flex flex-col min-w-0">
          {/* Breadcrumb indicating Subject and Topic */}
          {(subject || topic) && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-zinc-500 mb-0.5 truncate">
              <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] dark:text-purple-300 font-semibold uppercase tracking-wider text-[10px]">
                {subject || 'General'}
              </span>
              <span>›</span>
              <span className="font-medium text-gray-600 dark:text-zinc-300 truncate">
                {topic || 'General'}
              </span>
            </div>
          )}

          {isEditingTitle ? (
            <input
              ref={inputRef}
              id="note-title-input"
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className={`text-lg sm:text-xl font-bold tracking-tight px-1 py-0.5 rounded-md border outline-none min-w-0 max-w-full ${
                darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-white border-purple-400 text-gray-900 ring-2 ring-purple-100'
              }`}
            />
          ) : (
            <h1
              id="note-title-heading"
              onClick={() => setIsEditingTitle(true)}
              className={`text-lg sm:text-xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity truncate max-w-[180px] sm:max-w-md ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
              title="Click to rename"
            >
              {title || 'Untitled note'}
            </h1>
          )}
        </div>
      </div>

      {/* Right side: Saved badge, Rename, Export, Delete */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap flex-shrink-0">
        {/* Saved Status Indicator - stable fixed width to prevent layout jitter */}
        <div
          id="note-save-status-badge"
          className="flex items-center gap-1.5 w-[76px] select-none"
          title={isSaved ? 'All changes saved' : 'Saving changes...'}
        >
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isSaved
                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span
            className={`text-xs font-normal transition-colors duration-200 ${
              isSaved
                ? 'text-gray-500 dark:text-zinc-400'
                : 'text-gray-400 dark:text-zinc-500'
            }`}
          >
            {isSaved ? 'Saved' : 'Saving...'}
          </span>
        </div>

        {/* Topic Canvas Button */}
        {onOpenCanvas && (
          <button
            type="button"
            id="open-topic-canvas-btn"
            onClick={onOpenCanvas}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-95 shadow-2xs cursor-pointer ${
              darkMode
                ? 'border-purple-800/60 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 active:bg-purple-950'
                : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 active:bg-purple-200'
            }`}
            title={`Open ${topic || 'Topic'} Canvas`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>Canvas</span>
          </button>
        )}

        {/* Rename Button */}
        <button
          type="button"
          id="rename-note-btn"
          onClick={() => setIsEditingTitle(true)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-95 shadow-2xs cursor-pointer ${
            darkMode
              ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-800 active:bg-zinc-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-zinc-400" />
          <span className="hidden xs:inline sm:inline">Rename</span>
        </button>

        {/* Export Button */}
        <button
          type="button"
          id="export-note-btn"
          onClick={onExport}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-95 shadow-2xs cursor-pointer ${
            darkMode
              ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-800 active:bg-zinc-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-zinc-400" />
          <span className="hidden xs:inline sm:inline">Export</span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          id="delete-note-btn"
          onClick={onDelete}
          title={`Delete "${title}"`}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-95 shadow-2xs cursor-pointer ${
            darkMode
              ? 'border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/40 active:bg-red-950/60'
              : 'border-[#FDA29B] bg-white text-[#D92D20] hover:bg-red-50/80 active:bg-red-100'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D92D20] dark:text-red-400" />
          <span>Delete</span>
        </button>
      </div>
    </header>
  );
};
