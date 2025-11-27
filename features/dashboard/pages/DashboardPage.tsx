
import React, { useState } from 'react';
import {
  FileText,
  Search,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import StatsCard from '../components/StatsCard';
import RecentActivityList from '../components/RecentActivityList';
import UsageChart from '../components/UsageChart';
import ActiveJobsWidget from '../components/ActiveJobsWidget';
import { CreditPurchaseModal } from '@/components/credits/CreditPurchaseModal';

const DashboardPage: React.FC = () => {
  const { stats, recentActivities, chartData } = useDashboardData();
  const [showCreditModal, setShowCreditModal] = useState(false);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500">
      
      {/* Top Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatsCard
          title="Total CVs"
          value={stats.totalCVs.toLocaleString()}
          icon={FileText}
          subtitle="+12% this month"
          trend="up"
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatsCard
          title="Searches"
          value={stats.totalSearches}
          icon={Search}
          subtitle="Avg 5/day"
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatsCard
          title="High Match"
          value={stats.highMatches}
          icon={TrendingUp}
          subtitle={`${stats.successRate}% rate`}
          trend="up"
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatsCard
          title="Processing"
          value={stats.processing}
          icon={Clock}
          subtitle="~5m remaining"
          colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
      </div>

      {/* Main Content Grid: 3 Columns (2 for Data, 1 for Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Data Visualization & Lists) - Spans 2 columns on Large screens */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Active Jobs Widget - Prioritized First */}
          <div className="min-h-[300px]">
            <ActiveJobsWidget />
          </div>

          {/* Usage Chart */}
          <div className="min-h-[350px]">
            <UsageChart data={chartData} />
          </div>
        </div>

        {/* Right Column (Sidebar: Credits & Activity Feed) - Spans 1 column */}
        <div className="lg:col-span-1 space-y-6">
          <RecentActivityList activities={recentActivities} />

        </div>

      </div>
      
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>&copy; 2024 ScreenFlow AI. Dashboard v1.3</p>
      </footer>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />
    </main>
  );
};

export default DashboardPage;
