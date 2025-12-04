import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
    url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Reset states when URL changes
        setLoading(true);
        setError(false);

        // Set a timeout to hide loading after a reasonable time
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [url]);

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <AlertCircle className="h-12 w-12 opacity-20" />
                <p className="text-sm">No PDF URL provided</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full relative bg-slate-100 dark:bg-slate-900">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                    <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 gap-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <p className="text-sm text-destructive">Failed to load PDF</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, '_blank')}
                        className="gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Open in New Tab
                    </Button>
                </div>
            )}

            {/* Use object tag which is more reliable for PDFs */}
            <object
                data={url}
                type="application/pdf"
                className="w-full h-full"
                onError={handleError}
                onLoad={() => setLoading(false)}
            >
                {/* Fallback: embed tag */}
                <embed
                    src={url}
                    type="application/pdf"
                    className="w-full h-full"
                    onError={handleError}
                />
                {/* Final fallback */}
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                        Your browser cannot display this PDF. Please download it to view.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(url, '_blank')}
                        className="gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Open PDF in New Tab
                    </Button>
                </div>
            </object>
        </div>
    );
};

export default PDFViewer;
