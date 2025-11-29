import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { DashboardStats, Activity, ChartDataPoint } from '../types';
import { jobsApi } from '@/services/jobs.service';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  // Memoize data to prevent regeneration on re-renders
  const stats: DashboardStats = useMemo(() => ({
    totalCVs: 1247,
    totalSearches: 143,
    highMatches: 856,
    successRate: 68.7,
    processing: 23,
  }), []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await jobsApi.getActivities(0, 5); // Fetch top 5 recent activities

        const mappedActivities: Activity[] = data.map((item: any) => ({
          id: item.id,
          type: item.activity_type.toLowerCase().includes('job') ? 'upload' :
            item.activity_type.toLowerCase().includes('cv') ? 'upload' : 'complete',
          description: item.description,
          timestamp: new Date(item.created_at),
          status: 'completed',
        }));

        setRecentActivities(mappedActivities);
      } catch (error) {
        console.error("Failed to fetch dashboard activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
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