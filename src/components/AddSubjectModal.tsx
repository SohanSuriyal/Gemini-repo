import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Sparkles, BookOpen, PenTool } from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSubjects: string[];
  onSubmit: (subjectName: string, initialTopic: string, openEditor: boolean) => void;
  darkMode?: boolean;
}

const POPULAR_SUGGESTIONS = [
  'Operating Systems',
  'Computer Networks',
  'Data Structures & Algorithms',
  'Machine Learning',
  'Linear Algebra',
  'Web Development',
  'Physics',
  'Economics',
];

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  existingSubjects,
  onSubmit,
  darkMode = false,
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [initialTopic, setInitialTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSubjectName('');
      setInitialTopic('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplySuggestion = (suggestion: string) => {
    setSubjectName(suggestion);
    setError(null);
    inputRef.current?.focus();
  };

  const handleSubmit = (openEditor: boolean) => {
    const trimmed = subjectName.trim();
    if (!trimmed) {
      setError('Please enter a subject name.');
      inputRef.current?.focus();
      return;
    }

    // Check if duplicate (case insensitive)
    const duplicate = existingSubjects.find(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError(`Subject "${duplicate}" already exists.`);
      return;
    }

    const topic = initialTopic.trim() || 'Introduction';
    onSubmit(trimmed, topic, openEditor);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 overflow-hidden transition-all transform scale-100 ${
          darkMode
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            darkMode
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Add New Subject</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Organize your lecture notes and topics under a new subject
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="space-y-4"
        >
          {/* Subject Name */}
          <div>
            <label
              htmlFor="new-subject-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5"
            >
              Subject Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="new-subject-name-input"
              type="text"
              value={subjectName}
              onChange={(e) => {
                setSubjectName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Computer Networks, Linear Algebra..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                error
                  ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20'
                  : darkMode
                  ? 'border-zinc-700 bg-zinc-800/90 text-zinc-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 shadow-2xs'
              }`}
            />
            {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
          </div>

          {/* Quick Suggestions */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Suggested subjects:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SUGGESTIONS.filter(
                (s) => !existingSubjects.some((e) => e.toLowerCase() === s.toLowerCase())
              ).slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleApplySuggestion(suggestion)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    subjectName.toLowerCase() === suggestion.toLowerCase()
                      ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                      : darkMode
                      ? 'border-zinc-800 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* First Topic */}
          <div>
            <label
              htmlFor="new-subject-topic-input"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-1.5"
            >
              First Topic (optional)
            </label>
            <input
              id="new-subject-topic-input"
              type="text"
              value={initialTopic}
              onChange={(e) => setInitialTopic(e.target.value)}
              placeholder="e.g. Introduction, Week 1, Syllabus (defaults to 'Introduction')"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                darkMode
                  ? 'border-zinc-700 bg-zinc-800/90 text-zinc-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 shadow-2xs'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 mt-6 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                darkMode
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              id="create-subject-btn"
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create Subject</span>
            </button>

            <button
              type="button"
              id="create-subject-and-write-btn"
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Create & Write Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
