import React, { useRef, useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  X,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { removeImageBackground } from '../utils/imageProcessing';

export interface BrandingSettingsData {
  dataUrl: string | null;
  fileName: string;
  size: number;
  position: 'left' | 'right' | 'replace';
  showName: boolean;
}

const STORAGE_KEY = 'ns_branding';
export const DEFAULT_THUNDER_CHARACTER = `${import.meta.env.BASE_URL || '/'}thunder-character.png`;

const DEFAULT_BRANDING: BrandingSettingsData = {
  dataUrl: DEFAULT_THUNDER_CHARACTER,
  fileName: 'thunder-character.png',
  size: 96,
  position: 'replace',
  showName: false,
};

export const loadBrandingSettings = (): BrandingSettingsData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_BRANDING;
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_BRANDING,
      ...parsed,
      dataUrl: parsed.dataUrl || DEFAULT_THUNDER_CHARACTER,
      showName: false,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
};

export interface BrandingSettingsProps {
  darkMode: boolean;
  onClose?: () => void;
  inline?: boolean;
  onSuccessNotice?: (msg: string) => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  darkMode,
  onClose,
  inline = false,
  onSuccessNotice,
}) => {
  const [branding, setBranding] = useState<BrandingSettingsData>(loadBrandingSettings);
  const [pending, setPending] = useState<BrandingSettingsData>(loadBrandingSettings);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
      setBranding(pending);
      window.dispatchEvent(new Event('ns-branding-updated'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onSuccessNotice) {
        onSuccessNotice('Logo & branding settings saved successfully!');
      }
      if (onClose) {
        onClose();
      }
    } catch {
      setError('Could not save the logo. The image may be too large for browser storage.');
    }
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBranding(DEFAULT_BRANDING);
    setPending(DEFAULT_BRANDING);
    setError('');
    window.dispatchEvent(new Event('ns-branding-updated'));
    if (onSuccessNotice) {
      onSuccessNotice('Reset to default mascot PNG branding.');
    }
  };

  const processFile = async (file: File) => {
    setError('');
    const validTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please choose a PNG, WebP, JPEG, or SVG image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Please use an image smaller than 8 MB.');
      return;
    }

    setIsProcessing(true);
    try {
      if (autoRemoveBg && file.type !== 'image/svg+xml') {
        const transparentPng = await removeImageBackground(file);
        setPending((prev) => ({
          ...prev,
          dataUrl: transparentPng,
          fileName: file.name.replace(/\.[^/.]+$/, '') + '-transparent.png',
        }));
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setPending((prev) => ({
            ...prev,
            dataUrl: reader.result as string,
            fileName: file.name,
          }));
        };
        reader.onerror = () => setError('Could not read image file.');
        reader.readAsDataURL(file);
      }
    } catch (e) {
      console.error('Error processing image:', e);
      // Fallback to normal read
      const reader = new FileReader();
      reader.onload = () => {
        setPending((prev) => ({
          ...prev,
          dataUrl: reader.result as string,
          fileName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualRemoveBg = async () => {
    if (!pending.dataUrl) return;
    setIsProcessing(true);
    setError('');
    try {
      const transparentPng = await removeImageBackground(pending.dataUrl);
      setPending((prev) => ({
        ...prev,
        dataUrl: transparentPng,
        fileName: (prev.fileName || 'character').replace(/\.[^/.]+$/, '') + '-transparent.png',
      }));
    } catch (err) {
      setError('Failed to remove background from current image.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const previewLogo = pending.dataUrl;
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-zinc-400' : 'text-gray-500';
  const cardClass = darkMode
    ? 'bg-zinc-800/80 border-zinc-700'
    : 'bg-white border-gray-200 shadow-xs';

  const bodyContent = (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardClass}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#7F56D9]" />
            <h3 className={`text-lg font-bold ${textClass}`}>Upload Character PNG</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Auto-removes background
          </span>
        </div>
        <p className={`text-xs mb-4 ${mutedClass}`}>
          Upload your PNG. White and light backgrounds are automatically removed so only the character appears on your sidebar.
        </p>

        {/* Auto remove background toggle */}
        <label className="flex items-center gap-2 mb-4 text-xs font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRemoveBg}
            onChange={(e) => setAutoRemoveBg(e.target.checked)}
            className="rounded accent-[#7F56D9] w-4 h-4 cursor-pointer"
          />
          <span className={textClass}>Automatically remove solid white background on upload (Transparent PNG)</span>
        </label>

        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging
              ? 'border-[#7F56D9] bg-purple-50 dark:bg-purple-950/30'
              : 'border-purple-200 dark:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-8 h-8 border-3 border-[#7F56D9] border-t-transparent rounded-full animate-spin mb-3" />
              <div className={`text-sm font-semibold ${textClass}`}>Processing image & removing background...</div>
            </div>
          ) : previewLogo ? (
            <div className="flex flex-col items-center">
              <div
                style={{ width: Math.min(pending.size, 120), height: Math.min(pending.size, 120) }}
                className="mx-auto mb-3 flex items-center justify-center rounded-xl p-1"
              >
                <img
                  src={previewLogo}
                  alt="Character preview"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div className={`text-sm font-semibold ${textClass}`}>
                {dragging ? 'Drop new PNG here' : 'Click or drop to replace character image'}
              </div>
              <div className={`text-xs mt-1 ${mutedClass}`}>Supports PNG, JPEG, WebP (background auto-removed)</div>
            </div>
          ) : (
            <>
              <Upload className="w-9 h-9 mx-auto mb-3 text-[#7F56D9]" />
              <div className={`text-sm font-semibold ${textClass}`}>
                {dragging ? 'Drop your character PNG here' : 'Drag & drop your character image here'}
              </div>
              <div className={`text-xs mt-1 ${mutedClass}`}>or click to browse from device</div>
              <span className="inline-flex mt-4 px-4 py-2 rounded-lg bg-[#7F56D9] text-white text-xs font-semibold">
                Choose Image File
              </span>
            </>
          )}
        </div>

        {pending.dataUrl && (
          <div className={`mt-3 flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-zinc-900' : 'bg-gray-50'}`}>
            <div className="w-12 h-12 flex items-center justify-center rounded-lg">
              <img src={pending.dataUrl} alt="Current logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-semibold truncate ${textClass}`}>{pending.fileName || 'Character PNG'}</div>
              <div className={`text-xs ${mutedClass}`}>Only character displayed without background</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleManualRemoveBg();
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-medium cursor-pointer"
              title="Remove background from current image"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Strip BG</span>
            </button>
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPending((prev) => ({ ...prev, dataUrl: DEFAULT_THUNDER_CHARACTER, fileName: 'thunder-character.png' }));
              }}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-pointer flex-shrink-0"
              title="Reset to default character"
            >
              <X className={`w-4 h-4 ${mutedClass}`} />
            </button>
          </div>
        )}
      </div>

      <div className={`p-6 rounded-2xl border ${cardClass}`}>
        <h3 className={`text-base font-bold mb-4 ${textClass}`}>Mascot Display</h3>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className={`text-sm font-semibold ${textClass}`}>Character Size</div>
              <div className={`text-xs ${mutedClass}`}>Adjust how large the girl character appears in the sidebar.</div>
            </div>
            <span className="text-xs font-semibold text-[#7F56D9]">{pending.size}px</span>
          </div>
          <input
            type="range"
            min="48"
            max="140"
            value={pending.size}
            onChange={(e) => setPending((prev) => ({ ...prev, size: Number(e.target.value) }))}
            className="w-full accent-[#7F56D9]"
          />
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 text-xs font-semibold">{error}</div>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={reset} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${darkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
          <RotateCcw className="w-4 h-4" /> Reset Default PNG
        </button>
        <button onClick={save} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7F56D9] text-white text-xs font-semibold hover:bg-[#6941C6] cursor-pointer transition-colors shadow-xs">
          <Check className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </div>
  );

  if (inline) {
    return bodyContent;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${cardClass}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-700">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#7F56D9]" />
              <h2 className={`text-xl font-bold ${textClass}`}>Logo & Branding</h2>
            </div>
            <p className={`text-xs mt-1 ${mutedClass}`}>
              Upload your own image and customize how it appears in Thunder Notebook.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700" title="Close">
            <X className={`w-5 h-5 ${mutedClass}`} />
          </button>
        </div>

        <div className="p-6">
          {bodyContent}
        </div>
      </div>
    </div>
  );
};
