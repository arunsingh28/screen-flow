
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Fallback debounce if hook doesn't exist
function useDebounceValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
}

interface AdminDataTableProps<T> {
    title: string;
    columns: Column<T>[];
    data: T[];
    total: number;
    page: number;
    pageSize?: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onSearch: (term: string) => void;
    searchPlaceholder?: string;
}

export function AdminDataTable<T extends { id: string | number }>({
    title,
    columns,
    data,
    total,
    page,
    pageSize = 50,
    isLoading,
    onPageChange,
    onSearch,
    searchPlaceholder = "Search..."
}: AdminDataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounceValue(searchTerm, 500);

    useEffect(() => {
        onSearch(debouncedSearch);
    }, [debouncedSearch]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <Card className="flex flex-col flex-1 h-[calc(100vh-280px)] overflow-hidden">
            <div className="p-6 pb-2 flex-shrink-0 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {title} {total ? `(${total})` : ''}
                </h2>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full relative">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10 shadow-sm">
                        <tr className="border-b dark:border-gray-800">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-20 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-10 text-center text-gray-500">
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={`py-3 px-4 ${col.className || ''}`}>
                                            {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey]) : '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex items-center justify-between flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="text-sm text-gray-500">
                    Page {page + 1} of {Math.max(1, totalPages)}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 0 || isLoading}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page + 1 >= totalPages || isLoading}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </Card>
    );
}
