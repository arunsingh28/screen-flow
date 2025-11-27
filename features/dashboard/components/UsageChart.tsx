import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { ChartDataPoint } from '../../../types';

interface UsageChartProps {
  data: ChartDataPoint[];
}

const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
  return (
    <Card className="w-full dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Performance metrics for the last 30 days</CardDescription>
        </div>
        <select 
          className="text-sm border rounded-md px-2 py-1 bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          defaultValue="30"
          aria-label="Select time range"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--card-foreground))" 
                }}
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }} 
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="uploads"
                name="CV Uploads"
                stroke="#3b82f6" // blue-500
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="searches"
                name="Searches Performed"
                stroke="#a855f7" // purple-500
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageChart;