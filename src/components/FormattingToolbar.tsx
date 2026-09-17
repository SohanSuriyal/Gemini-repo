import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronDown,
  List,
  ListOrdered,
  CheckSquare,
  Image as ImageIcon,
  Clipboard,
  PenTool,
  MoreHorizontal,
  Check,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  FileText,
  Upload,
  Grid3X3,
  AlignJustify,
  Square,
  Highlighter,
  Palette,
  RotateCcw,
  Type,
  Search,
  Minus,
  Plus,
} from 'lucide-react';
import { PaperStyle } from '../types';

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'Modern' | 'Handwriting' | 'Serif' | 'Monospace' | 'Classic';
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // Clean Modern Sans
  {
    id: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'Modern',
    description: 'Clean & modern note font',
  },
  {
    id: 'inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    category: 'Modern',
    description: 'Highly legible interface sans',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    category: 'Modern',
    description: 'Balanced geometric typography',
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    family: "'Open Sans', sans-serif",
    category: 'Modern',
    description: 'Neutral & open screen font',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'Modern',
    description: 'Stylish display sans-serif',
  },

  // Handwriting & Notebook
  {
    id: 'caveat',
    name: 'Caveat',
    family: "'Caveat', cursive",
    category: 'Handwriting',
    description: 'Natural handwritten script',
  },
  {
    id: 'patrick-hand',
    name: 'Patrick Hand',
    family: "'Patrick Hand', cursive",
    category: 'Handwriting',
    description: 'Clean notebook marker style',
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    family: "'Dancing Script', cursive",
    category: 'Handwriting',
    description: 'Fluid cursive calligraphy',
  },
  {
    id: 'comic-sans-ms',
    name: 'Comic Sans MS',
    family: "'Comic Sans MS', cursive, sans-serif",
    category: 'Handwriting',
    description: 'Playful informal note style',
  },

  // Serif & Editorial
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'Serif',
    description: 'High-contrast luxury serif',
  },
  {
    id: 'lora',
    name: 'Lora',
    family: "'Lora', serif",
    category: 'Serif',
    description: 'Warm, contemporary literary serif',
  },
  {
    id: 'georgia',
    name: 'Georgia',
    family: "Georgia, serif",
    category: 'Serif',
    description: 'Classic screen-optimized serif',
  },
  {
    id: 'times-new-roman',
    name: 'Times New Roman',
    family: "'Times New Roman', Times, serif",
    category: 'Serif',
    description: 'Formal academic standard serif',
  },

  // Code & Monospace
  {
    id: 'fira-code',
    name: 'Fira Code',
    family: "'Fira Code', monospace",
    category: 'Monospace',
    description: 'Developer code & technical monospace',
  },
  {
    id: 'courier-new',
    name: 'Courier New',
    family: "'Courier New', Courier, monospace",
    category: 'Monospace',
    description: 'Vintage typewriter monospace',
  },

  // Universal Classics
  {
    id: 'arial',
    name: 'Arial',
    family: "Arial, Helvetica, sans-serif",
    category: 'Classic',
    description: 'Standard neutral sans-serif',
  },
  {
    id: 'verdana',
    name: 'Verdana',
    family: "Verdana, Geneva, sans-serif",
    category: 'Classic',
    description: 'Wide proportions for clear reading',
  },
  {
    id: 'trebuchet-ms',
    name: 'Trebuchet MS',
    family: "'Trebuchet MS', sans-serif",
    category: 'Classic',
    description: 'Humanist geometric sans-serif',
  },
];

export const FONT_SIZES = [
  { label: '11', value: '11px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
  { label: '40', value: '40px' },
];

export const FONT_SIZE_STEPS = [11, 12, 14, 16, 18, 20, 24, 28, 32, 40];

export interface TextColorOption {
  name: string;
  hex: string;
}

export const TEXT_COLOR_PALETTE: TextColorOption[] = [
  // Neutrals & Monochromes
  { name: 'Black', hex: '#000000' },
  { name: 'Charcoal', hex: '#1F2937' },
  { name: 'Slate Gray', hex: '#4B5563' },
  { name: 'Cool Gray', hex: '#6B7280' },
  { name: 'Light Gray', hex: '#9CA3AF' },
  { name: 'Warm Brown', hex: '#78350F' },
  { name: 'Wine / Maroon', hex: '#831843' },
  { name: 'Dark Red', hex: '#991B1B' },

  // Vibrant Core Colors
  { name: 'Red', hex: '#DC2626' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Sky Blue', hex: '#0284C7' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Indigo', hex: '#4F46E5' },

  // Creative & Accent Tones
  { name: 'OneNote Purple', hex: '#7F56D9' },
  { name: 'Violet', hex: '#9333EA' },
  { name: 'Magenta', hex: '#C026D3' },
  { name: 'Pink Rose', hex: '#E11D48' },
  { name: 'Hot Pink', hex: '#DB2777' },
  { name: 'Goldenrod', hex: '#CA8A04' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Dark Teal', hex: '#115E59' },

  // Light / Pastel & High-Contrast Tones
  { name: 'Soft Red', hex: '#F87171' },
  { name: 'Soft Orange', hex: '#FB923C' },
  { name: 'Soft Yellow', hex: '#FACC15' },
  { name: 'Soft Green', hex: '#4ADE80' },
  { name: 'Soft Teal', hex: '#2DD4BF' },
  { name: 'Soft Sky', hex: '#38BDF8' },
  { name: 'Soft Purple', hex: '#C084FC' },
  { name: 'Soft Pink', hex: '#F472B6' },
];

export const TEXT_HIGHLIGHT_PALETTE: TextColorOption[] = [
  { name: 'Yellow', hex: '#FEF08A' },
  { name: 'Bright Green', hex: '#BBF7D0' },
  { name: 'Sky Blue', hex: '#BAE6FD' },
  { name: 'Soft Pink', hex: '#FBCFE8' },
  { name: 'Soft Lavender', hex: '#E9D5FF' },
  { name: 'Soft Peach', hex: '#FED7AA' },
  { name: 'Light Mint', hex: '#A7F3D0' },
  { name: 'Soft Gray', hex: '#E5E7EB' },
];

export interface IndexingStyleOption {
  id: string;
  name: string;
  styleType: string;
  badge: string;
  examples: string[];
  description: string;
}

export const NUMBERED_INDEXING_OPTIONS: IndexingStyleOption[] = [
  {
    id: 'decimal',
    name: '1, 2, 3',
    styleType: 'decimal',
    badge: '1.',
    examples: ['1. First item', '2. Second item', '3. Third item'],
    description: 'Standard numbers',
  },
  {
    id: 'lower-alpha',
    name: 'a, b, c',
    styleType: 'lower-alpha',
    badge: 'a.',
    examples: ['a. First item', 'b. Second item', 'c. Third item'],
    description: 'Lowercase alphabet',
  },
  {
    id: 'upper-alpha',
    name: 'A, B, C',
    styleType: 'upper-alpha',
    badge: 'A.',
    examples: ['A. First item', 'B. Second item', 'C. Third item'],
    description: 'Uppercase alphabet',
  },
  {
    id: 'lower-roman',
    name: 'i, ii, iii',
    styleType: 'lower-roman',
    badge: 'i.',
    examples: ['i. First item', 'ii. Second item', 'iii. Third item'],
    description: 'Lowercase Roman numerals',
  },
  {
    id: 'upper-roman',
    name: 'I, II, III',
    styleType: 'upper-roman',
    badge: 'I.',
    examples: ['I. First item', 'II. Second item', 'III. Third item'],
    description: 'Uppercase Roman numerals',
  },
  {
    id: 'decimal-leading-zero',
    name: '01, 02, 03',
    styleType: 'decimal-leading-zero',
    badge: '01.',
    examples: ['01. First item', '02. Second item', '03. Third item'],
    description: 'Leading zero numbers',
  },
  {
    id: 'lower-greek',
    name: 'α, β, γ',
    styleType: 'lower-greek',
    badge: 'α.',
    examples: ['α. First item', 'β. Second item', 'γ. Third item'],
    description: 'Lowercase Greek letters',
  },
];

export const BULLET_INDEXING_OPTIONS: IndexingStyleOption[] = [
  {
    id: 'disc',
    name: 'Disc',
    styleType: 'disc',
    badge: '•',
    examples: ['• First item', '• Second item'],
    description: 'Solid circular bullet',
  },
  {
    id: 'circle',
    name: 'Circle',
    styleType: 'circle',
    badge: '◦',
    examples: ['◦ First item', '◦ Second item'],
    description: 'Hollow round ring',
  },
  {
    id: 'square',
    name: 'Square',
    styleType: 'square',
    badge: '▪',
    examples: ['▪ First item', '▪ Second item'],
    description: 'Solid square marker',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    styleType: "'◆  '",
    badge: '◆',
    examples: ['◆ First item', '◆ Second item'],
    description: 'Diamond symbol',
  },
  {
    id: 'arrow',
    name: 'Arrow',
    styleType: "'➢  '",
    badge: '➢',
    examples: ['➢ First item', '➢ Second item'],
    description: 'Pointer arrow',
  },
  {
    id: 'dash',
    name: 'Dash',
    styleType: "'–  '",
    badge: '–',
    examples: ['– First item', '– Second item'],
    description: 'Minimalist hyphen dash',
  },
  {
    id: 'star',
    name: 'Star',
    styleType: "'★  '",
    badge: '★',
    examples: ['★ First item', '★ Second item'],
    description: 'Highlight star',
  },
  {
    id: 'check',
    name: 'Check',
    styleType: "'✓  '",
    badge: '✓',
    examples: ['✓ First item', '✓ Second item'],
    description: 'Checkmark bullet',
  },
];

interface FormattingToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onApplyListStyle?: (command: 'insertOrderedList' | 'insertUnorderedList', styleType?: string) => void;
  onInsertChecklist: () => void;
  onInsertImageFile: (file: File) => void;
  onPasteImage: () => void;
  onInsertPdfFile?: (file: File) => void;
  hasPdf?: boolean;
  paperStyle?: PaperStyle;
  onPaperStyleChange?: (style: PaperStyle) => void;
  drawingOpen: boolean;
  onToggleDrawing: () => void;
  darkMode?: boolean;
  activeFontFamily?: string;
  activeFontSize?: string;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onFormat,
  onApplyListStyle,
  onInsertChecklist,
  onInsertImageFile,
  onPasteImage,
  onInsertPdfFile,
  hasPdf = false,
  paperStyle = 'blank',
  onPaperStyleChange,
  drawingOpen,
  onToggleDrawing,
  darkMode = false,
  activeFontFamily,
  activeFontSize,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown states
  const [showNumberMenu, setShowNumberMenu] = useState(false);
  const [showBulletMenu, setShowBulletMenu] = useState(false);
  const [showParagraphMenu, setShowParagraphMenu] = useState(false);
  const [showPaperMenu, setShowPaperMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);

  // Font family & size state
  const [currentFont, setCurrentFont] = useState<FontOption>(() => {
    try {
      const savedId = localStorage.getItem('onenote_last_font_id');
      const found = FONT_OPTIONS.find((f) => f.id === savedId);
      return found || FONT_OPTIONS[0];
    } catch {
      return FONT_OPTIONS[0];
    }
  });

  const [currentFontSize, setCurrentFontSize] = useState<string>(() => {
    try {
      return localStorage.getItem('onenote_last_font_size') || '16px';
    } catch {
      return '16px';
    }
  });

  const [fontSearch, setFontSearch] = useState('');
  const [selectedFontCategory, setSelectedFontCategory] = useState<
    'All' | 'Modern' | 'Handwriting' | 'Serif' | 'Monospace' | 'Classic'
  >('All');

  // Sync external active font/size if provided
  useEffect(() => {
    if (activeFontFamily) {
      const found = FONT_OPTIONS.find(
        (f) =>
          f.name.toLowerCase() === activeFontFamily.toLowerCase() ||
          f.family.toLowerCase().includes(activeFontFamily.toLowerCase()) ||
          f.id === activeFontFamily
      );
      if (found) {
        setCurrentFont(found);
      }
    }
  }, [activeFontFamily]);

  useEffect(() => {
    if (activeFontSize) {
      setCurrentFontSize(activeFontSize);
    }
  }, [activeFontSize]);

  // Text Color & Highlight states
  const [currentTextColor, setCurrentTextColor] = useState(() => {
    try {
      return localStorage.getItem('onenote_last_text_color') || '#7F56D9';
    } catch {
      return '#7F56D9';
    }
  });
  const [currentHighlightColor, setCurrentHighlightColor] = useState('#FEF08A');
  const [customHexInput, setCustomHexInput] = useState('');

  // Selected styles
  const [selectedNumberStyle, setSelectedNumberStyle] = useState('decimal');
  const [selectedBulletStyle, setSelectedBulletStyle] = useState('disc');

  const numberMenuRef = useRef<HTMLDivElement>(null);
  const bulletMenuRef = useRef<HTMLDivElement>(null);
  const paragraphMenuRef = useRef<HTMLDivElement>(null);
  const paperMenuRef = useRef<HTMLDivElement>(null);
  const textColorMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const fontSizeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (numberMenuRef.current && !numberMenuRef.current.contains(target)) {
        setShowNumberMenu(false);
      }
      if (bulletMenuRef.current && !bulletMenuRef.current.contains(target)) {
        setShowBulletMenu(false);
      }
      if (paragraphMenuRef.current && !paragraphMenuRef.current.contains(target)) {
        setShowParagraphMenu(false);
      }
      if (paperMenuRef.current && !paperMenuRef.current.contains(target)) {
        setShowPaperMenu(false);
      }
      if (textColorMenuRef.current && !textColorMenuRef.current.contains(target)) {
        setShowTextColorMenu(false);
      }
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(target)) {
        setShowHighlightMenu(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(target)) {
        setShowFontMenu(false);
      }
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(target)) {
        setShowFontSizeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFont = (font: FontOption) => {
    setCurrentFont(font);
    onFormat('fontName', font.family);
    try {
      localStorage.setItem('onenote_last_font_id', font.id);
    } catch {
      // ignore
    }
    setShowFontMenu(false);
    setFontSearch('');
  };

  const handleSelectFontSize = (size: string) => {
    setCurrentFontSize(size);
    onFormat('fontSize', size);
    try {
      localStorage.setItem('onenote_last_font_size', size);
    } catch {
      // ignore
    }
    setShowFontSizeMenu(false);
  };

  const handleStepDownFontSize = () => {
    const currentNum = parseInt(currentFontSize.replace('px', ''), 10) || 16;
    const smaller = [...FONT_SIZE_STEPS].reverse().find((s) => s < currentNum);
    const nextVal = (smaller || FONT_SIZE_STEPS[0]) + 'px';
    handleSelectFontSize(nextVal);
  };

  const handleStepUpFontSize = () => {
    const currentNum = parseInt(currentFontSize.replace('px', ''), 10) || 16;
    const larger = FONT_SIZE_STEPS.find((s) => s > currentNum);
    const nextVal = (larger || FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1]) + 'px';
    handleSelectFontSize(nextVal);
  };

  const filteredFonts = FONT_OPTIONS.filter((font) => {
    const matchesCategory =
      selectedFontCategory === 'All' || font.category === selectedFontCategory;
    const matchesSearch =
      font.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
      font.description.toLowerCase().includes(fontSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTextColor = (colorHex: string) => {
    onFormat('foreColor', colorHex);
    setCurrentTextColor(colorHex);
    setCustomHexInput(colorHex.replace('#', ''));
    try {
      localStorage.setItem('onenote_last_text_color', colorHex);
    } catch {
      // ignore
    }
    setShowTextColorMenu(false);
  };

  const handleResetTextColor = () => {
    onFormat('foreColor', 'default');
    setShowTextColorMenu(false);
  };

  const handleSelectHighlightColor = (colorHex: string) => {
    onFormat('hiliteColor', colorHex);
    setCurrentHighlightColor(colorHex);
    setShowHighlightMenu(false);
  };

  const handleClearHighlight = () => {
    onFormat('hiliteColor', 'transparent');
    setShowHighlightMenu(false);
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onInsertPdfFile) {
      onInsertPdfFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onInsertImageFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const closeAllMenus = () => {
    setShowFontMenu(false);
    setShowFontSizeMenu(false);
    setShowTextColorMenu(false);
    setShowHighlightMenu(false);
    setShowBulletMenu(false);
    setShowNumberMenu(false);
    setShowParagraphMenu(false);
    setShowPaperMenu(false);
  };

  const handleNumberedOptionClick = (styleType: string) => {
    setSelectedNumberStyle(styleType);
    if (onApplyListStyle) {
      onApplyListStyle('insertOrderedList', styleType);
    } else {
      onFormat('insertOrderedList');
    }
    setShowNumberMenu(false);
  };

  const handleBulletOptionClick = (styleType: string) => {
    setSelectedBulletStyle(styleType);
    if (onApplyListStyle) {
      onApplyListStyle('insertUnorderedList', styleType);
    } else {
      onFormat('insertUnorderedList');
    }
    setShowBulletMenu(false);
  };

  return (
    <div
      className={`rounded-xl border px-3 py-1.5 flex items-center gap-1.5 flex-wrap transition-colors select-none ${
        darkMode
          ? 'bg-zinc-800/90 border-zinc-700/80 text-zinc-200 shadow-xs'
          : 'bg-white border-[#EAECF0] text-gray-700 shadow-xs'
      }`}
    >
      {/* 🔤 Font Family Picker */}
      <div className="relative inline-flex items-center" ref={fontMenuRef}>
        <button
          id="format-font-family-btn"
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const next = !showFontMenu;
            closeAllMenus();
            setShowFontMenu(next);
          }}
          title="Change Font Family"
          className={`h-7 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors ${
            showFontMenu
              ? darkMode
                ? 'bg-purple-950/40 border-purple-700 text-purple-300'
                : 'bg-purple-50 border-purple-300 text-purple-700'
              : darkMode
              ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200'
              : 'border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-gray-800'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
          <span
            className="truncate max-w-[90px] sm:max-w-[125px] font-medium"
            style={{ fontFamily: currentFont.family }}
          >
            {currentFont.name}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform ${showFontMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showFontMenu && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute left-0 top-[34px] z-50 w-72 rounded-2xl border p-2.5 shadow-2xl backdrop-blur-md ${
              darkMode
                ? 'bg-zinc-900/95 border-zinc-700 text-zinc-100'
                : 'bg-white/95 border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                Font Family
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {filteredFonts.length} fonts
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                placeholder="Search fonts..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-colors ${
                  darkMode
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:border-purple-500'
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-purple-500'
                }`}
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-1.5 scrollbar-none border-b border-gray-100 dark:border-zinc-800">
              {(['All', 'Modern', 'Handwriting', 'Serif', 'Monospace', 'Classic'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setSelectedFontCategory(cat)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                      selectedFontCategory === cat
                        ? 'bg-purple-600 text-white'
                        : darkMode
                        ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Font Options List */}
            <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
              {filteredFonts.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  No matching fonts
                </div>
              ) : (
                filteredFonts.map((font) => {
                  const isSelected = currentFont.id === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectFont(font)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all group ${
                        isSelected
                          ? darkMode
                            ? 'bg-purple-900/40 text-purple-200 font-semibold'
                            : 'bg-purple-50 text-purple-900 font-semibold'
                          : darkMode
                          ? 'hover:bg-zinc-800 text-zinc-300'
                          : 'hover:bg-gray-100/80 text-gray-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm leading-snug"
                            style={{ fontFamily: font.family }}
                          >
                            {font.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                              darkMode
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-gray-200/70 text-gray-600'
                            }`}
                          >
                            {font.category}
                          </span>
                        </div>
                        <p
                          className="text-[11px] text-gray-400 dark:text-zinc-400 truncate mt-0.5"
                          style={{ fontFamily: font.family }}
                        >
                          The quick brown fox jumps over lazy dogs
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 📏 Font Size Selector with Steppers */}
      <div className="relative inline-flex items-center" ref={fontSizeMenuRef}>
        <div
          className={`h-7 flex items-center rounded-lg border text-xs transition-colors ${
            showFontSizeMenu
              ? darkMode
                ? 'bg-purple-950/40 border-purple-700 text-purple-300'
                : 'bg-purple-50 border-purple-300 text-purple-700'
              : darkMode
              ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200'
              : 'border-gray-200 bg-gray-50/80 text-gray-800'
          }`}
        >
          {/* Decrement */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleStepDownFontSize}
            title="Decrease font size"
            className="px-1.5 h-full flex items-center justify-center rounded-l-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Current Size Button */}
          <button
            id="format-font-size-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const next = !showFontSizeMenu;
              closeAllMenus();
              setShowFontSizeMenu(next);
            }}
            title="Font Size"
            className="px-1.5 h-full flex items-center gap-0.5 hover:bg-black/5 dark:hover:bg-white/5 font-mono font-medium"
          >
            <span>{currentFontSize.replace('px', '')}</span>
            <ChevronDown
              className={`w-2.5 h-2.5 text-gray-400 transition-transform ${
                showFontSizeMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Increment */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleStepUpFontSize}
            title="Increase font size"
            className="px-1.5 h-full flex items-center justify-center rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Font Size Menu */}
        {showFontSizeMenu && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute left-0 top-[34px] z-50 w-24 rounded-2xl border p-1.5 shadow-xl ${
              darkMode
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {FONT_SIZES.map((size) => {
                const isSelected =
                  currentFontSize.replace('px', '') === size.value.replace('px', '');
                return (
                  <button
                    key={size.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectFontSize(size.value)}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      isSelected
                        ? darkMode
                          ? 'bg-purple-900/40 text-purple-300 font-bold'
                          : 'bg-purple-100 text-purple-800 font-bold'
                        : darkMode
                        ? 'hover:bg-zinc-800 text-zinc-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{size.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-0.5" />

      {/* B (Bold) */}
      <button
        id="format-bold-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('bold')}
        title="Bold (Ctrl+B)"
        className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-100' : 'hover:bg-gray-100 text-gray-900'
        }`}
      >
        B
      </button>

      {/* I (Italic) */}
      <button
        id="format-italic-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('italic')}
        title="Italic (Ctrl+I)"
        className={`w-7 h-7 flex items-center justify-center rounded text-sm italic font-serif transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-100' : 'hover:bg-gray-100 text-gray-900'
        }`}
      >
        I
      </button>

      {/* U (Underline) */}
      <button
        id="format-underline-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('underline')}
        title="Underline (Ctrl+U)"
        className={`w-7 h-7 flex items-center justify-center rounded text-sm underline font-medium transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-100' : 'hover:bg-gray-100 text-gray-900'
        }`}
      >
        U
      </button>

      {/* 🎨 Text Color Dropdown */}
      <div className="relative inline-flex items-center" ref={textColorMenuRef}>
        <div
          className={`h-7 flex items-center rounded-lg border transition-colors ${
            showTextColorMenu
              ? darkMode
                ? 'bg-purple-950/40 border-purple-700 text-purple-300'
                : 'bg-purple-50 border-purple-300 text-purple-700'
              : darkMode
              ? 'border-transparent hover:bg-zinc-700 text-zinc-200'
              : 'border-transparent hover:bg-gray-100 text-gray-700'
          }`}
        >
          {/* Quick Apply Current Color */}
          <button
            id="format-text-color-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat('foreColor', currentTextColor)}
            title={`Text Color: Click to apply ${currentTextColor}`}
            className="px-1.5 h-full flex flex-col items-center justify-center rounded-l-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span className="font-serif font-bold text-sm leading-none">A</span>
            <span
              className="w-4 h-1 rounded-full mt-0.5 shadow-2xs transition-colors"
              style={{ backgroundColor: currentTextColor }}
            />
          </button>

          {/* Caret to open Palette */}
          <button
            id="format-text-color-menu-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowTextColorMenu(!showTextColorMenu);
              setShowHighlightMenu(false);
              setShowBulletMenu(false);
              setShowNumberMenu(false);
              setShowParagraphMenu(false);
              setShowPaperMenu(false);
            }}
            title="Text Color options"
            className="px-1 h-full flex items-center justify-center rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronDown
              className={`w-3 h-3 text-gray-400 transition-transform ${
                showTextColorMenu ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Text Color Dropdown Menu */}
        {showTextColorMenu && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute left-0 top-[34px] z-50 w-64 rounded-2xl border p-2.5 shadow-xl ${
              darkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-zinc-700">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs"
                  style={{ backgroundColor: currentTextColor }}
                />
                <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                  Text Color
                </span>
              </div>
              <span className="text-[11px] font-mono text-gray-400 dark:text-zinc-500 uppercase">
                {currentTextColor}
              </span>
            </div>

            {/* Reset to Default Color */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleResetTextColor}
              className="w-full mb-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
              <span>Automatic (Default Color)</span>
            </button>

            {/* Presets (8 columns) */}
            <div className="grid grid-cols-8 gap-1.5 mb-2.5">
              {TEXT_COLOR_PALETTE.map((color) => {
                const isSelected =
                  currentTextColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectTextColor(color.hex)}
                    title={`${color.name} (${color.hex})`}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-115 relative group border border-black/10 dark:border-white/10 shadow-2xs"
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-700 flex items-center gap-2">
              <label
                className="relative flex items-center justify-center w-7 h-7 rounded-lg overflow-hidden border border-gray-300 dark:border-zinc-600 cursor-pointer shadow-2xs hover:border-purple-500"
                title="Custom color picker"
              >
                <input
                  type="color"
                  value={currentTextColor.startsWith('#') ? currentTextColor : '#7F56D9'}
                  onChange={(e) => handleSelectTextColor(e.target.value)}
                  className="absolute -inset-4 w-16 h-16 cursor-pointer opacity-0"
                />
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: currentTextColor }}
                />
              </label>

              <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-900/80 text-xs">
                <Palette className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="font-mono text-gray-400">#</span>
                <input
                  type="text"
                  maxLength={6}
                  value={customHexInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                    setCustomHexInput(clean);
                    if (clean.length === 6) {
                      handleSelectTextColor(`#${clean}`);
                    }
                  }}
                  placeholder="Custom Hex"
                  className="w-full font-mono bg-transparent outline-none text-gray-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🖍 Text Highlight Dropdown */}
      <div className="relative inline-flex items-center" ref={highlightMenuRef}>
        <div
          className={`h-7 flex items-center rounded-lg border transition-colors ${
            showHighlightMenu
              ? darkMode
                ? 'bg-purple-950/40 border-purple-700 text-purple-300'
                : 'bg-purple-50 border-purple-300 text-purple-700'
              : darkMode
              ? 'border-transparent hover:bg-zinc-700 text-zinc-200'
              : 'border-transparent hover:bg-gray-100 text-gray-700'
          }`}
        >
          {/* Quick Apply Highlight */}
          <button
            id="format-highlight-color-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat('hiliteColor', currentHighlightColor)}
            title={`Highlight: Click to apply (${currentHighlightColor})`}
            className="px-1.5 h-full flex flex-col items-center justify-center rounded-l-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Highlighter className="w-3.5 h-3.5 text-gray-700 dark:text-zinc-300" />
            <span
              className="w-4 h-1 rounded-full mt-0.5 shadow-2xs transition-colors"
              style={{ backgroundColor: currentHighlightColor }}
            />
          </button>

          {/* Caret to open Highlight Palette */}
          <button
            id="format-highlight-menu-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowHighlightMenu(!showHighlightMenu);
              setShowTextColorMenu(false);
              setShowBulletMenu(false);
              setShowNumberMenu(false);
              setShowParagraphMenu(false);
              setShowPaperMenu(false);
            }}
            title="Text Highlight options"
            className="px-1 h-full flex items-center justify-center rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronDown
              className={`w-3 h-3 text-gray-400 transition-transform ${
                showHighlightMenu ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Highlight Color Dropdown Menu */}
        {showHighlightMenu && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute left-0 top-[34px] z-50 w-52 rounded-2xl border p-2.5 shadow-xl ${
              darkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-zinc-700">
              <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                Text Highlight
              </span>
            </div>

            {/* Clear highlight button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearHighlight}
              className="w-full mb-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
              <span>No Highlight (Clear)</span>
            </button>

            {/* Highlight Swatches (4 columns) */}
            <div className="grid grid-cols-4 gap-1.5">
              {TEXT_HIGHLIGHT_PALETTE.map((color) => {
                const isSelected =
                  currentHighlightColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectHighlightColor(color.hex)}
                    title={`${color.name} (${color.hex})`}
                    className="h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 border border-black/10 dark:border-white/10 shadow-2xs"
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-gray-900 drop-shadow-sm stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* H1 */}
      <button
        id="format-h1-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('formatBlock', 'H1')}
        title="Heading 1"
        className={`px-2 h-7 flex items-center justify-center rounded text-sm font-semibold transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-200' : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        H1
      </button>

      {/* H2 */}
      <button
        id="format-h2-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('formatBlock', 'H2')}
        title="Heading 2"
        className={`px-2 h-7 flex items-center justify-center rounded text-sm font-semibold transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-200' : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        H2
      </button>

      {/* ¶ ▾ (Paragraph & Block Options) */}
      <div className="relative inline-flex items-center" ref={paragraphMenuRef}>
        <div
          className={`h-7 flex items-center rounded-lg border transition-colors ${
            showParagraphMenu
              ? darkMode
                ? 'bg-purple-950/40 border-purple-700 text-purple-300'
                : 'bg-purple-50 border-purple-300 text-purple-700'
              : darkMode
              ? 'border-transparent hover:bg-zinc-700 text-zinc-200'
              : 'border-transparent hover:bg-gray-100 text-gray-700'
          }`}
        >
          <button
            id="format-p-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat('formatBlock', 'P')}
            title="Normal Paragraph"
            className="px-1.5 h-full flex items-center justify-center rounded-l-lg hover:bg-black/5 dark:hover:bg-white/5 font-medium text-sm"
          >
            <span>¶</span>
          </button>
          <button
            id="format-p-menu-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowParagraphMenu(!showParagraphMenu);
              setShowBulletMenu(false);
              setShowNumberMenu(false);
            }}
            title="Text block formats"
            className="px-1 h-full flex items-center justify-center rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showParagraphMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Paragraph Dropdown */}
        {showParagraphMenu && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute left-0 top-[34px] z-50 w-48 rounded-xl border p-1.5 shadow-xl ${
              darkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-gray-400 dark:text-zinc-400">
              Text Style
            </div>
            <button
              type="button"
              onClick={() => {
                onFormat('formatBlock', 'P');
                setShowParagraphMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 text-left transition-colors"
            >
              <Pilcrow className="w-4 h-4 text-gray-500" />
              <span>Normal text (P)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onFormat('formatBlock', 'H1');
                setShowParagraphMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 text-left transition-colors"
            >
              <Heading1 className="w-4 h-4 text-gray-500" />
              <span>Heading 1</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onFormat('formatBlock', 'H2');
                setShowParagraphMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 text-left transition-colors"
            >
              <Heading2 className="w-4 h-4 text-gray-500" />
              <span>Heading 2</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onFormat('formatBlock', 'H3');
                setShowParagraphMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 text-left transition-colors"
            >
              <Heading3 className="w-4 h-4 text-gray-500" />
              <span>Heading 3</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onFormat('formatBlock', 'BLOCKQUOTE');
                setShowParagraphMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm italic hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 text-left transition-colors"
            >
              <Quote className="w-4 h-4 text-gray-500" />
              <span>Quote block</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onFormat('formatBlock', 'PRE');
                setShowParagraphMenu(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-mono hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 text-left transition-colors"
            >
              <Code className="w-4 h-4 text-gray-500" />
              <span>Code block</span>
            </button>
          </div>
        )}
      </div>

      {/* Vertical Divider */}
      <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1" />

      {/* ≡ ▾ (Bullet List & Bullet Indexing Options) */}
      <div className="relative inline-flex items-center" ref={bulletMenuRef}>
        <div
          className={`h-7 flex items-center rounded-lg border transition-colors ${
            showBulletMenu
              ? darkMode
                ? 'bg-purple-950/40 border-purple-700 text-purple-300'
                : 'bg-purple-50 border-purple-300 text-purple-700'
              : darkMode
              ? 'border-transparent hover:bg-zinc-700 text-zinc-200'
              : 'border-transparent hover:bg-gray-100 text-gray-700'
          }`}
        >
          <button
            id="format-bullet-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (onApplyListStyle) {
                onApplyListStyle('insertUnorderedList', selectedBulletStyle);
              } else {
                onFormat('insertUnorderedList');
              }
            }}
            title="Bullet List (Toggle)"
            className="px-2 h-full flex items-center justify-center rounded-l-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            id="format-bullet-menu-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowBulletMenu(!showBulletMenu);
              setShowNumberMenu(false);
              setShowParagraphMenu(false);
            }}
            title="Bullet indexing styles"
            className="px-1 h-full flex items-center justify-center rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showBulletMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Bullet Indexing Dropdown Menu */}
        {showBulletMenu && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute left-0 top-[34px] z-50 w-72 rounded-2xl border p-2.5 shadow-xl ${
              darkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-gray-100 dark:border-zinc-700">
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                Bullet Indexing Styles
              </span>
              <span className="text-[11px] text-gray-400">8 styles</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto p-0.5">
              {BULLET_INDEXING_OPTIONS.map((opt) => {
                const isSelected = selectedBulletStyle === opt.styleType;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleBulletOptionClick(opt.styleType)}
                    className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all group ${
                      isSelected
                        ? darkMode
                          ? 'bg-purple-950/50 border-purple-500/70 text-purple-200 shadow-2xs'
                          : 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                        : darkMode
                        ? 'border-zinc-700/60 bg-zinc-800/60 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-200'
                        : 'border-gray-150 bg-gray-50/70 hover:bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 flex items-center justify-center rounded-md bg-white dark:bg-zinc-700 shadow-2xs font-semibold text-xs text-purple-600 dark:text-purple-400">
                          {opt.badge}
                        </span>
                        <span className="font-semibold text-xs">{opt.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div className="w-full text-[11px] text-gray-500 dark:text-zinc-400 space-y-0.5 pl-0.5">
                      {opt.examples.slice(0, 2).map((ex, i) => (
                        <div key={i} className="truncate">{ex}</div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 1 2 3 ▾ (Numbered List & Indexing Options) */}
      <div className="relative inline-flex items-center" ref={numberMenuRef}>
        <div
          className={`h-7 flex items-center rounded-lg border transition-colors ${
            showNumberMenu
              ? darkMode
                ? 'bg-purple-950/40 border-purple-700 text-purple-300'
                : 'bg-purple-50 border-purple-300 text-purple-700'
              : darkMode
              ? 'border-transparent hover:bg-zinc-700 text-zinc-200'
              : 'border-transparent hover:bg-gray-100 text-gray-700'
          }`}
        >
          <button
            id="format-number-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (onApplyListStyle) {
                onApplyListStyle('insertOrderedList', selectedNumberStyle);
              } else {
                onFormat('insertOrderedList');
              }
            }}
            title="Numbered List (Toggle)"
            className="px-2 h-full flex items-center justify-center rounded-l-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            id="format-number-menu-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowNumberMenu(!showNumberMenu);
              setShowBulletMenu(false);
              setShowParagraphMenu(false);
            }}
            title="Numbered indexing options"
            className="px-1 h-full flex items-center justify-center rounded-r-lg hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showNumberMenu ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Numbered Indexing Dropdown Menu */}
        {showNumberMenu && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute left-0 top-[34px] z-50 w-80 rounded-2xl border p-2.5 shadow-xl ${
              darkMode
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-gray-100 dark:border-zinc-700">
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-200">
                Numbered Indexing Options
              </span>
              <span className="text-[11px] text-gray-400">7 types</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-[320px] overflow-y-auto p-0.5">
              {NUMBERED_INDEXING_OPTIONS.map((opt) => {
                const isSelected = selectedNumberStyle === opt.styleType;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleNumberedOptionClick(opt.styleType)}
                    className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all group ${
                      isSelected
                        ? darkMode
                          ? 'bg-purple-950/50 border-purple-500/70 text-purple-200 shadow-2xs'
                          : 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs'
                        : darkMode
                        ? 'border-zinc-700/60 bg-zinc-800/60 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-200'
                        : 'border-gray-150 bg-gray-50/70 hover:bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-700 shadow-2xs font-semibold text-xs text-purple-600 dark:text-purple-400">
                          {opt.badge}
                        </span>
                        <span className="font-semibold text-xs">{opt.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div className="w-full text-[11px] text-gray-500 dark:text-zinc-400 space-y-0.5 pl-0.5">
                      {opt.examples.slice(0, 2).map((ex, i) => (
                        <div key={i} className="truncate">{ex}</div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Vertical Divider */}
      <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1" />

      {/* ☑ Checklist */}
      <button
        id="format-checklist-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onInsertChecklist}
        title="Insert Checklist"
        className={`px-2.5 h-7 flex items-center gap-1.5 rounded-lg text-sm font-normal transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-200' : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <CheckSquare className="w-4 h-4 text-[#7F56D9]" />
        <span>Checklist</span>
      </button>

      {/* 🖼 Image */}
      <button
        id="format-image-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        title="Insert Image"
        className={`px-2.5 h-7 flex items-center gap-1.5 rounded-lg text-sm font-normal transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-200' : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <ImageIcon className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
        <span>Image</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 📄 PDF Document upload button (Direct upload, sample removed) */}
      <button
        id="format-pdf-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => pdfFileInputRef.current?.click()}
        title={hasPdf ? 'PDF attached — Click to replace or upload another' : 'Upload PDF document to annotate & draw'}
        className={`h-7 px-2.5 flex items-center gap-1.5 rounded-lg border transition-colors text-sm font-medium ${
          hasPdf
            ? darkMode
              ? 'bg-purple-950/50 border-purple-600 text-purple-300'
              : 'bg-purple-50 border-purple-300 text-purple-700'
            : darkMode
            ? 'border-transparent hover:bg-zinc-700 text-zinc-200'
            : 'border-transparent hover:bg-gray-100 text-gray-700'
        }`}
      >
        <FileText className="w-4 h-4 text-red-500" />
        <span>PDF</span>
        {hasPdf && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </button>
      <input
        ref={pdfFileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handlePdfFileChange}
        className="hidden"
      />

      {/* 📐 OneNote Paper Style Selector (Blank, Ruled, Grid) */}
      {onPaperStyleChange && (
        <div className="relative inline-flex items-center" ref={paperMenuRef}>
          <button
            id="format-paper-style-btn"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowPaperMenu(!showPaperMenu);
              setShowBulletMenu(false);
              setShowNumberMenu(false);
              setShowParagraphMenu(false);
            }}
            title="Notebook Paper Style (Blank, Ruled, Grid)"
            className={`h-7 px-2 flex items-center gap-1.5 rounded-lg border text-sm font-medium transition-colors ${
              showPaperMenu
                ? darkMode
                  ? 'bg-zinc-700 border-zinc-600 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-900'
                : darkMode
                ? 'border-transparent hover:bg-zinc-700 text-zinc-200'
                : 'border-transparent hover:bg-gray-100 text-gray-700'
            }`}
          >
            {paperStyle === 'ruled' && <AlignJustify className="w-4 h-4 text-purple-500" />}
            {paperStyle === 'grid' && <Grid3X3 className="w-4 h-4 text-purple-500" />}
            {paperStyle === 'blank' && <Square className="w-3.5 h-3.5 text-gray-400" />}
            <span className="capitalize">{paperStyle}</span>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showPaperMenu ? 'rotate-180' : ''}`} />
          </button>

          {showPaperMenu && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className={`absolute left-0 top-[34px] z-50 w-44 rounded-2xl border p-1.5 shadow-xl ${
                darkMode
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-700 mb-1">
                Paper Style
              </div>
              <button
                type="button"
                onClick={() => {
                  onPaperStyleChange('blank');
                  setShowPaperMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  paperStyle === 'blank'
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Blank Canvas</span>
                {paperStyle === 'blank' && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onPaperStyleChange('ruled');
                  setShowPaperMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  paperStyle === 'ruled'
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span>Ruled Notebook</span>
                {paperStyle === 'ruled' && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onPaperStyleChange('grid');
                  setShowPaperMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  paperStyle === 'grid'
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-[#7F56D9] font-bold'
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Grid / Graph Paper</span>
                {paperStyle === 'grid' && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 📋 Paste image */}
      <button
        id="format-paste-image-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onPasteImage}
        title="Paste Image from Clipboard"
        className={`px-2.5 h-7 flex items-center gap-1.5 rounded-lg text-sm font-normal transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-200' : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <Clipboard className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
        <span>Paste image</span>
      </button>

      {/* ✏ Drawing */}
      <button
        id="format-drawing-toggle-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggleDrawing}
        title="Toggle Drawing Tools"
        className={`px-2.5 h-7 flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
          drawingOpen
            ? darkMode
              ? 'bg-purple-950/40 text-[#c084fc]'
              : 'bg-[#F9F5FF] text-[#6941C6]'
            : darkMode
            ? 'hover:bg-zinc-700 text-zinc-200'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <PenTool className="w-4 h-4 text-[#7F56D9]" />
        <span>Drawing</span>
      </button>

      {/* ... (More options) */}
      <button
        id="format-more-btn"
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('removeFormat')}
        title="Clear formatting / More"
        className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors ${
          darkMode ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-gray-100 text-gray-600'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};
