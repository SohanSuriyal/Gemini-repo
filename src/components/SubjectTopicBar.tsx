import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface SubjectTopicBarProps {
  subject: string;
  topic: string;
  subjectsList: string[];
  topicsList: string[];
  onSubjectChange: (newSubject: string) => void;
  onTopicChange: (newTopic: string) => void;
  darkMode?: boolean;
}

export const SubjectTopicBar: React.FC<SubjectTopicBarProps> = ({
  subject,
  topic,
  subjectsList,
  topicsList,
  onSubjectChange,
  onTopicChange,
  darkMode = false,
}) => {
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [newTopicInput, setNewTopicInput] = useState('');
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newSubjectInput.trim();
    if (val) {
      onSubjectChange(val);
      setNewSubjectInput('');
      setShowNewSubject(false);
      setIsSubjectOpen(false);
    }
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newTopicInput.trim();
    if (val) {
      onTopicChange(val);
      setNewTopicInput('');
      setShowNewTopic(false);
      setIsTopicOpen(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3.5 select-none">
      {/* Subject Selector */}
      <div className="relative">
        <label className="block text-sm font-normal text-gray-600 dark:text-zinc-400 mb-1.5">
          Subject
        </label>
        <div
          id="subject-selector-box"
          onClick={() => {
            setIsSubjectOpen(!isSubjectOpen);
            setIsTopicOpen(false);
          }}
          className={`flex items-center justify-between h-[42px] px-3.5 py-2 rounded-xl border transition-colors cursor-pointer ${
            darkMode
              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100 hover:border-zinc-600'
              : 'bg-white border-[#D0D5DD] text-gray-900 hover:border-gray-400 shadow-2xs'
          }`}
        >
          <span className="text-sm font-normal truncate">
            {subject || 'Select or type subject'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 dark:text-zinc-400 transition-transform ${
              isSubjectOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown Menu */}
        {isSubjectOpen && (
          <div
            className={`absolute left-0 right-0 top-[72px] z-30 rounded-xl border p-1.5 shadow-lg ${
              darkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="max-h-48 overflow-y-auto">
              {subjectsList.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onSubjectChange(s);
                    setIsSubjectOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    s === subject
                      ? darkMode
                        ? 'bg-purple-900/30 text-purple-300 font-medium'
                        : 'bg-purple-50 text-purple-700 font-medium'
                      : darkMode
                      ? 'hover:bg-zinc-700/60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="pt-1.5 mt-1 border-t border-gray-100 dark:border-zinc-700">
              {showNewSubject ? (
                <form onSubmit={handleAddSubject} className="flex gap-1.5 p-1">
                  <input
                    type="text"
                    placeholder="New subject..."
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    autoFocus
                    className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                      darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-[#7F56D9] text-white rounded-lg text-xs font-medium hover:bg-[#6941C6]"
                  >
                    Add
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewSubject(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#7F56D9] dark:text-purple-400 font-medium hover:bg-purple-50/50 dark:hover:bg-purple-950/20 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create custom subject</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Topic Selector */}
      <div className="relative">
        <label className="block text-sm font-normal text-gray-600 dark:text-zinc-400 mb-1.5">
          Topic
        </label>
        <div
          id="topic-selector-box"
          onClick={() => {
            setIsTopicOpen(!isTopicOpen);
            setIsSubjectOpen(false);
          }}
          className={`flex items-center justify-between h-[42px] px-3.5 py-2 rounded-xl border transition-colors cursor-pointer ${
            darkMode
              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100 hover:border-zinc-600'
              : 'bg-white border-[#D0D5DD] text-gray-900 hover:border-gray-400 shadow-2xs'
          }`}
        >
          <span className="text-sm font-normal truncate">
            {topic || 'Select or type topic'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 dark:text-zinc-400 transition-transform ${
              isTopicOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown Menu */}
        {isTopicOpen && (
          <div
            className={`absolute left-0 right-0 top-[72px] z-30 rounded-xl border p-1.5 shadow-lg ${
              darkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="max-h-48 overflow-y-auto">
              {topicsList.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onTopicChange(t);
                    setIsTopicOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    t === topic
                      ? darkMode
                        ? 'bg-purple-900/30 text-purple-300 font-medium'
                        : 'bg-purple-50 text-purple-700 font-medium'
                      : darkMode
                      ? 'hover:bg-zinc-700/60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="pt-1.5 mt-1 border-t border-gray-100 dark:border-zinc-700">
              {showNewTopic ? (
                <form onSubmit={handleAddTopic} className="flex gap-1.5 p-1">
                  <input
                    type="text"
                    placeholder="New topic..."
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    autoFocus
                    className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                      darkMode
                        ? 'bg-zinc-900 border-zinc-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-[#7F56D9] text-white rounded-lg text-xs font-medium hover:bg-[#6941C6]"
                  >
                    Add
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewTopic(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#7F56D9] dark:text-purple-400 font-medium hover:bg-purple-50/50 dark:hover:bg-purple-950/20 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create custom topic</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
