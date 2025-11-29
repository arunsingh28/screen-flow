import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Initialize worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
    url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch the PDF first to handle potential CORS/redirect issues better than PDF.js worker
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();

                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const doc = await loadingTask.promise;
                setPdfDoc(doc);
                setNumPages(doc.numPages);
                setPageNum(1);
            } catch (err) {
                console.error("Error loading PDF:", err);
                setError("Failed to load PDF document.");
            } finally {
                setLoading(false);
            }
        };

        if (url) {
            loadPdf();
        }
    }, [url]);

    useEffect(() => {
        const renderPage = async () => {
            if (!pdfDoc || !canvasRef.current) return;

            try {
                // Cancel previous render if any
                if (renderTaskRef.current) {
                    renderTaskRef.current.cancel();
                }

                const page = await pdfDoc.getPage(pageNum);
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (!context) return;

                // Calculate scale to fit width
                const containerWidth = canvas.parentElement?.clientWidth || 600;
                const viewport = page.getViewport({ scale: 1.0 });
                const scale = (containerWidth - 32) / viewport.width; // -32 for padding
                const scaledViewport = page.getViewport({ scale });

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport,
                };

                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;

                await renderTask.promise;
            } catch (err: any) {
                if (err.name !== 'RenderingCancelledException') {
                    console.error("Error rendering page:", err);
                }
            }
        };

        renderPage();
    }, [pdfDoc, pageNum]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading document...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-4 flex justify-center">
                <canvas ref={canvasRef} className="shadow-lg bg-white" />
            </div>

            {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 p-2 bg-background border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNum(prev => Math.max(prev - 1, 1))}
                        disabled={pageNum <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {pageNum} of {numPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNum(prev => Math.min(prev + 1, numPages))}
                        disabled={pageNum >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PDFViewer;
