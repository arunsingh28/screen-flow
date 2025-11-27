
import React from 'react';
import { Upload, Search, FolderOpen, ArrowRight, PlusCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

interface QuickActionsProps {
  onNavigate: (view: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      id: 'create-job',
      label: 'Upload CVs',
      desc: 'Create job & analyze',
      icon: Upload,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'search',
      label: 'AI Search',
      desc: 'Find candidates',
      icon: Search,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: 'library',
      label: 'CV Library',
      desc: 'Browse database',
      icon: FolderOpen,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onNavigate(action.id)}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-md flex items-center justify-center transition-transform group-hover:scale-105", action.bg, action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{action.label}</div>
                <div className="text-xs text-muted-foreground">{action.desc}</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
