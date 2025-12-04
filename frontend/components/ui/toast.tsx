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
        success: 'bg-white dark:bg-slate-950 border-emerald-500 dark:border-emerald-500 border',
        error: 'bg-white dark:bg-slate-950 border-red-500 dark:border-red-500 border',
        loading: 'bg-white dark:bg-slate-950 border-blue-500 dark:border-blue-500 border',
        info: 'bg-white dark:bg-slate-950 border-blue-500 dark:border-blue-500 border',
    };

    return (
        <div
            className={cn(
                'max-w-md w-full shadow-lg rounded-lg pointer-events-auto flex',
                bgColors[type],
                t.visible ? 'animate-enter' : 'animate-leave'
            )}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">{icons[type]}</div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                        {description && (
                            <p className=" text-sm text-gray-600 dark:text-gray-300">{description}</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
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
