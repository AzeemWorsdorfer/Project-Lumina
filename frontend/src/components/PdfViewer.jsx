import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { X, Minus, Maximize2, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const PdfViewer = ({ url, onClose, initialPosition = { x: 100, y: 100 }, initialSize = { width: 600, height: 700 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest(".resize-handle")) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  }, [size]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
      if (isResizing) {
        const newWidth = Math.max(400, resizeStart.current.width + (e.clientX - resizeStart.current.x));
        const newHeight = Math.max(300, resizeStart.current.height + (e.clientY - resizeStart.current.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (err) => {
    console.error("PDF load error:", err);
    setError("Failed to load PDF");
  };

  const changePage = (offset) => {
    setPageNumber((prev) => Math.min(Math.max(1, prev + offset), numPages));
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-glass rounded-lg shadow-theme-lg flex items-center gap-2 px-3 py-2">
        <FileText className="w-4 h-4 text-muted" />
        <span className="text-sm text-secondary">PDF Viewer</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-secondary rounded"
          aria-label="Restore PDF viewer"
        >
          <Maximize2 className="w-4 h-4 text-muted" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-secondary rounded"
          aria-label="Close PDF viewer"
        >
          <X className="w-4 h-4 text-muted" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bg-glass-strong rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 bg-secondary/40 border-b border-default cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-primary">PDF Viewer</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-elevated rounded"
            aria-label="Minimize PDF viewer"
          >
            <Minus className="w-4 h-4 text-muted" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-elevated rounded"
            aria-label="Close PDF viewer"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-primary custom-scrollbar">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span className="text-secondary">Loading PDF...</span>
              </div>
            }
          >
            <div className="flex justify-center p-4">
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                width={size.width - 40}
              />
            </div>
          </Document>
        )}
      </div>

      {numPages && (
        <div className="flex items-center justify-center gap-4 px-3 py-2 bg-secondary/40 border-t border-default">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed rounded"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4 text-muted" />
          </button>
          <span className="text-sm text-secondary font-serif">{pageNumber} / {numPages}</span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1 hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed rounded"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>
        </div>
      )}

      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeStart}
      >
        <svg
          className="w-4 h-4 text-muted"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M14 14H10L14 10V14ZM14 6V10L10 14H6L14 6Z" />
        </svg>
      </div>
    </div>
  );
};

export default PdfViewer;
