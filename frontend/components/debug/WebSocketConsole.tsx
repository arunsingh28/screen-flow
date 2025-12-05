import React, { useState } from 'react';
import { useCVWebSocket } from '@/hooks/useCVWebSocket';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WebSocketConsole = () => {
    const { isConnected, logs } = useCVWebSocket();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-50 flex flex-col bg-background border rounded-md shadow-lg transition-all w-[400px]",
            isOpen ? "h-96" : "h-12"
        )}>
            <div
                className="flex items-center justify-between p-3 cursor-pointer bg-muted/50 rounded-t-md hover:bg-muted/70"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span className="text-sm font-medium">WebSocket Monitor</span>
                    <span className={cn(
                        "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border",
                        isConnected
                            ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                            : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    )}>
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-transparent">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
            </div>

            {isOpen && (
                <div className="flex-1 overflow-auto p-3 text-xs font-mono bg-zinc-950 text-green-400 rounded-b-md space-y-1">
                    {logs.length === 0 && <div className="text-gray-500 italic">Waiting for connection logs...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className="break-all border-b border-zinc-900 pb-1 mb-1 last:border-0 font-light">
                            {log}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
