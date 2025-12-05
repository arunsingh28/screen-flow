
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axiosInstance from '@/lib/axios';
import { AdminDataTable, Column } from '../components/AdminDataTable';

interface LLMCallData {
    id: string;
    created_at: string;
    user_email: string;
    call_type: string;
    model_name: string;
    provider: string;
    total_tokens: number;
    total_cost: number;
    latency_ms: number;
    success: boolean;
    error_message?: string;
    context_type?: string;
    context_name?: string;
    context_id?: string;
    context_content?: any;
}

export default function LLMUsagePage() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedCall, setSelectedCall] = useState<LLMCallData | null>(null);

    // Fetch LLM usage data
    const { data, isLoading } = useQuery<{ total: number; items: LLMCallData[]; total_cost: number; total_tokens: number }>({
        queryKey: ['admin-llm-usage', page, search],
        queryFn: async () => {
            const response = await axiosInstance.get('/admin/llm-usage', {
                params: {
                    skip: page * 50,
                    limit: 50,
                    search: search || undefined
                }
            });
            return response.data;
        },
    });

    const formatCost = (cost: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4
        }).format(cost);
    };

    const renderContent = (content: any) => {
        if (typeof content === 'string') return <pre className="whitespace-pre-wrap text-sm">{content}</pre>;
        return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(content, null, 2)}</pre>;
    };

    const columns: Column<LLMCallData>[] = [
        {
            header: 'Date',
            cell: (item) => <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</span>
        },
        {
            header: 'User',
            accessorKey: 'user_email',
            className: 'text-sm font-medium text-gray-900 dark:text-white'
        },
        {
            header: 'Type',
            accessorKey: 'call_type',
            className: 'text-sm text-gray-500'
        },
        {
            header: 'Model',
            cell: (item) => (
                <div className="text-sm text-gray-500">
                    {item.model_name}
                    <span className="ml-1 text-xs text-gray-400">({item.provider})</span>
                </div>
            )
        },
        {
            header: 'Tokens',
            cell: (item) => <span className="text-sm text-gray-500 font-mono">{item.total_tokens.toLocaleString()}</span>
        },
        {
            header: 'Cost',
            cell: (item) => <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{formatCost(item.total_cost)}</span>
        },
        {
            header: 'Context',
            cell: (item) => item.context_content ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCall(item)}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 h-8 px-2"
                >
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[120px] text-xs">{item.context_name || 'View Content'}</span>
                </Button>
            ) : <span className="text-gray-400 text-sm">-</span>
        },
        {
            header: 'Status',
            cell: (item) => (
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${item.success
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800'
                        }`}
                >
                    {item.success ? 'Success' : 'Failed'}
                </span>
            )
        }
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LLM Usage & Costs</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Track AI model consumption and costs
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {data ? formatCost(data.total_cost) : '...'}
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tokens</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {data?.total_tokens ? data.total_tokens.toLocaleString() : '...'}
                    </div>
                </Card>
            </div>

            {/* Reusable Data Table */}
            <AdminDataTable
                title="Transaction History"
                columns={columns}
                data={data?.items || []}
                total={data?.total || 0}
                page={page}
                isLoading={isLoading}
                onPageChange={setPage}
                onSearch={(term) => {
                    setSearch(term);
                    setPage(0); // Reset to first page on search
                }}
                searchPlaceholder="Search calls..."
            />

            {/* Detail Modal */}
            <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCall?.context_type}: {selectedCall?.context_name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <div className="text-xs text-gray-500">Model</div>
                                <div className="font-medium">{selectedCall?.model_name}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Tokens</div>
                                <div className="font-medium">{selectedCall?.total_tokens}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Cost</div>
                                <div className="font-medium">{selectedCall && formatCost(selectedCall.total_cost)}</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium mb-2">Content</h3>
                            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto">
                                {selectedCall && renderContent(selectedCall.context_content)}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
