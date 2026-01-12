import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFViewer } from '../components/PDFViewer';
import { Annotation } from '../types';
import { exportPdf } from '../utils/pdfExport';
import { MousePointer2, Type, Pen, Download, Save, ArrowLeft, Loader2, Undo, Redo, Palette } from 'lucide-react';
import { getDraft, saveDraft } from '../api/drafts';
import { getTemplateFileUrl } from '../api/templates';
import apiClient from '../api/client'; // Need to fetch blob with auth

export default function EditorPage() {
    const { draftId } = useParams<{ draftId: string }>();
    const navigate = useNavigate();

    const [file, setFile] = useState<File | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [mode, setMode] = useState<'none' | 'text' | 'ink'>('none');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [templateId, setTemplateId] = useState<string | null>(null);

    // Style State
    const [fontSize, setFontSize] = useState(12);
    const [color, setColor] = useState('#ff0000'); // Default red used in your example

    // Undo/Redo State
    const [history, setHistory] = useState<Annotation[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Helper to push state to history
    const addToHistory = (newAnnotations: Annotation[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAnnotations);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setAnnotations(newAnnotations);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setAnnotations(history[prevIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setAnnotations(history[nextIndex]);
        }
    };

    // Load Draft Data
    useEffect(() => {
        if (!draftId) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Draft Details
                const draft = await getDraft(draftId);
                setTemplateId(draft.templateId);
                const initialAnnotations = draft.annotations || [];
                setAnnotations(initialAnnotations);
                // Initialize history
                setHistory([initialAnnotations]);
                setHistoryIndex(0);

                // 2. Fetch PDF File (using blob to handle auth if needed or just public url)
                // For secure templates, we need to fetch blob with auth header
                const pdfUrl = getTemplateFileUrl(draft.templateId);
                const response = await apiClient.get(pdfUrl, { responseType: 'blob' });
                const pdfBlob = response.data;
                const pdfFile = new File([pdfBlob], "document.pdf", { type: 'application/pdf' });
                setFile(pdfFile);

            } catch (error) {
                console.error("Failed to load draft", error);
                alert("Failed to load draft. Please try again.");
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [draftId, navigate]);

    const handleSave = async () => {
        if (!draftId) return;
        setIsSaving(true);
        try {
            await saveDraft(draftId, {
                annotations: annotations,
                // We could save ink as image here if needed, but for now we rely on JSON lines
            });
            // Show toast or slight indication?
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        if (!file) return;
        try {
            const pdfBytes = await file.arrayBuffer();
            const exportedPdf = await exportPdf(pdfBytes, annotations);

            const blob = new Blob([exportedPdf as unknown as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `exported-draft-${draftId}.pdf`;
            link.click();
        } catch (err) {
            console.error('Export failed', err);
            alert('Export failed.');
        }
    };

    const handleBack = () => {
        // Auto-save on exit? Maybe later.
        navigate('/');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <Loader2 className="animate-spin mr-2" />
                Loading Editor...
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Toolbar */}
            <div className="bg-gray-800 p-4 shadow-md flex items-center justify-between z-20 relative border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    <button onClick={handleBack} className="text-gray-400 hover:text-white transition">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-white font-bold text-lg hidden md:block">Editor</h1>

                    <div className="h-6 w-px bg-gray-600 mx-2"></div>

                    {/* Mode Toggles */}
                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setMode('none')}
                            className={`p-2 rounded ${mode === 'none' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                            title="Browse / Drag"
                        >
                            <MousePointer2 size={20} />
                        </button>
                        <button
                            onClick={() => setMode('text')}
                            className={`p-2 rounded ${mode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                            title="Add Text"
                        >
                            <Type size={20} />
                        </button>
                        <button
                            onClick={() => setMode('ink')}
                            className={`p-2 rounded ${mode === 'ink' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                            title="Draw Ink"
                        >
                            <Pen size={20} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-600 mx-2"></div>

                    {/* History Controls */}
                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-gray-300 hover:text-white disabled:opacity-30">
                            <Undo size={20} />
                        </button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-300 hover:text-white disabled:opacity-30">
                            <Redo size={20} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-600 mx-2"></div>

                    {/* Style Controls */}
                    <div className="flex items-center space-x-2">
                        <div className="bg-gray-700 rounded-lg px-2 py-1 flex items-center space-x-2">
                            <span className="text-xs text-gray-400">Size</span>
                            <input
                                type="number"
                                min="6"
                                max="72"
                                value={fontSize}
                                onChange={(e) => setFontSize(Number(e.target.value))}
                                className="w-12 bg-gray-600 text-white rounded px-1 text-sm border-none outline-none"
                            />
                        </div>
                        <div className="bg-gray-700 rounded-lg p-1 flex items-center relative">
                            <Palette size={20} className="text-gray-300 ml-1" />
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-8 h-8 opacity-0 absolute cursor-pointer"
                            />
                            <div className="w-6 h-6 rounded-full border border-gray-500 ml-2 shadow-sm" style={{ backgroundColor: color }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2 transition disabled:opacity-50"
                        title="Save to Cloud"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>Save</span>
                    </button>

                    <button onClick={handleExport} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2 transition">
                        <Download size={18} />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-900 relative">
                <PDFViewer
                    file={file}
                    mode={mode}
                    annotations={annotations}
                    onUpdateAnnotation={(id, patch) => {
                        const newAnns = annotations.map(a => a.id === id ? { ...a, ...patch } : a);
                        addToHistory(newAnns);
                    }}
                    onAddAnnotation={(ann) => {
                        const newAnns = [...annotations, ann];
                        addToHistory(newAnns);
                    }}
                    currentFontSize={fontSize}
                    currentColor={color}
                />
            </div>
        </div>
    );
}
