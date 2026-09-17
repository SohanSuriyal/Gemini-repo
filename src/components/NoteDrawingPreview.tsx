import React, { useEffect, useRef } from 'react';
import { DrawingStroke } from '../types';
import { getStroke } from 'perfect-freehand';

interface NoteDrawingPreviewProps {
  strokes: DrawingStroke[];
  darkMode?: boolean;
  className?: string;
  maxHeight?: number;
}

function filterJitterPoints(points: { x: number; y: number; pressure?: number }[]) {
  if (points.length <= 2) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = result[result.length - 1];
    const cur = points[i];
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (dx * dx + dy * dy >= 1.5 || i === points.length - 1) {
      result.push(cur);
    }
  }
  return result;
}

function getSvgPathFromStroke(strokePoints: number[][]): Path2D {
  const p = new Path2D();
  if (strokePoints.length === 0) return p;
  p.moveTo(strokePoints[0][0], strokePoints[0][1]);
  for (let i = 1; i < strokePoints.length; i++) {
    p.lineTo(strokePoints[i][0], strokePoints[i][1]);
  }
  p.closePath();
  return p;
}

export const NoteDrawingPreview: React.FC<NoteDrawingPreviewProps> = ({
  strokes,
  darkMode = false,
  className = '',
  maxHeight = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (!strokes || strokes.length === 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Compute bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const stroke of strokes) {
      for (const pt of stroke.points || []) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return;
    }

    const padding = 16;
    const contentWidth = Math.max(maxX - minX + padding * 2, 80);
    const contentHeight = Math.max(maxY - minY + padding * 2, 60);

    const containerWidth = container.clientWidth || 240;
    const containerHeight = Math.min(container.clientHeight || maxHeight, maxHeight);

    const scale = Math.min(
      (containerWidth - 8) / contentWidth,
      (containerHeight - 8) / contentHeight,
      1.5
    );

    const finalWidth = Math.max(containerWidth, 120);
    const finalHeight = Math.max(containerHeight, 80);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = finalWidth * dpr;
    canvas.height = finalHeight * dpr;
    canvas.style.width = `${finalWidth}px`;
    canvas.style.height = `${finalHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, finalWidth, finalHeight);

    // Center the drawing inside canvas
    const drawnW = contentWidth * scale;
    const drawnH = contentHeight * scale;
    const offsetX = (finalWidth - drawnW) / 2;
    const offsetY = (finalHeight - drawnH) / 2;

    ctx.translate(offsetX + padding * scale, offsetY + padding * scale);
    ctx.scale(scale, scale);
    ctx.translate(-minX, -minY);

    // Render strokes
    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;
      const rawPts = stroke.points;
      const isHighlighter = stroke.tool === 'highlighter';

      ctx.save();
      if (isHighlighter) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = Math.max(stroke.size * 2.5, 10);

        if (rawPts.length === 1) {
          ctx.beginPath();
          ctx.arc(rawPts[0].x, rawPts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(rawPts[0].x, rawPts[0].y);
          for (let i = 1; i < rawPts.length - 1; i++) {
            const xc = (rawPts[i].x + rawPts[i + 1].x) / 2;
            const yc = (rawPts[i].y + rawPts[i + 1].y) / 2;
            ctx.quadraticCurveTo(rawPts[i].x, rawPts[i].y, xc, yc);
          }
          ctx.lineTo(rawPts[rawPts.length - 1].x, rawPts[rawPts.length - 1].y);
          ctx.stroke();
        }
      } else {
        // Pen
        let strokeColor = stroke.color;
        // In dark mode, if user drew with dark black (#000000 or #111111), adjust brightness for contrast
        if (darkMode && (strokeColor === '#111111' || strokeColor === '#000000' || strokeColor === '#1f2937')) {
          strokeColor = '#E2E8F0';
        } else if (!darkMode && (strokeColor === '#FFFFFF' || strokeColor === '#F8FAFC')) {
          strokeColor = '#1E293B';
        }

        ctx.fillStyle = strokeColor;
        ctx.strokeStyle = strokeColor;
        ctx.globalAlpha = 1.0;

        if (rawPts.length === 1) {
          ctx.beginPath();
          ctx.arc(rawPts[0].x, rawPts[0].y, Math.max(1, stroke.size / 2), 0, Math.PI * 2);
          ctx.fill();
        } else {
          const cleanPts = filterJitterPoints(rawPts);
          const inputPoints = cleanPts.map((p) => [p.x, p.y, p.pressure ?? 0.5]);

          try {
            const outline = getStroke(inputPoints, {
              size: stroke.size,
              thinning: 0.45,
              smoothing: 0.92,
              streamline: 0.7,
              simulatePressure: true,
              last: true,
            });

            if (outline && outline.length > 2) {
              const path = getSvgPathFromStroke(outline);
              ctx.fill(path);
            } else {
              ctx.lineWidth = stroke.size;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(cleanPts[0].x, cleanPts[0].y);
              for (let i = 1; i < cleanPts.length - 1; i++) {
                const xc = (cleanPts[i].x + cleanPts[i + 1].x) / 2;
                const yc = (cleanPts[i].y + cleanPts[i + 1].y) / 2;
                ctx.quadraticCurveTo(cleanPts[i].x, cleanPts[i].y, xc, yc);
              }
              ctx.lineTo(cleanPts[cleanPts.length - 1].x, cleanPts[cleanPts.length - 1].y);
              ctx.stroke();
            }
          } catch {
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(cleanPts[0].x, cleanPts[0].y);
            for (let i = 1; i < cleanPts.length; i++) {
              ctx.lineTo(cleanPts[i].x, cleanPts[i].y);
            }
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }, [strokes, darkMode, maxHeight]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-md ${className}`}
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
    </div>
  );
};
