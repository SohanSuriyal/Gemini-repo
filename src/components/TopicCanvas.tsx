import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  AlignLeft,
  Image as ImageIcon,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  Undo2,
  Redo2,
  HelpCircle,
  Settings,
  X,
  Trash2,
  ExternalLink,
  Check,
  Search,
  Sparkles,
  Link2,
  Upload,
  Type,
  Copy,
  Edit2,
  PenTool,
  ZoomIn,
  Layers,
  Crop,
  Eye,
  ChevronDown,
  Palette,
} from 'lucide-react';
import { NoteItem, CanvasNode, CanvasEdge, CanvasAnchorSide, TopicCanvasData } from '../types';
import { NotePagePreview } from './NotePagePreview';
import { StaticHeaderTimer } from './StaticHeaderTimer';

interface TopicCanvasProps {
  subject: string;
  topic: string;
  notes: NoteItem[];
  darkMode: boolean;
  onBackToNotes: () => void;
  onOpenNote: (noteId: string) => void;
  onCreateNoteInTopic: (subject: string, topic: string) => void;
}

export const COLOR_PALETTE = [
  { id: 'purple', label: 'Purple', border: 'border-[#7F56D9]', hex: '#7F56D9', bg: 'bg-[#7F56D9]/10' },
  { id: 'blue', label: 'Blue', border: 'border-blue-500', hex: '#3B82F6', bg: 'bg-blue-500/10' },
  { id: 'emerald', label: 'Emerald', border: 'border-emerald-500', hex: '#10B981', bg: 'bg-emerald-500/10' },
  { id: 'amber', label: 'Yellow / Sticky', border: 'border-amber-500', hex: '#F59E0B', bg: 'bg-amber-500/10' },
  { id: 'rose', label: 'Rose', border: 'border-rose-500', hex: '#F43F5E', bg: 'bg-rose-500/10' },
  { id: 'cyan', label: 'Cyan', border: 'border-cyan-500', hex: '#06B6D4', bg: 'bg-cyan-500/10' },
  { id: 'fuchsia', label: 'Fuchsia', border: 'border-fuchsia-500', hex: '#D946EF', bg: 'bg-fuchsia-500/10' },
  { id: 'zinc', label: 'Slate', border: 'border-zinc-500', hex: '#71717A', bg: 'bg-zinc-500/10' },
];

const DIAGRAM_TEMPLATES = [
  {
    title: 'Flowchart Architecture',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Mind Map Diagram',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'System Blueprint',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Concept Network',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
  },
];

export const TopicCanvas: React.FC<TopicCanvasProps> = ({
  subject,
  topic,
  notes,
  darkMode,
  onBackToNotes,
  onOpenNote,
  onCreateNoteInTopic,
}) => {
  const storageKey = `ns_canvas_${subject}__${topic}`;

  // Topic notes
  const topicNotes = useMemo(() => {
    return notes.filter((n) => n.subject === subject && n.topic === topic);
  }, [notes, subject, topic]);

  // Canvas Core State
  const [canvasTitle, setCanvasTitle] = useState<string>(`${topic} Canvas`);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // History for Undo/Redo
  const historyRef = useRef<{ nodes: CanvasNode[]; edges: CanvasEdge[] }[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const pushHistory = useCallback((newNodes: CanvasNode[], newEdges: CanvasEdge[]) => {
    const currentHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    currentHistory.push({ nodes: newNodes, edges: newEdges });
    if (currentHistory.length > 25) currentHistory.shift();
    historyRef.current = currentHistory;
    historyIndexRef.current = currentHistory.length - 1;
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      setNodes(state.nodes);
      setEdges(state.edges);
    }
  }, []);

  // Load from local storage or initialize
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: TopicCanvasData = JSON.parse(saved);
        setCanvasTitle(parsed.title || `${topic} Canvas`);
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
        setZoom(parsed.zoom || 1);
        setPan({ x: parsed.panX || 0, y: parsed.panY || 0 });
        historyRef.current = [{ nodes: parsed.nodes || [], edges: parsed.edges || [] }];
        historyIndexRef.current = 0;
        return;
      }
    } catch {
      // fallback
    }

    // Starter setup
    let starterNodes: CanvasNode[] = [];
    let starterEdges: CanvasEdge[] = [];

    if (topicNotes.length > 0) {
      starterNodes = topicNotes.slice(0, 2).map((note, index) => {
        return {
          id: `node_note_${note.id}`,
          type: 'file',
          x: index === 0 ? 120 : 500,
          y: 180,
          width: 340,
          height: 260,
          color: index === 0 ? '#7F56D9' : '#3B82F6',
          noteId: note.id,
          noteTitle: note.title,
          fitMode: 'fit-width',
        };
      });

      starterNodes.push({
        id: 'node_text_welcome',
        type: 'text',
        x: 300,
        y: 470,
        width: 300,
        height: 180,
        color: '#F59E0B',
        title: `${topic} Ideas & Map`,
        text: 'Right-click any card to customize color, font, or rename!\nDouble click canvas to add new thought cards.',
        fontFamily: 'sans',
        fontSize: 'base',
      });

      if (starterNodes.length >= 2) {
        starterEdges = [
          {
            id: 'edge_starter_1',
            fromNode: starterNodes[0].id,
            fromSide: 'bottom',
            toNode: 'node_text_welcome',
            toSide: 'top',
            label: 'References',
            color: '#7F56D9',
          },
        ];
      }
    }

    setNodes(starterNodes);
    setEdges(starterEdges);
    historyRef.current = [{ nodes: starterNodes, edges: starterEdges }];
    historyIndexRef.current = 0;
  }, [storageKey, topic]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      const data: TopicCanvasData = {
        id: storageKey,
        subject,
        topic,
        title: canvasTitle,
        nodes,
        edges,
        zoom,
        panX: pan.x,
        panY: pan.y,
        updatedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save canvas:', e);
    }
  }, [storageKey, subject, topic, canvasTitle, nodes, edges, zoom, pan]);

  // Active UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showNotePicker, setShowNotePicker] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showCenterGuide, setShowCenterGuide] = useState(true);

  // Rename card state
  const [editingTitleNodeId, setEditingTitleNodeId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string>('');

  // Right-click Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  // Image Modal state (for adding or editing images)
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    targetNodeId?: string;
    initialUrl?: string;
    initialTitle?: string;
    initialFit?: 'contain' | 'cover';
  } | null>(null);

  // Image Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Full Note Page Inspection Modal state
  const [fullPageModalNote, setFullPageModalNote] = useState<NoteItem | null>(null);
  const [modalFitMode, setModalFitMode] = useState<'fit-width' | 'fit-all'>('fit-width');

  // Interaction refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingCanvasRef = useRef(false);
  const isSpacePressedRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging & Resizing
  const draggingNodeRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialNodeX: number;
    initialNodeY: number;
  } | null>(null);

  const resizingNodeRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  // Connection Dragging
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    side: CanvasAnchorSide;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Helper: screen coordinate to canvas coordinate
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Helper: node anchor coordinates
  const getNodeAnchorPos = useCallback(
    (node: CanvasNode, side: CanvasAnchorSide) => {
      switch (side) {
        case 'top':
          return { x: node.x + node.width / 2, y: node.y };
        case 'bottom':
          return { x: node.x + node.width / 2, y: node.y + node.height };
        case 'left':
          return { x: node.x, y: node.y + node.height / 2 };
        case 'right':
          return { x: node.x + node.width, y: node.y + node.height / 2 };
      }
    },
    []
  );

  // Zoom controls
  const handleZoom = useCallback((delta: number, clientX?: number, clientY?: number) => {
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(0.2, prevZoom + delta), 2.5);
      if (clientX !== undefined && clientY !== undefined && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * (nextZoom / prevZoom),
          y: mouseY - (mouseY - prevPan.y) * (nextZoom / prevZoom),
        }));
      }
      return Number(nextZoom.toFixed(2));
    });
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (nodes.length === 0 || !canvasRef.current) {
      handleResetView();
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    const contentWidth = maxX - minX + 160;
    const contentHeight = maxY - minY + 160;
    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const newZoom = Math.min(Math.max(0.35, Math.min(scaleX, scaleY)), 1.2);

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom,
    });
  }, [nodes, handleResetView]);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#canvas-context-menu')) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        isSpacePressedRef.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
          const nextEdges = edges.filter(
            (ed) => ed.fromNode !== selectedNodeId && ed.toNode !== selectedNodeId
          );
          setNodes(nextNodes);
          setEdges(nextEdges);
          setSelectedNodeId(null);
          pushHistory(nextNodes, nextEdges);
        } else if (selectedEdgeId) {
          const nextEdges = edges.filter((ed) => ed.id !== selectedEdgeId);
          setEdges(nextEdges);
          setSelectedEdgeId(null);
          pushHistory(nodes, nextEdges);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nodes, edges, selectedNodeId, selectedEdgeId, handleUndo, handleRedo, pushHistory]);

  // Wheel zoom / pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        handleZoom(delta, e.clientX, e.clientY);
      } else {
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [handleZoom]
  );

  // Mouse Down on Canvas Background
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressedRef.current || e.target === canvasRef.current) {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setContextMenu(null);
    }
  };

  // Double Click Canvas Background -> Add Text Card
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    handleAddTextCard(x - 140, y - 80);
    setShowCenterGuide(false);
  };

  // Mouse Move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingCanvasRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPan({
          x: panStartRef.current.x + dx,
          y: panStartRef.current.y + dy,
        });
        return;
      }

      if (draggingNodeRef.current) {
        const { id, startX, startY, initialNodeX, initialNodeY } = draggingNodeRef.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        let newX = initialNodeX + dx;
        let newY = initialNodeY + dy;

        if (snapToGrid) {
          newX = Math.round(newX / 20) * 20;
          newY = Math.round(newY / 20) * 20;
        }

        setNodes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, x: newX, y: newY } : n))
        );
        return;
      }

      if (resizingNodeRef.current) {
        const { id, startX, startY, initialWidth, initialHeight } = resizingNodeRef.current;
        const dw = (e.clientX - startX) / zoom;
        const dh = (e.clientY - startY) / zoom;
        const newWidth = Math.max(200, initialWidth + dw);
        const newHeight = Math.max(120, initialHeight + dh);

        setNodes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, width: newWidth, height: newHeight } : n))
        );
        return;
      }

      if (connectingFrom) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        setConnectingFrom((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
      }
    },
    [zoom, snapToGrid, connectingFrom, screenToCanvas]
  );

  // Mouse Up
  const handleMouseUp = useCallback(() => {
    if (isDraggingCanvasRef.current) {
      isDraggingCanvasRef.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = isSpacePressedRef.current ? 'grab' : 'default';
      }
    }

    if (draggingNodeRef.current || resizingNodeRef.current) {
      draggingNodeRef.current = null;
      resizingNodeRef.current = null;
      pushHistory(nodes, edges);
    }

    if (connectingFrom) {
      setConnectingFrom(null);
    }
  }, [nodes, edges, connectingFrom, pushHistory]);

  // Create Text Card
  const handleAddTextCard = (posX?: number, posY?: number) => {
    let x = posX;
    let y = posY;
    if (x === undefined || y === undefined) {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const center = screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
        x = center.x - 140;
        y = center.y - 80;
      } else {
        x = 200;
        y = 200;
      }
    }

    const newNode: CanvasNode = {
      id: `node_text_${Date.now()}`,
      type: 'text',
      x: Math.round(x),
      y: Math.round(y),
      width: 290,
      height: 180,
      color: '#F59E0B',
      title: 'Idea Card',
      text: 'Type your notes, ideas, or thoughts here...',
      fontFamily: 'sans',
      fontSize: 'base',
      textAlign: 'left',
    };

    const next = [...nodes, newNode];
    setNodes(next);
    setSelectedNodeId(newNode.id);
    pushHistory(next, edges);
    setShowCenterGuide(false);
  };

  // Create Note Card
  const handleAddNoteCard = (note: NoteItem) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const center = screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);

      const newNode: CanvasNode = {
        id: `node_note_${note.id}_${Date.now()}`,
        type: 'file',
        x: Math.round(center.x - 170),
        y: Math.round(center.y - 130),
        width: 340,
        height: 260,
        color: '#7F56D9',
        noteId: note.id,
        noteTitle: note.title,
        fitMode: 'fit-width',
      };

      const next = [...nodes, newNode];
      setNodes(next);
      setSelectedNodeId(newNode.id);
      pushHistory(next, edges);
      setShowNotePicker(false);
      setShowCenterGuide(false);
    }
  };

  // Save / Apply Image Card (from Image Modal)
  const handleSaveImageCard = (data: {
    title: string;
    url: string;
    name: string;
    fit: 'contain' | 'cover';
    targetNodeId?: string;
  }) => {
    if (data.targetNodeId) {
      // Editing existing media node
      const nextNodes = nodes.map((n) =>
        n.id === data.targetNodeId
          ? {
              ...n,
              title: data.title,
              mediaUrl: data.url,
              mediaName: data.name,
              mediaFit: data.fit,
            }
          : n
      );
      setNodes(nextNodes);
      pushHistory(nextNodes, edges);
    } else {
      // Adding new media node
      let x = 200;
      let y = 200;
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const center = screenToCanvas(rect.left + rect.width / 2, rect.top + rect.height / 2);
        x = center.x - 150;
        y = center.y - 120;
      }

      const newNode: CanvasNode = {
        id: `node_media_${Date.now()}`,
        type: 'media',
        x: Math.round(x),
        y: Math.round(y),
        width: 320,
        height: 240,
        color: '#10B981',
        title: data.title || 'Image Card',
        mediaUrl: data.url,
        mediaName: data.name,
        mediaFit: data.fit,
      };

      const next = [...nodes, newNode];
      setNodes(next);
      setSelectedNodeId(newNode.id);
      pushHistory(next, edges);
      setShowCenterGuide(false);
    }
    setImageModal(null);
  };

  // Start Renaming Node Title
  const handleStartRename = (nodeId: string, currentTitle: string) => {
    setEditingTitleNodeId(nodeId);
    setTitleDraft(currentTitle);
    setContextMenu(null);
  };

  const handleFinishRename = (nodeId: string) => {
    if (editingTitleNodeId === nodeId) {
      const nextNodes = nodes.map((n) => (n.id === nodeId ? { ...n, title: titleDraft.trim() || n.title } : n));
      setNodes(nextNodes);
      pushHistory(nextNodes, edges);
      setEditingTitleNodeId(null);
    }
  };

  // Update Node Property Helper
  const handleUpdateNode = (nodeId: string, patch: Partial<CanvasNode>) => {
    const nextNodes = nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n));
    setNodes(nextNodes);
    pushHistory(nextNodes, edges);
  };

  // Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;

    const newNode: CanvasNode = {
      ...target,
      id: `${target.type}_${Date.now()}`,
      x: target.x + 30,
      y: target.y + 30,
      title: target.title ? `${target.title} (Copy)` : undefined,
    };

    const next = [...nodes, newNode];
    setNodes(next);
    setSelectedNodeId(newNode.id);
    pushHistory(next, edges);
    setContextMenu(null);
  };

  // Right-Click Context Menu trigger
  const handleCardContextMenu = (e: React.MouseEvent, node: CanvasNode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);

    const menuW = 240;
    const menuH = 380;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 12);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 12);

    setContextMenu({ x, y, nodeId: node.id });
  };

  // Finish Connection Drag
  const handleConnectToNode = (targetNodeId: string, targetSide: CanvasAnchorSide) => {
    if (!connectingFrom) return;
    if (connectingFrom.nodeId === targetNodeId) {
      setConnectingFrom(null);
      return;
    }

    const newEdge: CanvasEdge = {
      id: `edge_${Date.now()}`,
      fromNode: connectingFrom.nodeId,
      fromSide: connectingFrom.side,
      toNode: targetNodeId,
      toSide: targetSide,
      color: '#7F56D9',
    };

    const nextEdges = [...edges, newEdge];
    setEdges(nextEdges);
    setConnectingFrom(null);
    pushHistory(nodes, nextEdges);
  };

  // SVG Edge Paths
  const renderEdgePath = (edge: CanvasEdge) => {
    const fromNode = nodes.find((n) => n.id === edge.fromNode);
    const toNode = nodes.find((n) => n.id === edge.toNode);
    if (!fromNode || !toNode) return null;

    const from = getNodeAnchorPos(fromNode, edge.fromSide);
    const to = getNodeAnchorPos(toNode, edge.toSide);

    const dx = Math.abs(to.x - from.x) * 0.5;
    const dy = Math.abs(to.y - from.y) * 0.5;

    let cp1x = from.x;
    let cp1y = from.y;
    let cp2x = to.x;
    let cp2y = to.y;

    if (edge.fromSide === 'right') cp1x += dx;
    if (edge.fromSide === 'left') cp1x -= dx;
    if (edge.fromSide === 'bottom') cp1y += dy;
    if (edge.fromSide === 'top') cp1y -= dy;

    if (edge.toSide === 'right') cp2x += dx;
    if (edge.toSide === 'left') cp2x -= dx;
    if (edge.toSide === 'bottom') cp2y += dy;
    if (edge.toSide === 'top') cp2y -= dy;

    const pathData = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
    const isSelected = selectedEdgeId === edge.id;

    return (
      <g key={edge.id} className="cursor-pointer group" onClick={() => setSelectedEdgeId(edge.id)}>
        <path d={pathData} fill="none" stroke="transparent" strokeWidth={16} />
        <path
          d={pathData}
          fill="none"
          stroke={isSelected ? '#F59E0B' : edge.color || '#7F56D9'}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={edge.label ? '4 2' : 'none'}
          markerEnd={`url(#arrowhead-${edge.id})`}
          className="transition-colors group-hover:stroke-[#9E77ED]"
        />
        <defs>
          <marker
            id={`arrowhead-${edge.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={isSelected ? '#F59E0B' : edge.color || '#7F56D9'} />
          </marker>
        </defs>
      </g>
    );
  };

  const renderConnectingLine = () => {
    if (!connectingFrom) return null;
    const fromNode = nodes.find((n) => n.id === connectingFrom.nodeId);
    if (!fromNode) return null;
    const from = getNodeAnchorPos(fromNode, connectingFrom.side);
    const to = { x: connectingFrom.currentX, y: connectingFrom.currentY };

    return (
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="#7F56D9"
        strokeWidth={2}
        strokeDasharray="5 5"
      />
    );
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const contextMenuNode = contextMenu ? nodes.find((n) => n.id === contextMenu.nodeId) : null;

  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden select-none font-sans ${
        darkMode ? 'bg-[#121215] text-zinc-100' : 'bg-[#F8F9FA] text-zinc-900'
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. TOP HEADER / TITLEBAR */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 h-13 px-4 flex items-center justify-between border-b backdrop-blur-md ${
          darkMode ? 'border-zinc-800/80 bg-[#17171C]/90 text-zinc-100' : 'border-zinc-200/80 bg-white/90 text-zinc-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToNotes}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              darkMode ? 'text-zinc-300 hover:text-white hover:bg-white/10' : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
            title="Back to Topic Notes"
          >
            <ArrowLeft className="w-4 h-4 text-purple-500" />
            <span>Notes</span>
          </button>

          <div className={`h-4 w-px ${darkMode ? 'bg-white/10' : 'bg-zinc-300'}`} />

          {/* Breadcrumb & Topic badge */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="uppercase font-semibold tracking-wider text-[10px] text-zinc-400">{subject}</span>
            <span className="text-zinc-400">/</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800/40">
              {topic}
            </span>
          </div>
        </div>

        {/* Center Editable Title & Static Timer */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={canvasTitle}
            onChange={(e) => setCanvasTitle(e.target.value)}
            className={`text-sm font-bold text-center px-3 py-1 rounded-md transition-colors outline-none border border-transparent focus:border-purple-500 ${
              darkMode ? 'text-zinc-100 hover:bg-white/5 focus:bg-white/10' : 'text-zinc-900 hover:bg-zinc-100 focus:bg-white'
            }`}
          />
          <StaticHeaderTimer darkMode={darkMode} />
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelpModal(true)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              darkMode ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Canvas Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              darkMode ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Canvas Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. INFINITE DOT GRID CANVAS STAGE */}
      <div
        ref={canvasRef}
        className="flex-1 w-full h-full relative overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onDoubleClick={handleCanvasDoubleClick}
        style={{
          backgroundColor: darkMode ? '#111114' : '#F9FAFB',
          backgroundImage: `radial-gradient(circle, ${darkMode ? '#2D2D35' : '#D1D5DB'} 1.3px, transparent 1.3px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transform container for pan and zoom */}
        <div
          className="absolute inset-0 origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* SVG Connection Edges Layer */}
          <svg className="absolute inset-0 w-[50000px] h-[50000px] -translate-x-[25000px] -translate-y-[25000px] pointer-events-auto overflow-visible">
            <g transform="translate(25000, 25000)">
              {edges.map(renderEdgePath)}
              {renderConnectingLine()}
            </g>
          </svg>

          {/* Nodes Layer */}
          <div className="absolute top-0 left-0">
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const cardColor = node.color || '#7F56D9';
              const targetNote = node.type === 'file' ? notes.find((n) => n.id === node.noteId) : undefined;
              const noteStrokes = targetNote?.strokes || [];
              const hasStrokes = noteStrokes.length > 0;
              const displayMode = node.displayMode || (hasStrokes ? 'drawing' : 'text');

              // Font & text contrast classes
              const fontFam =
                node.fontFamily === 'serif'
                  ? 'font-serif'
                  : node.fontFamily === 'mono'
                  ? 'font-mono'
                  : node.fontFamily === 'handwriting'
                  ? 'font-sans tracking-wide italic'
                  : 'font-sans';

              const fontSz =
                node.fontSize === 'sm'
                  ? 'text-xs'
                  : node.fontSize === 'lg'
                  ? 'text-base'
                  : node.fontSize === 'xl'
                  ? 'text-lg'
                  : 'text-sm';

              return (
                <div
                  key={node.id}
                  style={{
                    transform: `translate(${node.x}px, ${node.y}px)`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    borderColor: cardColor,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                    setSelectedEdgeId(null);
                  }}
                  onContextMenu={(e) => handleCardContextMenu(e, node)}
                  className={`absolute rounded-xl pointer-events-auto border-2 transition-shadow shadow-md flex flex-col overflow-hidden group ${
                    darkMode ? 'bg-[#1C1C22]' : 'bg-white'
                  } ${isSelected ? 'ring-2 ring-purple-500 shadow-xl' : ''}`}
                >
                  {/* Card Header */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      draggingNodeRef.current = {
                        id: node.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialNodeX: node.x,
                        initialNodeY: node.y,
                      };
                    }}
                    className={`h-9 px-3 flex items-center justify-between border-b cursor-grab active:cursor-grabbing select-none ${
                      darkMode ? 'border-zinc-800 bg-[#23232A]' : 'border-zinc-100 bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {node.type === 'file' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          {hasStrokes && (
                            <span
                              title={`Contains ${noteStrokes.length} drawing strokes`}
                              className="flex items-center gap-0.5 px-1 py-0.2 text-[9px] font-bold rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300"
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              <span>Draw</span>
                            </span>
                          )}
                        </div>
                      )}
                      {node.type === 'text' && <AlignLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {node.type === 'media' && <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}

                      {/* Title: Inline Editable */}
                      {editingTitleNodeId === node.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          onBlur={() => handleFinishRename(node.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFinishRename(node.id);
                            if (e.key === 'Escape') setEditingTitleNodeId(null);
                          }}
                          className={`text-xs font-bold px-1 py-0.5 rounded outline-none border border-purple-500 flex-1 min-w-0 ${
                            darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900'
                          }`}
                        />
                      ) : (
                        <div
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(node.id, node.title || (node.type === 'file' ? node.noteTitle || 'Note' : 'Card'));
                          }}
                          className="flex items-center gap-1 min-w-0 flex-1 group/title cursor-text"
                          title="Double-click to rename"
                        >
                          <span className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                            {node.title || (node.type === 'file' ? node.noteTitle : 'Card')}
                          </span>
                          <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover/title:opacity-80 text-zinc-400 hover:text-purple-400 transition-opacity shrink-0 ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Actions on Card Header */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Note Card Header Controls */}
                      {node.type === 'file' && (
                        <div className="flex items-center gap-1">
                          {/* Fit toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateNode(node.id, {
                                fitMode: (node.fitMode || 'fit-width') === 'fit-all' ? 'fit-width' : 'fit-all',
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              (node.fitMode || 'fit-width') === 'fit-all'
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-semibold'
                                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                            }`}
                            title={(node.fitMode || 'fit-width') === 'fit-all' ? 'Switch to Scrollable View' : 'Switch to Fit Entire Page'}
                          >
                            {(node.fitMode || 'fit-width') === 'fit-all' ? 'Fit Page' : 'Scroll'}
                          </button>

                          {/* Full Page Inspection Modal */}
                          {targetNote && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFullPageModalNote(targetNote);
                              }}
                              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-purple-400 transition-colors"
                              title="Inspect Full Note Page"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Media Card: Change Image button */}
                      {node.type === 'media' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageModal({
                              isOpen: true,
                              targetNodeId: node.id,
                              initialUrl: node.mediaUrl,
                              initialTitle: node.title,
                              initialFit: node.mediaFit,
                            });
                          }}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-emerald-500 transition-colors"
                          title="Change Image"
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                      )}

                      {/* Open Full Note Button */}
                      {node.type === 'file' && node.noteId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenNote(node.noteId!);
                          }}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-purple-400 transition-colors"
                          title="Open Note in Editor"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete Card Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextNodes = nodes.filter((n) => n.id !== node.id);
                          const nextEdges = edges.filter(
                            (ed) => ed.fromNode !== node.id && ed.toNode !== node.id
                          );
                          setNodes(nextNodes);
                          setEdges(nextEdges);
                          setSelectedNodeId(null);
                          pushHistory(nextNodes, nextEdges);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete card"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-3 overflow-hidden text-xs flex flex-col relative">
                    {/* 1. FILE / NOTE CARD */}
                    {node.type === 'file' ? (
                      <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
                        {targetNote ? (
                          <div className="flex-1 w-full h-full relative rounded-lg overflow-hidden border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50 dark:bg-black/25">
                            <NotePagePreview
                              note={targetNote}
                              darkMode={darkMode}
                              fitMode={node.fitMode || 'fit-width'}
                              onOpenNote={() => onOpenNote(node.noteId!)}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-zinc-400">
                            <FileText className="w-8 h-8 opacity-40 mb-2" />
                            <span className="text-xs font-semibold">Note document not found</span>
                            <span className="text-[10px] opacity-60">This note may have been removed</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 shrink-0">
                          <span className="truncate max-w-[160px]">
                            {targetNote ? (
                              <>
                                <span className="capitalize">{targetNote.paperStyle || 'blank'} page</span>
                                {hasStrokes && ` • ${noteStrokes.length} drawings`}
                              </>
                            ) : (
                              'Document note'
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenNote(node.noteId!)}
                            className="text-purple-600 dark:text-purple-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>Open Note</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    ) : node.type === 'media' ? (
                      /* 2. MEDIA CARD */
                      <div className="flex-1 relative rounded-lg overflow-hidden bg-zinc-100 dark:bg-black/30 flex items-center justify-center group/img">
                        {node.mediaUrl ? (
                          <>
                            <img
                              src={node.mediaUrl}
                              alt={node.mediaName || node.title || 'Canvas Media'}
                              className={`w-full h-full ${
                                node.mediaFit === 'contain' ? 'object-contain' : 'object-cover'
                              }`}
                            />
                            {/* Hover Controls on Image */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxUrl(node.mediaUrl!);
                                }}
                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                                title="Zoom Fullscreen"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateNode(node.id, {
                                    mediaFit: node.mediaFit === 'contain' ? 'cover' : 'contain',
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                                title={`Toggle fit (${node.mediaFit === 'contain' ? 'Contain' : 'Cover'})`}
                              >
                                <Crop className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageModal({
                                    isOpen: true,
                                    targetNodeId: node.id,
                                    initialUrl: node.mediaUrl,
                                    initialTitle: node.title,
                                    initialFit: node.mediaFit,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                                title="Change Image"
                              >
                                <Upload className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setImageModal({
                                isOpen: true,
                                targetNodeId: node.id,
                                initialTitle: node.title,
                              })
                            }
                            className="flex flex-col items-center gap-2 text-zinc-500 hover:text-emerald-500 p-4 transition-colors"
                          >
                            <Upload className="w-6 h-6" />
                            <span className="text-xs font-semibold">Click to add image</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* 3. TEXT / STICKY CARD - High contrast, customizable font & color */
                      <textarea
                        value={node.text || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((prev) =>
                            prev.map((n) => (n.id === node.id ? { ...n, text: val } : n))
                          );
                        }}
                        onBlur={() => pushHistory(nodes, edges)}
                        placeholder="Type card markdown or thoughts..."
                        style={{
                          textAlign: node.textAlign || 'left',
                          color: node.textColor || (darkMode ? '#F4F4F5' : '#111827'),
                          fontFamily: node.fontFamily === 'handwriting' ? 'cursive, sans-serif' : undefined,
                        }}
                        className={`w-full h-full bg-transparent resize-none outline-none leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium ${fontFam} ${fontSz}`}
                      />
                    )}
                  </div>

                  {/* 4 Connection Ports (Anchor dots) */}
                  {(['top', 'bottom', 'left', 'right'] as CanvasAnchorSide[]).map((side) => {
                    let posClasses = '';
                    if (side === 'top') posClasses = 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
                    if (side === 'bottom') posClasses = 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
                    if (side === 'left') posClasses = 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2';
                    if (side === 'right') posClasses = 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2';

                    return (
                      <div
                        key={side}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const anchor = getNodeAnchorPos(node, side);
                          setConnectingFrom({
                            nodeId: node.id,
                            side,
                            startX: anchor.x,
                            startY: anchor.y,
                            currentX: anchor.x,
                            currentY: anchor.y,
                          });
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          if (connectingFrom && connectingFrom.nodeId !== node.id) {
                            handleConnectToNode(node.id, side);
                          }
                        }}
                        className={`absolute ${posClasses} w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-[#121215] cursor-crosshair transition-transform opacity-0 group-hover:opacity-100 hover:scale-130 hover:bg-amber-400 z-10`}
                        title={`Connect from ${side}`}
                      />
                    );
                  })}

                  {/* Resize Handle (Bottom Right) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      resizingNodeRef.current = {
                        id: node.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialWidth: node.width,
                        initialHeight: node.height,
                      };
                    }}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-purple-400"
                  >
                    <svg viewBox="0 0 6 6" className="w-2 h-2 fill-current">
                      <polygon points="6,0 6,6 0,6" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. CENTER INSTRUCTIONAL CARD */}
        {showCenterGuide && nodes.length <= 3 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
            <div className="relative px-8 py-5 rounded-2xl bg-[#1D1B26]/85 backdrop-blur-md border border-purple-500/20 text-center shadow-2xl">
              <button
                onClick={() => setShowCenterGuide(false)}
                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="space-y-1.5 text-sm font-medium text-purple-300/90 tracking-wide">
                <p>Drag from dock below or double click anywhere</p>
                <p>Right-click any card to customize color, font & rename</p>
                <p>Space + Drag to pan • Ctrl + Scroll to zoom</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. BOTTOM DOCK TOOLBAR */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#1E1E24]/90 backdrop-blur-lg border border-white/10 shadow-2xl">
          {/* 1. Note Card */}
          <button
            onClick={() => setShowNotePicker(true)}
            className="p-3 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-purple-300 transition-all flex flex-col items-center group relative cursor-pointer"
            title="Add Note to Canvas"
          >
            <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute -top-8 px-2 py-1 rounded bg-black text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Add Topic Note
            </span>
          </button>

          {/* 2. Text / Sticky Card */}
          <button
            onClick={() => handleAddTextCard()}
            className="p-3 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-amber-300 transition-all flex flex-col items-center group relative cursor-pointer"
            title="Add Text Card"
          >
            <AlignLeft className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute -top-8 px-2 py-1 rounded bg-black text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Add Text Card
            </span>
          </button>

          {/* 3. Media Card */}
          <button
            onClick={() =>
              setImageModal({
                isOpen: true,
                initialTitle: 'Image Asset',
                initialFit: 'contain',
              })
            }
            className="p-3 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-emerald-300 transition-all flex flex-col items-center group relative cursor-pointer"
            title="Add Image Card"
          >
            <ImageIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute -top-8 px-2 py-1 rounded bg-black text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Add Image Card
            </span>
          </button>
        </div>

        {/* 5. RIGHT FLOATING CONTROLS */}
        <div className="absolute right-4 top-18 z-30 flex flex-col gap-1 p-1.5 rounded-2xl bg-[#1E1E24]/85 backdrop-blur-lg border border-white/10 shadow-xl text-zinc-300">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Canvas Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="h-px w-full bg-white/10 my-0.5" />

          <button
            onClick={() => handleZoom(0.15)}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetView}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Reset View (100%)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleFitToScreen}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(-0.15)}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="h-px w-full bg-white/10 my-0.5" />

          <button
            onClick={handleUndo}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-px w-full bg-white/10 my-0.5" />

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Shortcuts & Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* 6. BOTTOM RIGHT STATUS */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 text-[11px] text-zinc-400 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-purple-400" />
            <span>{edges.length} connections</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* 7. RIGHT-CLICK CONTEXT MENU FOR CARDS */}
      {contextMenu && contextMenuNode && (
        <div
          id="canvas-context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-56 rounded-xl bg-[#1C1C22] border border-zinc-700 shadow-2xl p-2 text-xs text-zinc-200 select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Title */}
          <div className="px-2 py-1 font-semibold text-[11px] text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
            <span className="truncate">{contextMenuNode.title || 'Card Options'}</span>
            <span className="text-[10px] uppercase text-zinc-500">{contextMenuNode.type}</span>
          </div>

          <div className="py-1 space-y-0.5">
            {/* Rename */}
            <button
              type="button"
              onClick={() => {
                handleStartRename(
                  contextMenuNode.id,
                  contextMenuNode.title || (contextMenuNode.type === 'file' ? contextMenuNode.noteTitle || 'Note' : 'Card')
                );
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-colors text-left cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Rename Card</span>
            </button>

            {/* Change Color */}
            <div className="px-2.5 py-1.5">
              <div className="text-[10px] text-zinc-400 mb-1.5 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span>Card Color</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PALETTE.map((c) => {
                  const isCur = (contextMenuNode.color || '#7F56D9') === c.hex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleUpdateNode(contextMenuNode.id, { color: c.hex })}
                      style={{ backgroundColor: c.hex }}
                      className={`h-5 rounded-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                        isCur ? 'ring-2 ring-white scale-105' : ''
                      }`}
                      title={c.label}
                    >
                      {isCur && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Card Specific: Font Family & Font Size */}
            {contextMenuNode.type === 'text' && (
              <>
                <div className="h-px bg-zinc-800 my-1" />
                <div className="px-2.5 py-1">
                  <div className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    <span>Font Family</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {[
                      { id: 'sans', label: 'Sans' },
                      { id: 'serif', label: 'Serif' },
                      { id: 'mono', label: 'Mono' },
                      { id: 'handwriting', label: 'Handwrite' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          handleUpdateNode(contextMenuNode.id, {
                            fontFamily: f.id as 'sans' | 'serif' | 'mono' | 'handwriting',
                          })
                        }
                        className={`px-2 py-1 rounded text-center transition-colors cursor-pointer ${
                          (contextMenuNode.fontFamily || 'sans') === f.id
                            ? 'bg-purple-600 text-white font-semibold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-2.5 py-1">
                  <div className="text-[10px] text-zinc-400 mb-1">Font Size</div>
                  <div className="flex items-center gap-1 text-[10px]">
                    {[
                      { id: 'sm', label: 'S' },
                      { id: 'base', label: 'M' },
                      { id: 'lg', label: 'L' },
                      { id: 'xl', label: 'XL' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          handleUpdateNode(contextMenuNode.id, {
                            fontSize: s.id as 'sm' | 'base' | 'lg' | 'xl',
                          })
                        }
                        className={`flex-1 py-1 rounded text-center font-bold transition-colors cursor-pointer ${
                          (contextMenuNode.fontSize || 'base') === s.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Media Card Specific: Change image */}
            {contextMenuNode.type === 'media' && (
              <>
                <div className="h-px bg-zinc-800 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setContextMenu(null);
                    setImageModal({
                      isOpen: true,
                      targetNodeId: contextMenuNode.id,
                      initialUrl: contextMenuNode.mediaUrl,
                      initialTitle: contextMenuNode.title,
                      initialFit: contextMenuNode.mediaFit,
                    });
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-colors text-left cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Replace Image</span>
                </button>
              </>
            )}

            {/* Note Card Specific: Full Page Inspect & Fit Mode */}
            {contextMenuNode.type === 'file' && (
              <>
                <div className="h-px bg-zinc-800 my-1" />
                {(() => {
                  const menuNote = notes.find((n) => n.id === contextMenuNode.noteId);
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateNode(contextMenuNode.id, {
                            fitMode: (contextMenuNode.fitMode || 'fit-width') === 'fit-all' ? 'fit-width' : 'fit-all',
                          });
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-colors text-left cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>
                          {(contextMenuNode.fitMode || 'fit-width') === 'fit-all' ? 'Scrollable Page View' : 'Fit Entire Page View'}
                        </span>
                      </button>

                      {menuNote && (
                        <button
                          type="button"
                          onClick={() => {
                            setContextMenu(null);
                            setFullPageModalNote(menuNote);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-colors text-left cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Inspect Full Page Modal</span>
                        </button>
                      )}

                      {contextMenuNode.noteId && (
                        <button
                          type="button"
                          onClick={() => {
                            setContextMenu(null);
                            onOpenNote(contextMenuNode.noteId!);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-purple-600 hover:text-white transition-colors text-left cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Open in Note Editor</span>
                        </button>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            <div className="h-px bg-zinc-800 my-1" />

            {/* Duplicate */}
            <button
              type="button"
              onClick={() => handleDuplicateNode(contextMenuNode.id)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>Duplicate</span>
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                const nextNodes = nodes.filter((n) => n.id !== contextMenuNode.id);
                const nextEdges = edges.filter(
                  (ed) => ed.fromNode !== contextMenuNode.id && ed.toNode !== contextMenuNode.id
                );
                setNodes(nextNodes);
                setEdges(nextEdges);
                setSelectedNodeId(null);
                setContextMenu(null);
                pushHistory(nextNodes, nextEdges);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors text-left cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Card</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. MODAL: IMAGE CARD UPLOADER & CONFIG */}
      {imageModal && imageModal.isOpen && (
        <ImageCardModal
          targetNodeId={imageModal.targetNodeId}
          initialUrl={imageModal.initialUrl}
          initialTitle={imageModal.initialTitle}
          initialFit={imageModal.initialFit}
          darkMode={darkMode}
          onClose={() => setImageModal(null)}
          onSave={handleSaveImageCard}
        />
      )}

      {/* 9. MODAL: IMAGE LIGHTBOX */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxUrl} alt="Enlarged" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* 9.5 MODAL: FULL NOTE PAGE INSPECTION */}
      {fullPageModalNote && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 md:p-8"
          onClick={() => setFullPageModalNote(null)}
        >
          <div
            className={`w-full max-w-4xl h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
              darkMode ? 'bg-[#18181b] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">{fullPageModalNote.title}</h3>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {fullPageModalNote.subject} • {fullPageModalNote.topic} • {fullPageModalNote.paperStyle || 'blank'} page
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalFitMode((m) => (m === 'fit-width' ? 'fit-all' : 'fit-width'))}
                  className="px-2.5 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer"
                >
                  {modalFitMode === 'fit-width' ? 'Fit Page' : 'Scroll Width'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = fullPageModalNote.id;
                    setFullPageModalNote(null);
                    onOpenNote(id);
                  }}
                  className="px-3 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFullPageModalNote(null)}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Note Page Preview */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden bg-zinc-100/50 dark:bg-black/40 flex items-center justify-center">
              <div className="w-full h-full rounded-xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-800">
                <NotePagePreview
                  note={fullPageModalNote}
                  darkMode={darkMode}
                  fitMode={modalFitMode}
                  onOpenNote={() => {
                    const id = fullPageModalNote.id;
                    setFullPageModalNote(null);
                    onOpenNote(id);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: NOTE PICKER FOR CANVAS */}
      {showNotePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C21] border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Add Note to {topic} Canvas</h3>
                <p className="text-xs text-zinc-400">Select an existing note with text or drawings</p>
              </div>
              <button
                onClick={() => setShowNotePicker(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              <div className="text-xs font-semibold text-zinc-400 px-1 mb-1">Notes in this Topic:</div>
              {topicNotes.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  No notes in this topic yet.
                </div>
              ) : (
                topicNotes.map((n) => {
                  const hasStrokes = n.strokes && n.strokes.length > 0;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleAddNoteCard(n)}
                      className="p-3 rounded-xl bg-zinc-900/60 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-600/50 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-purple-300 truncate">
                            {n.title}
                          </span>
                          {hasStrokes && (
                            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold">
                              <PenTool className="w-2.5 h-2.5" />
                              <span>{n.strokes.length} strokes</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {n.content ? n.content.replace(/<[^>]*>?/gm, '').slice(0, 60) : 'Document'}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 shrink-0 ml-2" />
                    </div>
                  );
                })
              )}

              {/* Other notes in same subject */}
              {notes.filter((n) => n.subject === subject && n.topic !== topic).length > 0 && (
                <>
                  <div className="text-xs font-semibold text-zinc-400 px-1 pt-3 mb-1">
                    Other Notes in {subject}:
                  </div>
                  {notes
                    .filter((n) => n.subject === subject && n.topic !== topic)
                    .map((n) => {
                      const hasStrokes = n.strokes && n.strokes.length > 0;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleAddNoteCard(n)}
                          className="p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-300 truncate">{n.title}</span>
                              {hasStrokes && (
                                <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold">
                                  <PenTool className="w-2.5 h-2.5" />
                                  <span>{n.strokes.length}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate">Topic: {n.topic}</div>
                          </div>
                          <Plus className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 shrink-0 ml-2" />
                        </div>
                      );
                    })}
                </>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowNotePicker(false);
                  onCreateNoteInTopic(subject, topic);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Note Document</span>
              </button>

              <button
                onClick={() => setShowNotePicker(false)}
                className="px-3 py-2 rounded-xl text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: HELP & SHORTCUTS */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C21] border border-zinc-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Obsidian Canvas Controls</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Right-Click Card</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Change Color / Font / Rename</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Rename Card</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Double click card title</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Full Note Page</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Displays full text & drawings</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Fit / Inspect</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Click Fit button or Eye icon</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Pan Canvas</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Space + Drag / Middle Click</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Zoom In / Out</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Ctrl + Scroll / + and -</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Connect Cards</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Drag edge anchor circles</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Delete Card / Arrow</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-purple-300">Select + Delete / Backspace</span>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 12. MODAL: CANVAS SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#1C1C21] border border-zinc-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white">Canvas Preferences</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-zinc-300">Snap to 20px Grid</span>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded accent-purple-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-zinc-300">Show Helper Guide</span>
                <input
                  type="checkbox"
                  checked={showCenterGuide}
                  onChange={(e) => setShowCenterGuide(e.target.checked)}
                  className="rounded accent-purple-600 w-4 h-4 cursor-pointer"
                />
              </label>

              <div className="pt-3 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setNodes([]);
                    setEdges([]);
                    pushHistory([], []);
                    setShowSettingsModal(false);
                  }}
                  className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Clear All Canvas Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// SUBCOMPONENT: IMAGE MODAL (UPLOAD, URL, PRESETS)
// ----------------------------------------------------
interface ImageCardModalProps {
  targetNodeId?: string;
  initialUrl?: string;
  initialTitle?: string;
  initialFit?: 'contain' | 'cover';
  darkMode: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    url: string;
    name: string;
    fit: 'contain' | 'cover';
    targetNodeId?: string;
  }) => void;
}

const ImageCardModal: React.FC<ImageCardModalProps> = ({
  targetNodeId,
  initialUrl,
  initialTitle,
  initialFit = 'contain',
  darkMode,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [title, setTitle] = useState(initialTitle || (targetNodeId ? 'Image' : 'Diagram Asset'));
  const [imageUrl, setImageUrl] = useState(initialUrl || '');
  const [imageName, setImageName] = useState('Uploaded Image');
  const [fit, setFit] = useState<'contain' | 'cover'>(initialFit);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setImageUrl(result);
        if (!title || title === 'Diagram Asset' || title === 'Image') {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#1C1C22] border border-zinc-700 shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">{targetNodeId ? 'Edit Image Card' : 'Add Image to Canvas'}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Card Title Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Image Card Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Architecture Flow, Diagram, Screenshot"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-emerald-500 outline-none text-xs text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Tab navigation */}
          <div className="flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'upload' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'url' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Web URL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'presets' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Diagram Presets
            </button>
          </div>

          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-700 hover:border-emerald-500/70 bg-zinc-900/50'
                }`}
              >
                <Upload className="w-8 h-8 text-emerald-400" />
                <p className="text-xs font-semibold text-zinc-200">
                  Click to browse or drag & drop an image
                </p>
                <p className="text-[10px] text-zinc-500">Supports PNG, JPG, SVG, WebP, GIF</p>
              </div>
            </div>
          )}

          {/* TAB 2: URL */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/diagram.png"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-emerald-500 outline-none text-xs text-white placeholder:text-zinc-500"
              />
              <p className="text-[10px] text-zinc-500">Paste any public web image or diagram link</p>
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 gap-2">
              {DIAGRAM_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.title}
                  onClick={() => {
                    setImageUrl(tmpl.url);
                    setImageName(tmpl.title);
                    if (!title || title === 'Diagram Asset') setTitle(tmpl.title);
                  }}
                  className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    imageUrl === tmpl.url
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <img src={tmpl.url} alt={tmpl.title} className="w-full h-20 object-cover rounded-lg" />
                  <span className="text-[11px] font-semibold text-zinc-300 truncate">{tmpl.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* PREVIEW & FIT SETTINGS */}
          {imageUrl && (
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-zinc-700"
                />
                <div className="text-xs">
                  <span className="font-semibold text-zinc-300 block truncate max-w-[180px]">
                    {imageName}
                  </span>
                  <span className="text-[10px] text-emerald-400">Ready to place</span>
                </div>
              </div>

              {/* Fit mode */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFit('contain')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    fit === 'contain' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Fit full
                </button>
                <button
                  type="button"
                  onClick={() => setFit('cover')}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                    fit === 'cover' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Fill card
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!imageUrl}
            onClick={() => {
              if (imageUrl) {
                onSave({
                  title: title.trim() || 'Image Asset',
                  url: imageUrl,
                  name: imageName,
                  fit,
                  targetNodeId,
                });
              }
            }}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {targetNodeId ? 'Save Changes' : 'Insert on Canvas'}
          </button>
        </div>
      </div>
    </div>
  );
};
