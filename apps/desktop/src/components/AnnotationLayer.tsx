import React, { useState, useRef } from 'react';
import { PageViewport } from 'pdfjs-dist';
import { Annotation, Point } from '../types';
import { pdfToViewport, viewportToPdf } from '../utils/pdfCoords';
import { v4 as uuidv4 } from 'uuid';

interface AnnotationLayerProps {
    pageIndex: number;
    viewport: PageViewport;
    annotations: Annotation[];
    mode: 'none' | 'text' | 'ink';
    onAdd: (ann: Annotation) => void;
    onUpdate: (id: string, patch: Partial<Annotation>) => void;
    currentFontSize?: number;
    currentColor?: string;
}

export const AnnotationLayer = ({
    pageIndex,
    viewport,
    annotations,
    mode,
    onAdd,
    onUpdate,
    currentFontSize = 12,
    currentColor = '#000000'
}: AnnotationLayerProps) => {
    const layerRef = useRef<HTMLDivElement>(null);

    // Drag State
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

    const getPoint = (e: React.MouseEvent): Point => {
        if (!layerRef.current) return { x: 0, y: 0 };
        const rect = layerRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode === 'ink') {
            setIsDrawing(true);
            setCurrentStroke([getPoint(e)]);
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDrawing) {
            setCurrentStroke(prev => [...prev, getPoint(e)]);
        } else if (draggingId) {
            const p = getPoint(e);
            // Update position visually (expensive to update state on every frame? 
            // We can throttle or just do it. For desktop app, direct React state might be fast enough for < 100 objs)

            // Calculate new top-left based on mouse position and offset
            const newXPx = p.x - dragOffset.x;
            const newYPx = p.y - dragOffset.y;

            // Convert to PDF and update parent
            const [xPt, yPt] = viewportToPdf(newXPx, newYPx, viewport);
            onUpdate(draggingId, { xPt, yPt });
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (currentStroke.length < 2) {
                setCurrentStroke([]);
                return;
            }
            // Add Ink logic...
            const strokePts = currentStroke.map(p => {
                const [xPt, yPt] = viewportToPdf(p.x, p.y, viewport);
                return { x: xPt, y: yPt };
            });
            const newAnn: Annotation = {
                id: uuidv4(),
                type: 'ink',
                pageIndex,
                xPt: 0,
                yPt: 0,
                strokes: [strokePts],
                color: currentColor, // Use selected color
                thicknessPt: 2,
            };
            onAdd(newAnn);
            setCurrentStroke([]);
        }

        if (draggingId) {
            setDraggingId(null);
        }
    };

    const handleLayerClick = (e: React.MouseEvent) => {
        if (mode === 'text' && !isDrawing && !draggingId && !editingId) {
            const p = getPoint(e);
            const [xPt, yPt] = viewportToPdf(p.x, p.y, viewport);

            const newAnn: Annotation = {
                id: uuidv4(),
                type: 'text',
                pageIndex,
                xPt,
                yPt,
                text: 'Double click to edit',
                fontSizePt: currentFontSize, // Use selected font size
                widthPt: 150,
                heightPt: 20,
                color: currentColor, // Use selected color
            };
            onAdd(newAnn);
        }
        // Click outside to close edit
        if (editingId) {
            setEditingId(null);
        }
    };

    const renderStroke = (points: Point[], color: string, width: number) => {
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    };

    return (
        <div
            ref={layerRef}
            className="annotation-layer"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 10,
                cursor: mode === 'text' ? 'text' : (mode === 'ink' ? 'crosshair' : 'default'),
                width: '100%',
                height: '100%',
                touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleLayerClick}
        >
            {/* SVG Layer for Ink */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {annotations.map(ann => {
                    if (ann.pageIndex !== pageIndex) return null;
                    if (ann.type === 'ink' && ann.strokes) {
                        return ann.strokes.map((stroke, i) => {
                            const pxPoints = stroke.map(pt => {
                                const [x, y] = pdfToViewport(pt.x, pt.y, viewport);
                                return { x, y };
                            });
                            return (
                                <g key={`${ann.id}-${i}`}>
                                    {renderStroke(pxPoints, ann.color || 'red', (ann.thicknessPt || 2) * viewport.scale)}
                                </g>
                            );
                        });
                    }
                    return null;
                })}
                {isDrawing && renderStroke(currentStroke, 'blue', 2)}
            </svg>

            {/* Div Layer for Text */}
            {annotations.map(ann => {
                if (ann.pageIndex !== pageIndex) return null;
                if (ann.type === 'text') {
                    const [left, top] = pdfToViewport(ann.xPt, ann.yPt, viewport);
                    const fontSizePx = (ann.fontSizePt || 12) * viewport.scale;

                    if (editingId === ann.id) {
                        return (
                            <input
                                key={ann.id}
                                autoFocus
                                defaultValue={ann.text}
                                style={{
                                    position: 'absolute',
                                    left: left,
                                    top: top,
                                    fontSize: `${fontSizePx}px`,
                                    color: ann.color || 'black',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '1px solid #1a73e8',
                                    outline: 'none',
                                    padding: '2px',
                                    zIndex: 20
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                    onUpdate(ann.id, { text: e.target.value });
                                    setEditingId(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                    }
                                }}
                            />
                        );
                    }

                    return (
                        <div
                            key={ann.id}
                            style={{
                                position: 'absolute',
                                left: left,
                                top: top,
                                fontSize: `${fontSizePx}px`,
                                color: ann.color || 'black',
                                userSelect: 'none',
                                cursor: mode === 'none' ? 'grab' : 'text',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'auto',
                                border: mode === 'none' ? '1px dashed transparent' : 'none',
                            }}
                            className={mode === 'none' ? 'hover:border-blue-400 hover:bg-blue-50/10' : ''}
                            onClick={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingId(ann.id);
                            }}
                            onMouseDown={(e) => {
                                if (mode === 'none') {
                                    e.stopPropagation();
                                    setDraggingId(ann.id);

                                    // Calculate offset from top-left of the box
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    // Convert mouse visual client coords to container visual coords
                                    // parent rect
                                    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
                                    if (parentRect) {
                                        // offset inside the text box itself
                                        const offsetX = e.clientX - rect.left;
                                        const offsetY = e.clientY - rect.top;
                                        setDragOffset({ x: offsetX, y: offsetY });
                                    }
                                }
                            }}
                        >
                            {ann.text}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};
