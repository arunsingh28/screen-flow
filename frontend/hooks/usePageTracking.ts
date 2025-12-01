import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '@/lib/axios';

export function usePageTracking() {
    const location = useLocation();
    const startTimeRef = useRef<number>(Date.now());
    const currentPathRef = useRef<string>(location.pathname);

    useEffect(() => {
        // When location changes, record the PREVIOUS page visit
        const endTime = Date.now();
        const duration = (endTime - startTimeRef.current) / 1000; // seconds
        const previousPath = currentPathRef.current;

        // Don't record very short visits or initial load if 0
        // Also exclude admin pages from tracking
        if (duration > 1 && !previousPath.startsWith('/admin')) {
            axiosInstance.post('/analytics/page-visit', {
                path: previousPath,
                duration_seconds: duration
            }).catch(err => console.error('Failed to record page visit', err));
        }

        // Reset for new page
        startTimeRef.current = Date.now();
        currentPathRef.current = location.pathname;

        // Handle unmount/window close to record the last page
        const handleUnload = () => {
            const finalDuration = (Date.now() - startTimeRef.current) / 1000;
            if (finalDuration > 1) {
                // Use navigator.sendBeacon for reliability on unload if possible, 
                // but for now simple fetch/axios might be enough or ignored.
                // React unmounts are tricky with async, but we'll try best effort.
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [location.pathname]);
}
