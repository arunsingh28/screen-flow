import { Card } from '@/components/ui/card';

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Platform analytics and insights
                </p>
            </div>
            <Card className="p-6">
                <p className="text-center text-gray-500">Analytics dashboard coming soon...</p>
            </Card>
        </div>
    );
}
