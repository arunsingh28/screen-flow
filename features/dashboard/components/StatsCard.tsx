
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  colorClass?: string;
  trend?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  colorClass,
  trend,
  className
}) => {
  return (
    <Card className={cn("overflow-hidden border border-border hover:shadow-md transition-all duration-200", className)}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
             <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
             <div className="text-2xl font-bold tracking-tight">{value}</div>
          </div>
          <div className={cn("p-2 rounded-md", colorClass || "bg-primary/10 text-primary")}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        
        {(subtitle || trend) && (
          <div className="mt-3 flex items-center text-xs">
            {trend === 'up' && <span className="text-green-600 font-medium flex items-center mr-2">↑ 12%</span>}
            <span className="text-muted-foreground">{subtitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
