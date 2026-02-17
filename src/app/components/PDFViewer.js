'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import './PDFViewer.css';

export default function PDFViewer({ isOpen, onClose, pdfUrl, citation, highlightText, pageNumber = 1 }) {
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(pageNumber);
  }, [pageNumber]);

  if (!isOpen || !pdfUrl) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-title">
            <span className="pdf-icon">📄</span>
            <div className="pdf-title-text">
              <h3>{citation || 'Legal Document'}</h3>
              {highlightText && (
                <p className="pdf-highlight-preview">
                  "{highlightText.substring(0, 60)}..."
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="pdf-close-btn" title="Close">
            <X size={24} />
          </button>
        </div>

        <div className="pdf-viewer-controls">
          <div className="pdf-zoom-controls">
            <button onClick={handleZoomOut} className="pdf-control-btn" title="Zoom out">
              <ZoomOut size={18} />
            </button>
            <span className="pdf-zoom-level">{zoom}%</span>
            <button onClick={handleZoomIn} className="pdf-control-btn" title="Zoom in">
              <ZoomIn size={18} />
            </button>
          </div>

          <div className="pdf-page-controls">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="pdf-control-btn" title="Previous page">
              <ChevronLeft size={18} />
            </button>
            <span className="pdf-page-number">Page {currentPage}</span>
            <button onClick={() => setCurrentPage(prev => prev + 1)} className="pdf-control-btn" title="Next page">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="pdf-viewer-container">
          <iframe
            src={`${pdfUrl}#page=${currentPage}`}
            className="pdf-iframe"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            title="PDF Viewer"
            onLoad={() => setIsLoading(false)}
            onLoadStart={() => setIsLoading(true)}
          />
          {isLoading && (
            <div className="pdf-loading">
              <div className="pdf-spinner"></div>
              <p>Loading PDF...</p>
            </div>
          )}
        </div>

        <div className="pdf-viewer-footer">
          <p className="pdf-footer-text">
            {highlightText && (
              <>
                <strong>Highlighted text:</strong> "{highlightText}"
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
