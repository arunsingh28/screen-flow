import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { DashboardStats, Activity, ChartDataPoint } from '../types';
import { jobsApi } from '@/services/jobs.service';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    totalCVs: 0,
    totalSearches: 0,
    highMatches: 0,
    successRate: 0,
    processing: 0,
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats, activities, and history in parallel
        const [statsData, activitiesData, historyData] = await Promise.all([
          jobsApi.getDashboardStats(),
          jobsApi.getActivities(0, 5),
          jobsApi.getStatsHistory(30)
        ]);

        // Map stats (backend snake_case to frontend camelCase)
        setStats({
          totalCVs: statsData.total_cvs,
          totalSearches: statsData.total_searches,
          highMatches: statsData.high_matches,
          successRate: statsData.success_rate,
          processing: statsData.processing,
        });

        // Map activities
        const mappedActivities: Activity[] = activitiesData.map((item: any) => ({
          id: item.id,
          type: item.activity_type.toLowerCase().includes('job') ? 'upload' :
            item.activity_type.toLowerCase().includes('cv') ? 'upload' : 'complete',
          description: item.description,
          timestamp: new Date(item.created_at),
          status: 'completed',
        }));

        setRecentActivities(mappedActivities);

        // Map history to chart data
        const mappedChartData: ChartDataPoint[] = historyData.history.map((item: any) => ({
          date: format(new Date(item.date), 'MMM dd'),
          uploads: item.uploads,
          searches: item.searches,
        }));
        setChartData(mappedChartData);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    loading,
    stats,
    recentActivities,
    chartData,
  };
};