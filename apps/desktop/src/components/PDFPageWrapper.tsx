import { Page } from 'react-pdf';
import { useState } from 'react';
import { PageViewport } from 'pdfjs-dist';
import { AnnotationLayer } from './AnnotationLayer';
import { Annotation } from '../types';

interface PDFPageWrapperProps {
    pageNumber: number;
    annotations: Annotation[];
    mode: 'none' | 'text' | 'ink';
    onAddAnnotation: (ann: Annotation) => void;
    onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
    currentFontSize?: number;
    currentColor?: string;
}

export const PDFPageWrapper = ({
    pageNumber,
    annotations,
    mode,
    onAddAnnotation,
    onUpdateAnnotation,
    currentFontSize,
    currentColor
}: PDFPageWrapperProps) => {
    const [viewport, setViewport] = useState<PageViewport | null>(null);

    // Fixed scale for MVP to keep it simple. 
    // If we implement zoom, we lift 'scale' state to PDFViewer and pass it down.
    const scale = 1.0;

    function onRenderSuccess(page: any) {
        // react-pdf v9 passes the PDFPageProxy
        if (page && page.getViewport) {
            const vp = page.getViewport({ scale });
            setViewport(vp);
        }
    }

    return (
        <div style={{ position: 'relative', marginBottom: '20px' }} className="shadow-lg">
            <Page
                pageNumber={pageNumber}
                scale={scale}
                onRenderSuccess={onRenderSuccess}
                renderTextLayer={true}
                renderAnnotationLayer={false}
            />
            {viewport && (
                <AnnotationLayer
                    pageIndex={pageNumber - 1} // PDF page index is 0-based
                    viewport={viewport}
                    annotations={annotations}
                    mode={mode}
                    onAdd={onAddAnnotation}
                    onUpdate={onUpdateAnnotation}
                    currentFontSize={currentFontSize}
                    currentColor={currentColor}
                />
            )}
        </div>
    )
}
