import React, { useState } from 'react';
import { X, Download, FileDown, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { NoteItem } from '../types';

interface ExportModalProps {
  note: NoteItem;
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  note,
  isOpen,
  onClose,
  darkMode = false,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportStep, setExportStep] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualDownloadUrl, setManualDownloadUrl] = useState<{ url: string; filename: string } | null>(null);

  if (!isOpen) return null;

  const title = note.title || 'Untitled note';
  const safeFileName = `${title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.pdf`;

  // Fallback direct canvas renderer if DOM capture is unavailable
  const generateFallbackPdf = (): jsPDF => {
    const fallbackCanvas = document.createElement('canvas');
    const fbWidth = 1200;
    const fbHeight = Math.max(1600, (note.textBoxes?.reduce((max, b) => Math.max(max, b.y + 300), 1600) || 1600));
    fallbackCanvas.width = fbWidth;
    fallbackCanvas.height = fbHeight;
    const ctx = fallbackCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    // Clean white page background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, fbWidth, fbHeight);

    // Render Paper Style lines
    if (note.paperStyle === 'ruled') {
      ctx.strokeStyle = 'rgba(127, 86, 217, 0.16)';
      ctx.lineWidth = 1;
      for (let y = 140; y < fbHeight; y += 32) {
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.lineTo(fbWidth - 32, y);
        ctx.stroke();
      }
    } else if (note.paperStyle === 'grid') {
      ctx.strokeStyle = 'rgba(127, 86, 217, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 32; x < fbWidth; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, fbHeight - 32);
        ctx.stroke();
      }
      for (let y = 40; y < fbHeight; y += 28) {
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.lineTo(fbWidth - 32, y);
        ctx.stroke();
      }
    }

    // Header banner
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(title, 48, 70);

    ctx.fillStyle = '#6b7280';
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const metaText = `Subject: ${(note.subject || 'General').toUpperCase()}   •   Topic: ${note.topic || 'General'}   •   Date: ${new Date(note.updated).toLocaleDateString()}`;
    ctx.fillText(metaText, 48, 102);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(48, 118);
    ctx.lineTo(fbWidth - 48, 118);
    ctx.stroke();

    // Render text boxes
    if (note.textBoxes && note.textBoxes.length > 0) {
      ctx.fillStyle = '#1f2937';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      note.textBoxes.forEach((tb) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = tb.content || '';
        const lines = (tempDiv.innerText || tempDiv.textContent || '').split('\n');
        let curY = Math.max(145, tb.y + 40);
        lines.forEach((line) => {
          if (line.trim()) {
            ctx.fillText(line, Math.max(48, tb.x), curY);
            curY += 24;
          }
        });
      });
    }

    // Render handwriting and highlighter strokes
    if (note.strokes && note.strokes.length > 0) {
      note.strokes.forEach((stroke) => {
        if (!stroke.points || stroke.points.length === 0) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'highlighter') {
          ctx.strokeStyle = stroke.color;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = Math.max(stroke.size * 3, 16);
        } else {
          ctx.strokeStyle = stroke.color;
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = stroke.size;
        }

        const pts = stroke.points;
        if (pts.length === 1) {
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.addImage(fallbackCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pw, ph);
    return doc;
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setErrorMessage(null);
    setDownloadSuccess(null);
    setExportStep('Preparing note canvas...');

    try {
      let doc: jsPDF;
      const targetEl = document.getElementById('note-page-content-wrapper');

      if (targetEl) {
        setExportStep('Capturing note page & handwriting...');
        const originalCanvas = document.getElementById('note-drawing-canvas') as HTMLCanvasElement | null;

        const capturedCanvas = await html2canvas(targetEl, {
          scale: 2, // High DPI capture for crisp text & strokes
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (clonedDoc) => {
            const clonedWrapper = clonedDoc.getElementById('note-page-content-wrapper');
            if (clonedWrapper) {
              clonedWrapper.classList.add('exporting-pdf');
              clonedWrapper.style.backgroundColor = '#ffffff';
              clonedWrapper.style.color = '#111827';

              // Hide editing handles, resize grips, delete buttons, pdf controls
              const toHide = clonedWrapper.querySelectorAll(
                '.drag-handle, .resize-handle, .delete-box-btn, .pdf-header-controls, .no-create-box, button'
              );
              toHide.forEach((el) => {
                (el as HTMLElement).style.display = 'none';
              });

              // Clean text box outlines/focus rings
              const boxes = clonedWrapper.querySelectorAll('.onenote-box-container');
              boxes.forEach((el) => {
                (el as HTMLElement).style.boxShadow = 'none';
                (el as HTMLElement).style.border = 'none';
                (el as HTMLElement).style.outline = 'none';
              });
            }

            // Copy drawing canvas pixels directly into the cloned canvas
            if (originalCanvas) {
              const clonedCanvas = clonedDoc.getElementById('note-drawing-canvas') as HTMLCanvasElement | null;
              if (clonedCanvas) {
                clonedCanvas.width = originalCanvas.width;
                clonedCanvas.height = originalCanvas.height;
                const cctx = clonedCanvas.getContext('2d');
                if (cctx) {
                  cctx.drawImage(originalCanvas, 0, 0);
                }
              }
            }
          },
        });

        setExportStep('Formatting A4 PDF pages...');
        doc = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4',
        });

        const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
        const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
        const margin = 28;
        const contentWidth = pageWidth - margin * 2;
        const contentHeight = pageHeight - margin * 2;

        // Header on Page 1
        const headerHeight = 50;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(24, 24, 27);
        doc.text(title, margin, 42);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(113, 113, 122);
        const metaStr = `Subject: ${(note.subject || 'General').toUpperCase()}   •   Topic: ${note.topic || 'General'}   •   Date: ${new Date(note.updated).toLocaleDateString()}`;
        doc.text(metaStr, margin, 57);

        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.8);
        doc.line(margin, 66, pageWidth - margin, 66);

        const cW = capturedCanvas.width;
        const cH = capturedCanvas.height;

        // Slice for Page 1 (leaving room for header)
        const page1MaxPtHeight = contentHeight - headerHeight;
        const page1SliceCanvasHeight = Math.min(cH, cW * (page1MaxPtHeight / contentWidth));

        const sliceCanvas1 = document.createElement('canvas');
        sliceCanvas1.width = cW;
        sliceCanvas1.height = page1SliceCanvasHeight;
        const sctx1 = sliceCanvas1.getContext('2d')!;
        sctx1.fillStyle = '#ffffff';
        sctx1.fillRect(0, 0, cW, page1SliceCanvasHeight);
        sctx1.drawImage(capturedCanvas, 0, 0, cW, page1SliceCanvasHeight, 0, 0, cW, page1SliceCanvasHeight);

        const imgData1 = sliceCanvas1.toDataURL('image/jpeg', 0.95);
        const renderHeight1 = (page1SliceCanvasHeight * contentWidth) / cW;
        doc.addImage(imgData1, 'JPEG', margin, margin + headerHeight, contentWidth, renderHeight1);

        // Subsequent pages if note canvas is taller than 1 page
        let currentY = page1SliceCanvasHeight;
        while (currentY < cH) {
          doc.addPage();
          const pageSliceCanvasHeight = Math.min(cH - currentY, cW * (contentHeight / contentWidth));

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = cW;
          sliceCanvas.height = pageSliceCanvasHeight;
          const sctx = sliceCanvas.getContext('2d')!;
          sctx.fillStyle = '#ffffff';
          sctx.fillRect(0, 0, cW, pageSliceCanvasHeight);
          sctx.drawImage(capturedCanvas, 0, currentY, cW, pageSliceCanvasHeight, 0, 0, cW, pageSliceCanvasHeight);

          const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          const renderHeight = (pageSliceCanvasHeight * contentWidth) / cW;
          doc.addImage(imgData, 'JPEG', margin, margin, contentWidth, renderHeight);

          currentY += pageSliceCanvasHeight;
        }
      } else {
        // Fallback engine
        setExportStep('Generating document from note data...');
        doc = generateFallbackPdf();
      }

      setExportStep('Downloading PDF...');

      // Safe, cross-browser blob trigger
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = safeFileName;
      downloadLink.setAttribute('target', '_blank');
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setManualDownloadUrl({ url: blobUrl, filename: safeFileName });
      setDownloadSuccess('PDF downloaded successfully!');

      setTimeout(() => {
        if (downloadLink.parentNode) {
          document.body.removeChild(downloadLink);
        }
      }, 1000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      // Try fallback canvas generation if html2canvas had any unexpected error
      try {
        setExportStep('Retrying with direct document renderer...');
        const fallbackDoc = generateFallbackPdf();
        const fallbackBlob = fallbackDoc.output('blob');
        const fallbackUrl = URL.createObjectURL(fallbackBlob);
        const fallbackLink = document.createElement('a');
        fallbackLink.href = fallbackUrl;
        fallbackLink.download = safeFileName;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        setManualDownloadUrl({ url: fallbackUrl, filename: safeFileName });
        setDownloadSuccess('PDF downloaded successfully!');
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr?.message || 'Failed to generate PDF. Please try again.');
      }
    } finally {
      setIsExportingPdf(false);
      setExportStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
          darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-700">
          <div>
            <h3 className="text-lg font-bold">Export Note</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Download your note page as a PDF document</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {downloadSuccess && (
          <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <span>{downloadSuccess}</span>
              {manualDownloadUrl && (
                <div className="mt-1">
                  <a
                    href={manualDownloadUrl.url}
                    download={manualDownloadUrl.filename}
                    className="underline hover:text-emerald-100 font-bold"
                  >
                    Click here if download didn&apos;t start automatically
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500 text-white text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Note Page PDF Card (The ONLY export option) */}
        <div className="flex flex-col gap-4">
          <div
            className={`p-4 rounded-xl border transition-all ${
              darkMode
                ? 'border-purple-800/60 bg-purple-950/20'
                : 'border-purple-200 bg-purple-50/40'
            }`}
          >
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#7F56D9] text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileDown className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#7F56D9] dark:text-purple-300">
                  Download Note Page as PDF (.pdf)
                </div>
                <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Directly exports the full note page, including:
                </div>
                <ul className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1.5 space-y-0.5 list-disc list-inside">
                  <li>Handwritten pen & highlighter drawing strokes</li>
                  <li>OneNote text containers & formatting</li>
                  <li>Paper style grid & ruled line patterns</li>
                  <li>Multi-page high-resolution A4 layout</li>
                </ul>
              </div>
            </div>

            {/* Note Information Pill */}
            <div className="px-3 py-2 rounded-lg bg-white/70 dark:bg-zinc-900/60 border border-purple-100 dark:border-purple-900/40 text-xs flex items-center justify-between">
              <div className="truncate font-medium text-gray-800 dark:text-zinc-200">
                {title}
              </div>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 uppercase font-semibold shrink-0 ml-2">
                {note.subject || 'General'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            id="download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all shadow-md cursor-pointer ${
              isExportingPdf
                ? 'bg-[#7F56D9]/70 cursor-wait'
                : 'bg-[#7F56D9] hover:bg-[#6941C6] active:bg-[#53389E]'
            }`}
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{exportStep || 'Generating PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Download Note Page as PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info / Close */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
