import { Card } from '@/components/ui/card';

export default function AdminSessionsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Sessions</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Monitor user sessions
                </p>
            </div>
            <Card className="p-6">
                <p className="text-center text-gray-500">Session tracking coming soon...</p>
            </Card>
        </div>
    );
}
