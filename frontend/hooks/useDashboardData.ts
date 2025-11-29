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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats and activities in parallel
        const [statsData, activitiesData] = await Promise.all([
          jobsApi.getDashboardStats(),
          jobsApi.getActivities(0, 5)
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
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData: ChartDataPoint[] = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: format(date, 'MMM dd'),
        uploads: Math.floor(Math.random() * 50) + 10, // Random 10-60
        searches: Math.floor(Math.random() * 20) + 5, // Random 5-25
      };
    }), []);

  return {
    loading,
    stats,
    recentActivities,
    chartData,
  };
};