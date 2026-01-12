import { useState } from 'react';
import { Document } from 'react-pdf';
import '../utils/pdf-worker';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { PDFPageWrapper } from './PDFPageWrapper';
import { Annotation } from '../types';

interface PDFViewerProps {
    file: File | string | null;
    annotations: Annotation[];
    mode: 'none' | 'text' | 'ink';
    onAddAnnotation: (ann: Annotation) => void;
    onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
    currentFontSize?: number;
    currentColor?: string;
}

export const PDFViewer = ({
    file,
    annotations,
    mode,
    onAddAnnotation,
    onUpdateAnnotation,
    currentFontSize,
    currentColor
}: PDFViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<Error | null>(null);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoadError(null);
    }

    function onDocumentLoadError(error: Error) {
        console.error('PDF Load Error:', error);
        setLoadError(error);
    }

    if (!file) return <div className="text-white text-center mt-10">No file selected. Please open a PDF.</div>;

    return (
        <div className="pdf-viewer-container flex flex-col items-center">
            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div className="text-white">Loading PDF...</div>}
                error={
                    <div className="text-red-500 p-4 bg-red-900/20 rounded max-w-lg overflow-auto">
                        <h3 className="font-bold">Failed to load PDF!</h3>
                        {loadError && (
                            <pre className="text-xs mt-2 text-left whitespace-pre-wrap">
                                {loadError.message}
                                {'\n'}
                                {loadError.stack}
                            </pre>
                        )}
                    </div>
                }
            >
                {Array.from(new Array(numPages), (el, index) => (
                    <PDFPageWrapper
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        annotations={annotations}
                        mode={mode}
                        onAddAnnotation={onAddAnnotation}
                        onUpdateAnnotation={onUpdateAnnotation}
                        currentFontSize={currentFontSize}
                        currentColor={currentColor}
                    />
                ))}
            </Document>
        </div>
    );
};
