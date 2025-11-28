import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { DashboardStats, Activity, ChartDataPoint } from '../types';

export const useDashboardData = () => {
  const [loading] = useState(false); // In a real app, this would toggle based on API calls

  // Memoize data to prevent regeneration on re-renders
  const stats: DashboardStats = useMemo(() => ({
    totalCVs: 1247,
    totalSearches: 143,
    highMatches: 856,
    successRate: 68.7,
    processing: 23,
  }), []);

  const recentActivities: Activity[] = useMemo(() => [
    {
      id: '1',
      type: 'upload',
      description: 'Uploaded 45 CVs in batch "Engineering Q1 2024"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'completed',
    },
    {
      id: '2',
      type: 'search',
      description: 'Searched for "Senior React Developer"',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      status: 'completed',
    },
    {
      id: '3',
      type: 'upload',
      description: 'Uploaded 23 CVs in batch "Design Team"',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'processing',
    },
    {
      id: '4',
      type: 'search',
      description: 'Searched for "Product Manager with AI experience"',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'completed',
    },
    {
      id: '5',
      type: 'delete',
      description: 'Deleted 3 CVs from library',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'completed',
    },
  ], []);

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