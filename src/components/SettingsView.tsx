import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Shield,
  Sun,
  Moon,
  Laptop,
  Type,
  RotateCcw,
  FileText,
  Sparkles,
  Grid,
  List,
  SortAsc,
  Check,
  FileDown,
  Info,
  Monitor,
} from 'lucide-react';
import { AppSettings, NoteItem, PaperStyle } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { BrandingSettings } from './BrandingSettings';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  notes: NoteItem[];
  onImportNotes: (imported: NoteItem[], importedSettings?: Partial<AppSettings>, importedCustomSubjects?: string[]) => void;
  onDeleteAllNotes: () => void;
  onResetSettings: () => void;
  onResetDemoNotes?: () => void;
  customSubjects: string[];
  onDeleteCustomSubject?: (subjectName: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  allSubjects?: string[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  notes,
  onImportNotes,
  onDeleteAllNotes,
  onResetSettings,
  onResetDemoNotes,
  customSubjects,
  onDeleteCustomSubject,
  darkMode,
  onToggleDarkMode,
  allSubjects = [],
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'notes' | 'storage' | 'organization' | 'privacy' | 'data' | 'branding'>('appearance');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Accurate size calculation
  const storageBreakdown = notes.reduce(
    (acc, n) => {
      const textBytes = (n.content?.length || 0) * 2 + (n.title?.length || 0) * 2;
      const textBoxBytes = n.textBoxes
        ? n.textBoxes.reduce((s, tb) => s + (tb.content?.length || 0) * 2, 0)
        : 0;
      const strokeBytes = (n.strokes?.length || 0) * 80;
      const pdfBytes = n.pdfData?.pages
        ? n.pdfData.pages.reduce((s, p) => s + (p.dataUrl?.length || 0), 0)
        : 0;
      const imageBytes = n.fileDataUrl?.length || 0;

      acc.text += textBytes + textBoxBytes;
      acc.strokes += strokeBytes;
      acc.attachments += pdfBytes + imageBytes;
      acc.total += textBytes + textBoxBytes + strokeBytes + pdfBytes + imageBytes;
      acc.strokeCount += n.strokes?.length || 0;
      if (n.pdfData?.totalPages) acc.pdfPages += n.pdfData.totalPages;
      return acc;
    },
    { text: 0, strokes: 0, attachments: 0, total: 0, strokeCount: 0, pdfPages: 0 }
  );

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleExportBackup = () => {
    try {
      const backup = {
        version: 2,
        app: 'NoteStorage',
        exportedAt: new Date().toISOString(),
        notes,
        settings,
        customSubjects,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notestorage-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Complete JSON library backup downloaded successfully!');
    } catch {
      showNotification('Failed to export backup.', 'error');
    }
  };

  const handleExportMarkdownArchive = () => {
    try {
      let fullMarkdown = `# NoteStorage Library Export\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      notes.forEach((note, idx) => {
        fullMarkdown += `## ${idx + 1}. ${note.title || 'Untitled Note'}\n`;
        fullMarkdown += `- **Subject**: ${note.subject || 'General'}\n`;
        fullMarkdown += `- **Topic**: ${note.topic || 'General'}\n`;
        fullMarkdown += `- **Last Updated**: ${new Date(note.updated).toLocaleString()}\n\n`;
        
        // Convert simple HTML tags to plain text / markdown
        const plainText = (note.content || '')
          .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
          .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
          .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
          .replace(/<b>(.*?)<\/b>/gi, '**$1**')
          .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
          .replace(/<i>(.*?)<\/i>/gi, '*$1*')
          .replace(/<em>(.*?)<\/em>/gi, '*$1*')
          .replace(/<p>/gi, '')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<br\s*[\/]?>/gi, '\n')
          .replace(/<[^>]+>/g, '');

        fullMarkdown += `${plainText.trim() || '_No text content_'}\n\n`;
        if (note.textBoxes && note.textBoxes.length > 0) {
          fullMarkdown += `### Text Annotations\n`;
          note.textBoxes.forEach((tb) => {
            const cleanBox = tb.content.replace(/<[^>]+>/g, ' ').trim();
            if (cleanBox) fullMarkdown += `- ${cleanBox}\n`;
          });
          fullMarkdown += '\n';
        }
        fullMarkdown += `---\n\n`;
      });

      const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notestorage-notes-archive-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Exported all notes as clean Markdown archive!');
    } catch {
      showNotification('Failed to generate markdown archive.', 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const data = JSON.parse(raw);
        if (Array.isArray(data.notes)) {
          onImportNotes(data.notes, data.settings, data.customSubjects);
          showNotification(`Successfully restored ${data.notes.length} notes and preferences!`);
        } else if (Array.isArray(data)) {
          onImportNotes(data);
          showNotification(`Successfully imported ${data.length} notes!`);
        } else {
          showNotification('Unsupported JSON format. Make sure it is a NoteStorage backup.', 'error');
        }
      } catch {
        showNotification('Invalid JSON file format. Please upload a valid backup.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const subjectList = Array.from(new Set([...allSubjects, ...customSubjects, 'dbms'])).filter(Boolean).sort();

  return (
    <div className={`flex-1 overflow-y-auto px-6 py-6 select-none max-w-5xl mx-auto w-full ${settings.compact ? 'py-4 px-4' : 'py-6 px-8'}`}>
      {/* Top Heading */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">
            System & Preferences
          </span>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h1>
        </div>

        {/* Live Notification Banner */}
        {notification && (
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-500 text-white'
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-[#7F56D9] text-white'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            {notification.type === 'error' && <RotateCcw className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Settings Tabs */}
        <div className="flex flex-col gap-1">
          {[
            { id: 'appearance', label: 'Appearance' },
            { id: 'notes', label: 'Notes Preferences' },
            { id: 'storage', label: 'Storage & Backup' },
            { id: 'organization', label: 'Organization' },
            { id: 'privacy', label: 'Privacy & Offline' },
            { id: 'data', label: 'Data Management' },
            { id: 'branding', label: 'Logo & Branding' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? darkMode
                    ? 'bg-purple-900/40 text-purple-300 shadow-xs'
                    : 'bg-purple-50 text-[#7F56D9] shadow-xs'
                  : darkMode
                  ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Settings Content */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-xs'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-5 h-5 text-[#7F56D9]" />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Appearance</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">Customize color mode, typography, and density.</p>

              {/* Theme Mode Selector (Light, Dark, System) */}
              <div className="py-4 border-b border-gray-100 dark:border-zinc-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Theme Mode</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">Choose light, dark, or sync with operating system.</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-w-md">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Laptop },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          onUpdateSettings({ theme: t.id as any });
                          showNotification(`Theme set to ${t.label} mode.`);
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                          isActive
                            ? 'border-[#7F56D9] bg-purple-50 text-[#7F56D9] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500 ring-2 ring-purple-500/20'
                            : darkMode
                            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700/50'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Dark Mode Switch */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Dark Mode Toggle</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Instantly switch between light slate and dark slate.</div>
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    darkMode ? 'bg-[#7F56D9]' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                  title="Toggle dark mode"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Compact Spacing */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Compact Spacing</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Reduce margins and paddings for higher note and topic density.</div>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.compact;
                    onUpdateSettings({ compact: next });
                    showNotification(next ? 'Compact spacing enabled.' : 'Standard spacing restored.');
                  }}
                  className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.compact ? 'bg-[#7F56D9]' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.compact ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Smooth Animations */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Smooth Transitions</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Enable UI animations. Turn off for instant snappy responses.</div>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.animations;
                    onUpdateSettings({ animations: next });
                    showNotification(next ? 'Transitions enabled.' : 'Transitions disabled.');
                  }}
                  className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.animations ? 'bg-[#7F56D9]' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.animations ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Note Editor Font Selection */}
              <div className="py-4">
                <div className="mb-3">
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Note Typography</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Select default font style for notes and text boxes.</div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-w-md">
                  {[
                    { id: 'sans', label: 'Clean Sans', fontStyle: 'font-sans' },
                    { id: 'serif', label: 'Editorial Serif', fontStyle: 'font-serif' },
                    { id: 'mono', label: 'Code Mono', fontStyle: 'font-mono' },
                  ].map((f) => {
                    const isSelected = (settings.editorFont || 'sans') === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          onUpdateSettings({ editorFont: f.id as any });
                          showNotification(`Editor font updated to ${f.label}.`);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#7F56D9] bg-purple-50 text-[#7F56D9] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500 ring-2 ring-purple-500/20'
                            : darkMode
                            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700/50'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-base font-bold mb-1 ${f.fontStyle}`}>Aa Bb</div>
                        <div className="text-xs font-semibold">{f.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTES PREFERENCES */}
          {activeTab === 'notes' && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-xs'}`}>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-[#7F56D9]" />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notes Preferences</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">Default layouts, sorting behaviors, and initial paper styles.</p>

              {/* Default View Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Default View Mode</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Display notes in a visual card grid or compact vertical list.</div>
                </div>
                <div className="flex rounded-xl border border-gray-200 dark:border-zinc-700 p-1 bg-gray-50 dark:bg-zinc-800">
                  {[
                    { id: 'grid', label: 'Grid', icon: Grid },
                    { id: 'list', label: 'List', icon: List },
                  ].map((v) => {
                    const Icon = v.icon;
                    const isActive = (settings.defaultView || 'grid') === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          onUpdateSettings({ defaultView: v.id as any });
                          showNotification(`Default view set to ${v.label}.`);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#7F56D9] text-white shadow-xs'
                            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-200/60 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Sort Order */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Default Sorting Order</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">How notes are organized by default across library views.</div>
                </div>
                <select
                  value={settings.defaultSort || 'recent'}
                  onChange={(e) => {
                    onUpdateSettings({ defaultSort: e.target.value as any });
                    showNotification(`Default sort order set to ${e.target.selectedOptions[0].text}.`);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="recent">Most Recently Updated</option>
                  <option value="name">Title: Alphabetical (A-Z)</option>
                  <option value="name-desc">Title: Reverse (Z-A)</option>
                  <option value="oldest">Date Created: Oldest First</option>
                </select>
              </div>

              {/* Default Paper Style */}
              <div className="py-4">
                <div className="mb-3">
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Default Paper Style</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Background ruling pattern automatically assigned to new notes.</div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-w-md">
                  {[
                    { id: 'ruled', label: 'Ruled Lines', desc: 'College ruled paper' },
                    { id: 'blank', label: 'Blank Page', desc: 'Pure white canvas' },
                    { id: 'grid', label: 'Grid Mesh', desc: 'Square graph mesh' },
                  ].map((p) => {
                    const isSelected = (settings.defaultPaperStyle || 'ruled') === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onUpdateSettings({ defaultPaperStyle: p.id as PaperStyle });
                          showNotification(`Default paper set to ${p.label}.`);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#7F56D9] bg-purple-50 text-[#7F56D9] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500 ring-2 ring-purple-500/20'
                            : darkMode
                            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700/50'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xs font-bold mb-0.5">{p.label}</div>
                        <div className="text-[10px] text-gray-400">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STORAGE & BACKUP */}
          {activeTab === 'storage' && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-xs'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-5 h-5 text-[#7F56D9]" />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Storage & Backup</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">Inspect local database consumption, download backups, or restore archives.</p>

              {/* Storage Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl mb-6 bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-700">
                <div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Total Storage</div>
                  <div className={`text-lg font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatBytes(storageBreakdown.total)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Notes Count</div>
                  <div className={`text-lg font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {notes.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Drawings</div>
                  <div className={`text-lg font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {storageBreakdown.strokeCount} strokes
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">PDF Pages</div>
                  <div className={`text-lg font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {storageBreakdown.pdfPages} pages
                  </div>
                </div>
              </div>

              {/* Export Full JSON Backup */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Export Full JSON Backup</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Download complete library with stroke vectors, PDFs, and custom subjects.</div>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#7F56D9] text-white rounded-xl text-xs font-semibold hover:bg-[#6941C6] transition-colors shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup (.json)</span>
                </button>
              </div>

              {/* Export All as Markdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Export Notes as Markdown (.md)</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Generate an open-format plaintext archive readable in any editor or Obsidian.</div>
                </div>
                <button
                  onClick={handleExportMarkdownArchive}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 dark:border-zinc-600 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#7F56D9]" />
                  <span>Export Markdown</span>
                </button>
              </div>

              {/* Import Backup */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Restore Library Backup</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Upload a previously saved `.json` file to restore your notes and settings.</div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 text-[#7F56D9] dark:text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Restore</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 4: ORGANIZATION */}
          {activeTab === 'organization' && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-xs'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-[#7F56D9]" />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Organization</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">Subject assignment rules, custom folders, and deletion safety prompts.</p>

              {/* Remember Last Subject */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Remember Last Subject</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">
                    Automatically tag new notes with your most recently used subject ({settings.lastSubject || 'dbms'}).
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.rememberLastSubject;
                    onUpdateSettings({ rememberLastSubject: next });
                    showNotification(next ? 'Remember last subject enabled.' : 'Remember last subject disabled.');
                  }}
                  className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.rememberLastSubject ? 'bg-[#7F56D9]' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.rememberLastSubject ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Default Note Subject */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Default Fallback Subject</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">Used when creating fresh notes outside a specific subject view.</div>
                </div>
                <select
                  value={settings.defaultSubject || 'dbms'}
                  onChange={(e) => {
                    onUpdateSettings({ defaultSubject: e.target.value });
                    showNotification(`Default fallback subject set to "${e.target.value}".`);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                >
                  {subjectList.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirm Before Deleting */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-zinc-700">
                <div>
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Confirm Before Deleting Notes</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">
                    Always prompt a safe in-app confirmation dialog before discarding any note.
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = !settings.confirmDelete;
                    onUpdateSettings({ confirmDelete: next });
                    showNotification(next ? 'Delete confirmation prompt active.' : 'Delete confirmation turned off.');
                  }}
                  className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.confirmDelete ? 'bg-[#7F56D9]' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      settings.confirmDelete ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Custom Subjects Manager */}
              <div className="py-4">
                <div className="mb-3">
                  <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Subjects & Topics</div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">All registered subjects in your workspace.</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {subjectList.map((sub) => {
                    const count = notes.filter((n) => n.subject?.toLowerCase() === sub.toLowerCase()).length;
                    const isCustom = customSubjects.includes(sub);
                    return (
                      <div
                        key={sub}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                          darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-gray-50 border-gray-200 text-gray-800'
                        }`}
                      >
                        <span>{sub}</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-purple-100 dark:bg-purple-950/60 text-[#7F56D9] dark:text-purple-300">
                          {count} note{count !== 1 ? 's' : ''}
                        </span>
                        {isCustom && onDeleteCustomSubject && (
                          <button
                            onClick={() => {
                              onDeleteCustomSubject(sub);
                              showNotification(`Subject "${sub}" removed from custom list.`);
                            }}
                            className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                            title="Remove subject"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & OFFLINE */}
          {activeTab === 'privacy' && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-xs'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-[#12B76A]" />
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Privacy & Offline Resilience</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">NoteStorage runs client-side with persistent offline durability.</p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <CheckCircle2 className="w-5 h-5 text-[#12B76A] shrink-0 mt-0.5" />
                  <div>
                    <div className={`text-sm font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>100% Local-First Storage</div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Your handwritten strokes, rich text, and attached documents are stored directly in your browser's IndexedDB and localStorage sandbox. They are never sent to third-party telemetry servers.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
                  <CheckCircle2 className="w-5 h-5 text-[#7F56D9] shrink-0 mt-0.5" />
                  <div>
                    <div className={`text-sm font-bold ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>Zero-Latency Offline Execution</div>
                    <div className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                      Full editing capabilities, stroke rendering, undo/redo history, and PDF annotation work with zero internet connectivity.
                    </div>
                  </div>
                </div>

                {/* Desktop App Installation Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50">
                  <div className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-[#7F56D9] shrink-0 mt-0.5" />
                    <div>
                      <div className={`text-sm font-bold ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
                        Standalone Desktop Application
                      </div>
                      <div className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                        Install NoteStorage directly onto your Mac, Windows, or Chromebook for native desktop windowing and 1-click dock access.
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <PWAInstallButton variant="settings" darkMode={darkMode} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATA MANAGEMENT */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              {/* Reset Settings */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-xs'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw className="w-5 h-5 text-[#7F56D9]" />
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reset Preferences</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5">Restore all appearance, note, and organization settings to factory defaults without losing any of your notes.</p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reset Settings to Default</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">Reverts theme, font, sort order, and compact spacing.</div>
                  </div>
                  <button
                    onClick={() => {
                      onResetSettings();
                      showNotification('All settings have been reset to factory defaults.');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 dark:border-zinc-600 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Settings</span>
                  </button>
                </div>
              </div>

              {/* Sample Notes Restore (if provided) */}
              {onResetDemoNotes && (
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-zinc-800/60 border-zinc-700' : 'bg-white border-gray-200 shadow-xs'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-[#7F56D9]" />
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Restore Starter Notes</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5">Load tutorial study notes and sample subjects (DBMS, Architecture) if your library is empty.</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Seed Sample Notes</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400">Adds guided notes demonstrating drawing, text boxes, and subject grouping.</div>
                    </div>
                    <button
                      onClick={() => {
                        onResetDemoNotes();
                        showNotification('Starter sample notes loaded into your library!');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/40 text-[#7F56D9] dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-colors shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Sample Notes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className={`p-6 rounded-2xl border border-red-200 dark:border-red-900/40 ${darkMode ? 'bg-red-950/10' : 'bg-red-50/30'}`}>
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">Danger Zone</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">Irreversible actions that purge local database storage.</p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400">Delete All Notes</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">Permanently erase every subject, topic, drawing, and note in this browser.</div>
                  </div>
                  <button
                    onClick={onDeleteAllNotes}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 shadow-sm shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Everything</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LOGO & BRANDING */}
          {activeTab === 'branding' && (
            <BrandingSettings
              darkMode={darkMode}
              inline
              onSuccessNotice={(msg) => showNotification(msg)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
