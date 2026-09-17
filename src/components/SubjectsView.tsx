import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  FolderPlus,
  ArrowRight,
  ChevronLeft,
  Search,
  Bookmark,
  FileText,
  Clock,
  Layers,
  X,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { NoteItem } from '../types';
import { AddSubjectModal } from './AddSubjectModal';
import { getSubjectTheme } from '../utils/subjectThemes';

interface SubjectsViewProps {
  notes: NoteItem[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: (subject?: string, topic?: string) => void;
  onAddSubject?: (subjectName: string, initialTopic?: string, openEditor?: boolean) => void;
  customSubjects?: string[];
  initialSubject?: string | null;
  onClearInitialSubject?: () => void;
  darkMode?: boolean;
  compact?: boolean;
  subjectsOrder?: string[];
  onUpdateSubjectsOrder?: (newOrder: string[]) => void;
  onOpenTopicCanvas?: (subject: string, topic: string) => void;
}

function formatLastUpdated(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function stripHtml(html?: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || '';
  return text.trim().slice(0, 110);
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  notes,
  onSelectNote,
  onCreateNote,
  onAddSubject,
  customSubjects = [],
  initialSubject = null,
  onClearInitialSubject,
  darkMode = false,
  compact = false,
  subjectsOrder: subjectsOrderProp,
  onUpdateSubjectsOrder,
  onOpenTopicCanvas,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(initialSubject);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTopicDraft, setNewTopicDraft] = useState('');
  const [isAddingNewTopic, setIsAddingNewTopic] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // Subject ordering state (persisted locally and synced with parent)
  const [internalSubjectsOrder, setInternalSubjectsOrder] = useState<string[]>(() => {
    if (subjectsOrderProp && subjectsOrderProp.length > 0) return subjectsOrderProp;
    try {
      const saved = localStorage.getItem('ns_subjects_order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const effectiveSubjectsOrder =
    subjectsOrderProp && subjectsOrderProp.length > 0
      ? subjectsOrderProp
      : internalSubjectsOrder;

  // Drag-and-drop state
  const [draggedSubject, setDraggedSubject] = useState<string | null>(null);
  const [dragOverSubject, setDragOverSubject] = useState<string | null>(null);
  const didDragRef = useRef(false);

  // Display toggles and sorting
  const [subjectsViewMode, setSubjectsViewMode] = useState<'grid' | 'list'>('grid');
  const [subjectsSortBy, setSubjectsSortBy] = useState<'custom' | 'recent' | 'notes' | 'name'>('custom');

  const [topicsViewMode, setTopicsViewMode] = useState<'grid' | 'list'>('grid');
  const [topicsSortBy, setTopicsSortBy] = useState<'recent' | 'notes' | 'name'>('recent');

  // Sync initialSubject prop if passed from parent (e.g. Dashboard navigation)
  useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
    }
  }, [initialSubject]);

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSearchQuery('');
    setIsAddingNewTopic(false);
    setNewTopicDraft('');
    if (onClearInitialSubject) {
      onClearInitialSubject();
    }
  };

  const handleCreateTopicNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSubject) return;
    const topicName = newTopicDraft.trim() || 'General';
    onCreateNote(selectedSubject, topicName);
    setNewTopicDraft('');
    setIsAddingNewTopic(false);
  };

  // Collect all unique subjects from notes and any custom subjects created
  const allSubjectNames = useMemo(() => {
    const rawSet = new Set<string>([
      ...notes.map((n) => n.subject).filter((s): s is string => Boolean(s)),
      ...customSubjects,
    ]);
    const rawList = Array.from(rawSet);

    if (effectiveSubjectsOrder.length > 0) {
      const ordered: string[] = [];
      effectiveSubjectsOrder.forEach((name) => {
        if (rawSet.has(name)) {
          ordered.push(name);
          rawSet.delete(name);
        }
      });
      rawList.forEach((name) => {
        if (rawSet.has(name)) {
          ordered.push(name);
          rawSet.delete(name);
        }
      });
      return ordered;
    }

    return rawList.sort();
  }, [notes, customSubjects, effectiveSubjectsOrder]);

  // Compute Subject metadata (notes, topics, last activity)
  const subjectCardData = useMemo(() => {
    return allSubjectNames.map((subName) => {
      const subNotes = notes.filter((n) => n.subject === subName);
      const topics = Array.from(
        new Set(subNotes.map((n) => n.topic?.trim()).filter((t): t is string => Boolean(t)))
      );
      const sortedNotes = [...subNotes].sort((a, b) => b.updated - a.updated);
      const lastUpdated = sortedNotes[0]?.updated || 0;
      const theme = getSubjectTheme(subName);

      return {
        name: subName,
        notes: sortedNotes,
        noteCount: subNotes.length,
        topics,
        topicCount: topics.length,
        latestNote: sortedNotes[0] || null,
        lastUpdated,
        theme,
      };
    });
  }, [allSubjectNames, notes]);

  // Filter and sort subjects
  const filteredSubjects = useMemo(() => {
    let result = subjectCardData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.topics.some((t) => t.toLowerCase().includes(q)) ||
          s.notes.some((n) => n.title.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      if (subjectsSortBy === 'custom') {
        return 0; // Maintain custom sequence
      }
      if (subjectsSortBy === 'notes') {
        return b.noteCount - a.noteCount;
      }
      if (subjectsSortBy === 'recent') {
        return b.lastUpdated - a.lastUpdated;
      }
      return a.name.localeCompare(b.name);
    });
  }, [subjectCardData, searchQuery, subjectsSortBy]);

  // Global library statistics
  const totalNotesCount = notes.length;
  const totalTopicsCount = useMemo(() => {
    return new Set(notes.map((n) => `${n.subject}::${n.topic || 'General'}`)).size;
  }, [notes]);

  // --------------------------------------------------------------------------
  // DRAG AND DROP HANDLERS FOR SUBJECTS REORDERING
  // --------------------------------------------------------------------------
  const handleDragStart = (e: React.DragEvent, subjectName: string) => {
    didDragRef.current = false;
    setDraggedSubject(subjectName);
    e.dataTransfer.setData('text/plain', subjectName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetSubjectName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSubject !== targetSubjectName) {
      setDragOverSubject(targetSubjectName);
    }
  };

  const handleDragLeave = () => {
    setDragOverSubject(null);
  };

  const handleDrop = (e: React.DragEvent, targetSubjectName: string) => {
    e.preventDefault();
    setDragOverSubject(null);
    didDragRef.current = true;
    setTimeout(() => {
      didDragRef.current = false;
    }, 150);

    const sourceSubject = draggedSubject || e.dataTransfer.getData('text/plain');
    if (!sourceSubject || sourceSubject === targetSubjectName) {
      setDraggedSubject(null);
      return;
    }

    const currentOrder = [...allSubjectNames];
    const sourceIdx = currentOrder.indexOf(sourceSubject);
    const targetIdx = currentOrder.indexOf(targetSubjectName);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      currentOrder.splice(sourceIdx, 1);
      currentOrder.splice(targetIdx, 0, sourceSubject);
      setInternalSubjectsOrder(currentOrder);
      if (onUpdateSubjectsOrder) {
        onUpdateSubjectsOrder(currentOrder);
      }
      try {
        localStorage.setItem('ns_subjects_order', JSON.stringify(currentOrder));
      } catch {
        // ignore
      }
      setSubjectsSortBy('custom');
    }
    setDraggedSubject(null);
  };

  const handleDragEnd = () => {
    setDraggedSubject(null);
    setDragOverSubject(null);
    setTimeout(() => {
      didDragRef.current = false;
    }, 150);
  };

  // --------------------------------------------------------------------------
  // VIEW 1: DRILL-DOWN TOPICS GRID FOR THE SELECTED SUBJECT
  // --------------------------------------------------------------------------
  if (selectedSubject) {
    const subjectTheme = getSubjectTheme(selectedSubject);
    const SubjectIcon = subjectTheme.icon;
    const subjectNotes = notes.filter((n) => n.subject === selectedSubject);

    // Group notes by topic
    const topicMap = new Map<string, NoteItem[]>();
    subjectNotes.forEach((note) => {
      const topicName = note.topic?.trim() || 'General';
      if (!topicMap.has(topicName)) {
        topicMap.set(topicName, []);
      }
      topicMap.get(topicName)!.push(note);
    });

    // Array of topics with note references
    const allTopics = Array.from(topicMap.keys()).map((topicName) => {
      const topicNotes = topicMap.get(topicName) || [];
      const sorted = [...topicNotes].sort((a, b) => b.updated - a.updated);
      return {
        name: topicName,
        notes: sorted,
        noteCount: sorted.length,
        latestNote: sorted[0],
        lastUpdated: sorted[0]?.updated || 0,
      };
    });

    // Filter topics by search query
    const filteredTopics = allTopics
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.notes.some(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              stripHtml(n.content).toLowerCase().includes(q)
          )
        );
      })
      .sort((a, b) => {
        if (topicsSortBy === 'notes') {
          return b.noteCount - a.noteCount;
        }
        if (topicsSortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return b.lastUpdated - a.lastUpdated;
      });

    return (
      <div
        className={`flex-1 overflow-y-auto select-none max-w-6xl mx-auto w-full ${
          compact ? 'py-4 px-4 sm:px-6' : 'py-6 px-6 sm:px-8'
        }`}
      >
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            id="back-to-subjects-btn"
            onClick={handleBackToSubjects}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs ${
              darkMode
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>All Subjects</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-600" />
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{
              color: subjectTheme.accent,
              backgroundColor: darkMode ? `${subjectTheme.accent}20` : `${subjectTheme.accent}12`,
            }}
          >
            {selectedSubject}
          </span>
        </div>

        {/* Subject Header Banner with Color Identity */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 mb-6 transition-colors ${
            darkMode
              ? 'bg-zinc-850 border-zinc-700/80'
              : 'bg-white border-gray-200/90 shadow-2xs'
          }`}
        >
          {/* Subtle Top Accent Glow Line */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: subjectTheme.accent }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                style={{
                  backgroundColor: darkMode ? `${subjectTheme.accent}25` : `${subjectTheme.accent}15`,
                  color: subjectTheme.accent,
                }}
              >
                <SubjectIcon className="w-6 h-6" />
              </div>
              <div>
                <h1
                  className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {selectedSubject}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-zinc-400">
                  <span className="font-medium text-gray-700 dark:text-zinc-300">
                    {allTopics.length} topic{allTopics.length !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>
                    {subjectNotes.length} note{subjectNotes.length !== 1 ? 's' : ''} total
                  </span>
                  {subjectNotes[0] && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>Last active {formatLastUpdated(subjectNotes[0].updated)}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                id="add-topic-banner-btn"
                onClick={() => setIsAddingNewTopic(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  darkMode
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                <span>New Topic</span>
              </button>

              <button
                type="button"
                id="create-topic-note-btn"
                onClick={() => onCreateNote(selectedSubject)}
                className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer hover:opacity-95"
                style={{ backgroundColor: subjectTheme.accent }}
              >
                <Plus className="w-4 h-4" />
                <span>New Note in {selectedSubject}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Sort & View Mode */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="search-topics-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search topics or notes in ${selectedSubject}...`}
              className={`w-full pl-10 pr-9 py-2 rounded-xl border text-xs outline-none transition-colors ${
                darkMode
                  ? 'bg-zinc-800/90 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-purple-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-600 shadow-2xs'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">Sort:</span>
              <select
                value={topicsSortBy}
                onChange={(e) => setTopicsSortBy(e.target.value as any)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer transition-colors ${
                  darkMode
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                    : 'bg-white border-gray-200 text-gray-700 shadow-2xs'
                }`}
              >
                <option value="recent">Recently Active</option>
                <option value="notes">Most Notes</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>

            {/* Grid / List Switcher */}
            <div
              className={`flex items-center p-0.5 rounded-lg border ${
                darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setTopicsViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  topicsViewMode === 'grid'
                    ? darkMode
                      ? 'bg-zinc-700 text-white shadow-2xs'
                      : 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
                }`}
                title="Grid layout"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTopicsViewMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  topicsViewMode === 'list'
                    ? darkMode
                      ? 'bg-zinc-700 text-white shadow-2xs'
                      : 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
                }`}
                title="List layout"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Add New Topic Inline Form */}
        {isAddingNewTopic && (
          <form
            onSubmit={handleCreateTopicNote}
            className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in duration-150 ${
              darkMode ? 'bg-zinc-850 border-purple-900/50' : 'bg-purple-50/60 border-purple-200'
            }`}
          >
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1">
                New Topic Name in {selectedSubject}
              </label>
              <input
                type="text"
                autoFocus
                value={newTopicDraft}
                onChange={(e) => setNewTopicDraft(e.target.value)}
                placeholder="e.g. Transactions, Relational Algebra, Week 8..."
                className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                  darkMode
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                    : 'bg-white border-purple-300 text-gray-900'
                }`}
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-4">
              <button
                type="submit"
                className="px-3.5 py-1.5 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs hover:opacity-95"
                style={{ backgroundColor: subjectTheme.accent }}
              >
                Create & Open Note
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewTopic(false);
                  setNewTopicDraft('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                  darkMode
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* TOPICS DISPLAY: GRID OR LIST */}
        {filteredTopics.length > 0 ? (
          topicsViewMode === 'grid' ? (
            /* Visual Cards Grid for Topics */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredTopics.map((topic) => {
                const count = topic.notes.length;
                const previewText = stripHtml(topic.latestNote?.content);

                return (
                  <div
                    key={topic.name}
                    id={`topic-card-${topic.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => topic.latestNote && onSelectNote(topic.latestNote.id)}
                    className={`group p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between min-h-[200px] cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                      darkMode
                        ? 'bg-zinc-800/90 border-zinc-700 hover:border-purple-500/80 hover:bg-zinc-800'
                        : 'bg-white border-gray-200/90 hover:border-purple-300 hover:bg-purple-50/15'
                    }`}
                  >
                    <div>
                      {/* Topic Header: Icon, Name & Count */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                          style={{
                            backgroundColor: darkMode
                              ? `${subjectTheme.accent}25`
                              : `${subjectTheme.accent}15`,
                            color: subjectTheme.accent,
                          }}
                        >
                          <Bookmark className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            darkMode
                              ? 'bg-zinc-700/80 text-zinc-300'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {count} note{count !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <h3
                        className={`text-base font-bold truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                        title={topic.name}
                      >
                        {topic.name}
                      </h3>

                      {/* Latest Note Title & Snippet */}
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-zinc-200 truncate">
                          <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">
                            {topic.latestNote?.title || 'Untitled note'}
                          </span>
                        </div>
                        {previewText && (
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {previewText}
                          </p>
                        )}
                      </div>

                      {/* Multiple notes sub-links */}
                      {topic.notes.length > 1 && (
                        <div className="mt-3 pt-2.5 border-t border-dashed border-gray-100 dark:border-zinc-700/60 flex flex-wrap gap-1">
                          {topic.notes.slice(0, 3).map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectNote(n.id);
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-md border truncate max-w-[120px] transition-colors ${
                                darkMode
                                  ? 'border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'
                                  : 'border-gray-200 text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                              }`}
                              title={`Open "${n.title}"`}
                            >
                              {n.title}
                            </button>
                          ))}
                          {topic.notes.length > 3 && (
                            <span className="text-[10px] text-gray-400 self-center px-1">
                              +{topic.notes.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom Bar */}
                    <div className="flex items-center justify-between pt-3 mt-4 border-t border-gray-100 dark:border-zinc-700/70">
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatLastUpdated(topic.lastUpdated)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenTopicCanvas && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTopicCanvas(selectedSubject, topic.name);
                            }}
                            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                              darkMode
                                ? 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/70 border border-purple-800/50'
                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                            }`}
                            title={`Open ${topic.name} Canvas`}
                          >
                            <LayoutGrid className="w-3 h-3 text-purple-400" />
                            <span>Canvas</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateNote(selectedSubject, topic.name);
                          }}
                          className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                            darkMode
                              ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                          title={`Create new note in ${topic.name}`}
                        >
                          + Note
                        </button>

                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Structured List View for Topics */
            <div
              className={`rounded-2xl border divide-y overflow-hidden shadow-2xs ${
                darkMode
                  ? 'bg-zinc-800/90 border-zinc-700 divide-zinc-700/60'
                  : 'bg-white border-gray-200 divide-gray-100'
              }`}
            >
              {filteredTopics.map((topic) => {
                const count = topic.notes.length;
                return (
                  <div
                    key={topic.name}
                    onClick={() => topic.latestNote && onSelectNote(topic.latestNote.id)}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-zinc-750' : 'hover:bg-purple-50/20'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: darkMode
                            ? `${subjectTheme.accent}25`
                            : `${subjectTheme.accent}15`,
                          color: subjectTheme.accent,
                        }}
                      >
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm font-bold truncate ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {topic.name}
                          </h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              darkMode
                                ? 'bg-zinc-700 text-zinc-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {count} note{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                          Latest: {topic.latestNote?.title || 'Untitled'} •{' '}
                          {formatLastUpdated(topic.lastUpdated)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {onOpenTopicCanvas && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTopicCanvas(selectedSubject, topic.name);
                          }}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            darkMode
                              ? 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/70 border border-purple-800/50'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                          title={`Open ${topic.name} Canvas`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                          <span>Canvas</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNote(selectedSubject, topic.name);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                          darkMode
                            ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        + Add Note
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Empty Search or Empty Topic State */
          <div
            className={`p-10 text-center rounded-2xl border border-dashed ${
              darkMode ? 'border-zinc-700 bg-zinc-800/40' : 'border-gray-300 bg-gray-50/50'
            }`}
          >
            <Bookmark className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {searchQuery
                ? `No topics found matching "${searchQuery}"`
                : `No topics yet in ${selectedSubject}`}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search keyword or create a new note with this topic.'
                : 'Start organizing your thoughts by creating your first topic and note for this subject.'}
            </p>
            <button
              type="button"
              onClick={() => onCreateNote(selectedSubject, searchQuery.trim() || undefined)}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              + Create Note {searchQuery ? `in "${searchQuery}"` : ''}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VIEW 2: SUBJECTS OVERVIEW (ALL SUBJECTS)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`flex-1 overflow-y-auto select-none max-w-6xl mx-auto w-full ${
        compact ? 'py-4 px-4 sm:px-6' : 'py-6 px-6 sm:px-8'
      }`}
    >
      {/* Top Header & Global Stats */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          compact ? 'mb-4' : 'mb-6'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-purple-600 dark:text-purple-400">
              Library Overview
            </span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Subjects & Topics
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {allSubjectNames.length} subject{allSubjectNames.length !== 1 ? 's' : ''} •{' '}
            {totalTopicsCount} active topic{totalTopicsCount !== 1 ? 's' : ''} •{' '}
            {totalNotesCount} note{totalNotesCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="add-subject-header-btn"
            onClick={() => setIsAddSubjectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7F56D9] text-white rounded-xl text-xs font-semibold hover:bg-[#6941C6] transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>

          <button
            type="button"
            id="new-note-btn"
            onClick={() => onCreateNote()}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 shadow-2xs cursor-pointer ${
              darkMode
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New note</span>
          </button>
        </div>
      </div>

      {/* Search, Filter, Sort & Drag Reorder Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="search-subjects-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects, topics, or notes..."
            className={`w-full pl-10 pr-9 py-2 rounded-xl border text-xs outline-none transition-colors ${
              darkMode
                ? 'bg-zinc-800/90 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-purple-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-purple-600 shadow-2xs'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View mode & Sort controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Reorder hint badge */}
          {subjectsSortBy === 'custom' && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40">
              <GripVertical className="w-3 h-3" />
              <span>Drag cards to reorder</span>
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">Sort:</span>
            <select
              value={subjectsSortBy}
              onChange={(e) => setSubjectsSortBy(e.target.value as any)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'bg-white border-gray-200 text-gray-700 shadow-2xs'
              }`}
            >
              <option value="custom">Custom (Drag to reorder)</option>
              <option value="recent">Recently Active</option>
              <option value="notes">Most Notes</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setSubjectsViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                subjectsViewMode === 'grid'
                  ? darkMode
                    ? 'bg-zinc-700 text-white shadow-2xs'
                    : 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
              }`}
              title="Card Grid layout"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSubjectsViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                subjectsViewMode === 'list'
                  ? darkMode
                    ? 'bg-zinc-700 text-white shadow-2xs'
                    : 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200'
              }`}
              title="Compact Table layout"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SUBJECTS CONTENT */}
      {subjectsViewMode === 'grid' ? (
        /* Visual Cards Grid with Drag-and-Drop Reordering */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => {
            const SubjectIcon = sub.theme.icon;
            const isDragging = draggedSubject === sub.name;
            const isOver = dragOverSubject === sub.name && draggedSubject !== sub.name;

            return (
              <div
                key={sub.name}
                id={`subject-card-${sub.name.replace(/\s+/g, '-').toLowerCase()}`}
                draggable
                onDragStart={(e) => handleDragStart(e, sub.name)}
                onDragOver={(e) => handleDragOver(e, sub.name)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, sub.name)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (didDragRef.current) return;
                  setSelectedSubject(sub.name);
                }}
                className={`relative group rounded-2xl border transition-all duration-150 flex flex-col justify-between min-h-[220px] shadow-2xs hover:shadow-md cursor-pointer hover:-translate-y-0.5 overflow-hidden select-none ${
                  isDragging
                    ? 'opacity-40 border-dashed border-purple-500 scale-[0.98]'
                    : isOver
                    ? 'ring-2 ring-purple-500 ring-offset-2 border-purple-500 bg-purple-50/20 dark:bg-purple-950/30 scale-[1.02]'
                    : darkMode
                    ? 'bg-zinc-800/90 border-zinc-750 hover:border-zinc-600'
                    : 'bg-white border-gray-200 hover:border-purple-300'
                }`}
              >
                {/* Colored Top Accent Band */}
                <div
                  className="h-1.5 w-full transition-all group-hover:h-2"
                  style={{ backgroundColor: sub.theme.accent }}
                />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Card Header: Icon, Drag Handle & Note Count */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: darkMode
                          ? `${sub.theme.accent}25`
                          : `${sub.theme.accent}15`,
                        color: sub.theme.accent,
                      }}
                    >
                      <SubjectIcon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-zinc-700/80 text-zinc-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {sub.noteCount} note{sub.noteCount !== 1 ? 's' : ''}
                      </span>

                      {/* Drag Handle Indicator */}
                      <div
                        className="p-1 text-gray-300 group-hover:text-gray-500 dark:text-zinc-600 dark:group-hover:text-zinc-400 cursor-grab active:cursor-grabbing rounded transition-colors"
                        title="Drag to reorder subject"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <h3
                    className={`text-lg font-bold truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {sub.name}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {sub.topicCount} topic{sub.topicCount !== 1 ? 's' : ''} organized
                  </p>

                  {/* Topic Pills Previews - Clean tags without '#' prefix */}
                  <div className="flex-1 mt-3">
                    {sub.topics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {sub.topics.slice(0, 3).map((topicName) => {
                          const topicNotesCount = sub.notes.filter((n) => n.topic === topicName).length;
                          return (
                            <span
                              key={topicName}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubject(sub.name);
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium border truncate max-w-[130px] transition-all hover:scale-105 cursor-pointer ${
                                darkMode
                                  ? 'bg-zinc-750 border-zinc-700 text-zinc-300 hover:border-purple-500'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700'
                              }`}
                              title={`${topicName} (${topicNotesCount} notes)`}
                            >
                              {topicName}
                            </span>
                          );
                        })}
                        {sub.topics.length > 3 && (
                          <span
                            className="text-[10px] font-semibold text-gray-400 self-center px-1"
                            title={sub.topics.slice(3).join(', ')}
                          >
                            +{sub.topics.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No topics yet</span>
                    )}
                  </div>

                  {/* Latest Note preview if present */}
                  {sub.latestNote && (
                    <div className="mt-3 pt-2 text-[11px] text-gray-400 border-t border-gray-100 dark:border-zinc-700/60 flex items-center justify-between">
                      <span className="truncate max-w-[150px] text-gray-600 dark:text-zinc-400 font-medium">
                        {sub.latestNote.title || 'Untitled'}
                      </span>
                      <span>{formatLastUpdated(sub.lastUpdated)}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-700/80 bg-gray-50/40 dark:bg-zinc-800/40 flex items-center justify-between">
                  <button
                    type="button"
                    id={`view-notes-btn-${sub.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubject(sub.name);
                    }}
                    className="text-xs font-semibold text-[#7F56D9] hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View topics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNote(sub.name);
                    }}
                    className="text-xs px-2.5 py-1 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-650 rounded-lg text-gray-700 dark:text-zinc-200 font-medium cursor-pointer shadow-2xs"
                  >
                    + Note
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add New Subject Card */}
          <div
            id="add-subject-grid-card"
            onClick={() => setIsAddSubjectModalOpen(true)}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center text-center min-h-[220px] cursor-pointer hover:-translate-y-0.5 group ${
              darkMode
                ? 'border-zinc-700/80 hover:border-purple-500 bg-zinc-800/30 hover:bg-zinc-800/70 text-zinc-400 hover:text-purple-400'
                : 'border-gray-300 hover:border-purple-400 bg-purple-50/20 hover:bg-purple-50/60 text-gray-500 hover:text-purple-600'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#7F56D9] dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h3
              className={`text-sm font-bold transition-colors ${
                darkMode ? 'group-hover:text-white text-zinc-200' : 'group-hover:text-gray-900 text-gray-800'
              }`}
            >
              + Add New Subject
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 max-w-[190px]">
              Create a custom subject category for organizing your lecture notes
            </p>
          </div>
        </div>
      ) : (
        /* Compact Structured Table / List View with Drag-and-Drop Reordering */
        <div
          className={`rounded-2xl border divide-y overflow-hidden shadow-2xs ${
            darkMode
              ? 'bg-zinc-800/90 border-zinc-700 divide-zinc-700/60'
              : 'bg-white border-gray-200 divide-gray-100'
          }`}
        >
          {filteredSubjects.map((sub) => {
            const SubjectIcon = sub.theme.icon;
            const isDragging = draggedSubject === sub.name;
            const isOver = dragOverSubject === sub.name && draggedSubject !== sub.name;

            return (
              <div
                key={sub.name}
                draggable
                onDragStart={(e) => handleDragStart(e, sub.name)}
                onDragOver={(e) => handleDragOver(e, sub.name)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, sub.name)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (didDragRef.current) return;
                  setSelectedSubject(sub.name);
                }}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                  isDragging
                    ? 'opacity-40 bg-purple-50/50 dark:bg-purple-950/30'
                    : isOver
                    ? 'bg-purple-100/60 dark:bg-purple-900/40 border-l-4 border-l-purple-600'
                    : darkMode
                    ? 'hover:bg-zinc-750'
                    : 'hover:bg-purple-50/20'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Grip Handle for List View */}
                  <div
                    className="p-1 text-gray-300 hover:text-gray-600 dark:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing shrink-0"
                    title="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: darkMode
                        ? `${sub.theme.accent}25`
                        : `${sub.theme.accent}15`,
                      color: sub.theme.accent,
                    }}
                  >
                    <SubjectIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-bold truncate ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {sub.name}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {sub.noteCount} notes
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">
                        {sub.topicCount} topics:
                      </span>
                      {sub.topics.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                      {sub.topics.length > 3 && (
                        <span className="text-[10px] text-gray-400">
                          +{sub.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs text-gray-400 hidden md:inline">
                    {sub.lastUpdated ? formatLastUpdated(sub.lastUpdated) : 'No notes'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNote(sub.name);
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      darkMode
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    + Note
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        existingSubjects={allSubjectNames}
        onSubmit={(newSub, newTop, openEditor) => {
          if (onAddSubject) {
            onAddSubject(newSub, newTop, openEditor);
          } else {
            onCreateNote(newSub, newTop);
          }
        }}
        darkMode={darkMode}
      />
    </div>
  );
};
