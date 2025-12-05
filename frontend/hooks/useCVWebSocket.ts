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
        if (!user?.id || !token) return;

        // Determine WS URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        // Replace http/https with ws/wss
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const wsBase = apiUrl.replace(/^https?/, wsProtocol);
        const wsUrl = `${wsBase}/cv-processing/ws/${user.id}?token=${token}`;

        addLog(`Connecting to ${wsUrl}...`);

        try {
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                addLog('Connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                    addLog(`Received: ${event.data.substring(0, 100)}${event.data.length > 100 ? '...' : ''}`);
                } catch (e) {
                    addLog(`Received raw: ${event.data}`);
                }
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                addLog(`Disconnected: ${event.code} ${event.reason}`);
                // Simple reconnect logic could be added here
            };

            ws.onerror = (error) => {
                console.error('WS Error:', error);
                addLog('Connection Error');
            };

            return () => {
                if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                    ws.close();
                }
            };
        } catch (err) {
            addLog(`Setup Error: ${err}`);
        }
    }, [user?.id, token, addLog]);

    return { isConnected, lastMessage, logs };
};
