import React, { useState } from 'react';
import { Download, Monitor, Share, PlusSquare, Check, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'settings' | 'header';
  darkMode?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'sidebar',
  darkMode = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and running in standalone window, show subtle status badge in settings, otherwise hide in sidebar
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800/50">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Running as Desktop App</span>
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          id="pwa-install-sidebar-btn"
          onClick={handleAction}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-[#7F56D9] dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 transition-all shadow-2xs group cursor-pointer"
          title="Install NoteStorage as a standalone Desktop App"
        >
          <div className="w-6 h-6 rounded-lg bg-[#7F56D9] text-white flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Monitor className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 text-left truncate">
            <span className="block truncate">Install Desktop App</span>
          </div>
          <Download className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-600 transition-colors" />
        </button>
      )}

      {variant === 'settings' && (
        <button
          type="button"
          id="pwa-install-settings-btn"
          onClick={handleAction}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#7F56D9] hover:bg-[#6941C6] active:bg-[#53389E] text-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <Monitor className="w-4 h-4" />
          <span>{isInstallable ? 'Install Desktop App' : 'How to Install App'}</span>
        </button>
      )}

      {variant === 'header' && (
        <button
          type="button"
          id="pwa-install-header-btn"
          onClick={handleAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/80 dark:bg-purple-950/30 text-xs font-semibold text-[#7F56D9] dark:text-purple-300 hover:bg-purple-100 transition-colors"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install Desktop App</span>
        </button>
      )}

      {/* Installation Guide Dialog */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowGuide(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
              darkMode
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#7F56D9] flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Install NoteStorage as Desktop App</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Standalone window, offline support & fast access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm">
                <p className="text-xs text-gray-600 dark:text-zinc-300">
                  To install on iOS Safari:
                </p>
                <ol className="space-y-2.5 text-xs text-gray-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7F56D9] flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      1
                    </span>
                    <span>
                      Tap the <Share className="w-3.5 h-3.5 inline text-blue-500 mx-1" /> <strong>Share</strong> button in Safari's bottom toolbar.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7F56D9] flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      2
                    </span>
                    <span>
                      Scroll down and select <PlusSquare className="w-3.5 h-3.5 inline text-gray-700 dark:text-zinc-200 mx-1" /> <strong>Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7F56D9] flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      3
                    </span>
                    <span>Tap <strong>Add</strong> in the top right corner.</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> Desktop Installation (Chrome / Edge / Brave):
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Look at your browser's address bar (top-right). Click the <strong>Install</strong> icon (computer with down arrow) or open the browser menu (⋮) → <strong>Save and Share</strong> → <strong>Install NoteStorage</strong>.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-gray-600 dark:text-zinc-300 pt-1">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>Runs in its own distraction-free desktop window without browser tabs.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>Works fully offline with all your notes and drawings stored locally.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>Pin to your macOS Dock or Windows Taskbar for 1-click launch.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
