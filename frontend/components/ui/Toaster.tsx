import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster = () => {
    return (
        <HotToaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
                // Define default options
                className: '',
                duration: 4000,
                style: {
                    background: '#363636',
                    color: '#fff',
                },

                // Default options for specific types
                success: {
                    duration: 3000,
                    style: {
                        background: '#10B981', // Emerald 500
                        color: '#fff',
                        border: '1px solid #059669',
                        padding: '16px',
                        borderRadius: '8px',
                        fontWeight: 500,
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#10B981',
                    },
                },
                error: {
                    duration: 4000,
                    style: {
                        background: '#EF4444', // Red 500
                        color: '#fff',
                        border: '1px solid #DC2626',
                        padding: '16px',
                        borderRadius: '8px',
                        fontWeight: 500,
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#EF4444',
                    },
                },
                loading: {
                    style: {
                        background: '#3B82F6', // Blue 500
                        color: '#fff',
                        border: '1px solid #2563EB',
                        padding: '16px',
                        borderRadius: '8px',
                        fontWeight: 500,
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#3B82F6',
                    }
                }
            }}
        />
    );
};
