import React, { useState } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
    url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div className="flex flex-col h-full w-full relative">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
                    <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Loading document...</p>
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

            <iframe
                src={url}
                className="w-full h-full border-0"
                title="PDF Viewer"
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
};

export default PDFViewer;
