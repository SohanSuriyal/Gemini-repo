export type NavPage = 'dashboard' | 'subjects' | 'notes' | 'recent' | 'favorites' | 'settings';

export type DrawingTool = 'pen' | 'highlighter' | 'eraser';
export type EraserType = 'stroke-eraser' | 'eraser';

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingTool;
  eraserType?: EraserType;
  color: string;
  size: number;
  points: DrawingPoint[];
}

export interface PdfDocumentPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface PdfDocumentData {
  fileName: string;
  fileSize: number;
  totalPages: number;
  pages: PdfDocumentPage[];
  uploadedAt?: number;
}

export interface NoteTextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  content: string; // rich text HTML
  fontFamily?: string;
  fontSize?: string;
}

export type PaperStyle = 'blank' | 'ruled' | 'grid';

export interface NoteItem {
  id: string;
  title: string;
  subject: string;
  topic: string;
  content: string; // rich text HTML or free text
  textBoxes?: NoteTextBox[];
  paperStyle?: PaperStyle;
  strokes: DrawingStroke[];
  created: number;
  updated: number;
  favorite: boolean;
  type: 'written' | 'pdf' | 'image';
  fileName?: string;
  fileDataUrl?: string;
  pdfData?: PdfDocumentData;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  compact: boolean;
  animations: boolean;
  defaultView: 'grid' | 'list';
  defaultSort: 'recent' | 'name' | 'name-desc' | 'oldest';
  defaultPaperStyle: PaperStyle;
  editorFont: 'sans' | 'serif' | 'mono';
  rememberLastSubject: boolean;
  defaultSubject: string;
  confirmDelete: boolean;
  lastSubject: string;
}

export type CanvasNodeType = 'text' | 'file' | 'media';
export type CanvasAnchorSide = 'top' | 'bottom' | 'left' | 'right';

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  title?: string;
  text?: string;
  fontFamily?: 'sans' | 'serif' | 'mono' | 'handwriting';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  backgroundColor?: string;
  noteId?: string;
  noteTitle?: string;
  noteSnippet?: string;
  displayMode?: 'auto' | 'drawing' | 'text' | 'both';
  fitMode?: 'fit-all' | 'fit-width';
  mediaUrl?: string;
  mediaName?: string;
  mediaFit?: 'contain' | 'cover';
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide: CanvasAnchorSide;
  toNode: string;
  toSide: CanvasAnchorSide;
  label?: string;
  color?: string;
}

export interface TopicCanvasData {
  id: string;
  subject: string;
  topic: string;
  title: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  zoom: number;
  panX: number;
  panY: number;
  updatedAt: number;
}

