import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="h-24 w-24 bg-destructive/10 rounded-full flex items-center justify-center text-destructive animate-in zoom-in duration-300">
                                <AlertTriangle className="h-12 w-12" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                            <p className="text-muted-foreground">
                                We encountered an unexpected error. Our team has been notified.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="p-4 bg-muted/50 rounded-lg text-left overflow-auto max-h-48 text-xs font-mono border">
                                <p className="font-semibold text-destructive mb-2">{this.state.error.toString()}</p>
                                <pre className="whitespace-pre-wrap text-muted-foreground">
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                            <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                            <Button onClick={this.handleReload} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
