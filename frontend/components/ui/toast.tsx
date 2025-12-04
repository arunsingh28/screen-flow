import toast, { Toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastOptions {
    description?: string;
    duration?: number;
}

const ToastCard = ({
    t,
    title,
    description,
    type,
}: {
    t: Toast;
    title: string;
    description?: string;
    type: 'success' | 'error' | 'loading' | 'info';
}) => {
    const icons = {
        success: <CheckCircle className="h-6 w-6 text-emerald-500" />,
        error: <XCircle className="h-6 w-6 text-red-500" />,
        loading: <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />,
        info: <Info className="h-6 w-6 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
        error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
        loading: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
        info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    };

    return (
        <div
            className={cn(
                'max-w-md w-full shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5',
                bgColors[type],
                t.visible ? 'animate-enter' : 'animate-leave'
            )}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">{icons[type]}</div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                        {description && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

const customToast = {
    success: (title: string, options?: ToastOptions) =>
        toast.custom(
            (t) => <ToastCard t={t} title={title} description={options?.description} type="success" />,
            { duration: options?.duration || 4000 }
        ),
    error: (title: string, options?: ToastOptions) =>
        toast.custom(
            (t) => <ToastCard t={t} title={title} description={options?.description} type="error" />,
            { duration: options?.duration || 5000 }
        ),
    loading: (title: string, options?: ToastOptions) =>
        toast.custom(
            (t) => <ToastCard t={t} title={title} description={options?.description} type="loading" />,
            { duration: options?.duration || 100000 } // Long duration for loading, usually manually dismissed
        ),
    info: (title: string, options?: ToastOptions) =>
        toast.custom(
            (t) => <ToastCard t={t} title={title} description={options?.description} type="info" />,
            { duration: options?.duration || 4000 }
        ),
    dismiss: toast.dismiss,
};

export { customToast as toast };
