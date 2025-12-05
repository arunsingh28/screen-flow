import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useCVWebSocket = () => {
    const { user, token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    }, []);

    useEffect(() => {
        if (!user?.id) {
            addLog("Waiting for user ID...");
            return;
        }
        if (!token) {
            addLog("Waiting for token...");
            return;
        }

        // Determine WS URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        // Replace http/https with ws/wss
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const wsBase = apiUrl.replace(/^https?/, wsProtocol);
        const wsUrl = `${wsBase}/cv-processing/ws/${user.id}?token=${token}`;

        console.log('[WS] Attempting connection to:', wsUrl); // Debug to browser console
        addLog(`Connecting to ${wsUrl.split('?')[0]}...`); // Don't log token in UI

        try {
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log('[WS] Connected');
                setIsConnected(true);
                addLog('Connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                    addLog(`Received: ${event.data.substring(0, 50)}...`);
                } catch (e) {
                    addLog(`Received raw: ${event.data}`);
                }
            };

            ws.onclose = (event) => {
                console.log('[WS] Disconnected:', event.code, event.reason);
                setIsConnected(false);
                addLog(`Disconnected: ${event.code} ${event.reason || 'No reason'}`);
            };

            ws.onerror = (error) => {
                console.error('[WS] Error:', error);
                addLog('Connection Error (Check console)');
            };

            return () => {
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            };
        } catch (err) {
            console.error('[WS] Setup Error:', err);
            addLog(`Setup Error: ${err}`);
        }
    }, [user?.id, token, addLog]);

    return { isConnected, lastMessage, logs };
};
