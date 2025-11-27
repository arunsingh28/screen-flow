import React, { useState } from 'react';
import { Coins, Plus, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useCredits } from '@/contexts/CreditContext';
import { cn } from '@/lib/utils';

interface CreditWidgetProps {
  compact?: boolean;
  showPurchaseButton?: boolean;
  onPurchaseClick?: () => void;
}

export const CreditWidget: React.FC<CreditWidgetProps> = ({
  compact = false,
  showPurchaseButton = true,
  onPurchaseClick
}) => {
  const { credits, maxCredits } = useCredits();
  const percentage = (credits / maxCredits) * 100;

  const getCreditStatus = () => {
    if (percentage >= 70) return { text: 'Healthy', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (percentage >= 30) return { text: 'Low', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const status = getCreditStatus();

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={onPurchaseClick}
      >
        <div className="relative">
          <CircularProgress value={credits} max={maxCredits} size={48} strokeWidth={4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-semibold truncate">Credits</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-xs font-medium", status.color)}>
              {credits} / {maxCredits}
            </span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", status.bg, status.color)}>
              {status.text}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Credit Balance
            </CardTitle>
            <CardDescription>CV scan credits available</CardDescription>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-medium", status.bg, status.color)}>
            {status.text}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress */}
        <div className="flex justify-center">
          <CircularProgress value={credits} max={maxCredits} size={160} strokeWidth={12} />
        </div>

        {/* Credit Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Available Credits</span>
            <span className="text-lg font-bold">{credits}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Cost per CV Scan</span>
            <span className="text-sm font-semibold">1 Credit</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Remaining Scans</span>
            <span className="text-lg font-bold text-primary">{credits}</span>
          </div>
        </div>

        {/* Purchase Button */}
        {showPurchaseButton && (
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={onPurchaseClick}
          >
            <Plus className="h-5 w-5" />
            Buy More Credits
          </Button>
        )}

        {/* Usage Tips */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Quick Tips:</p>
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              <span>Each CV scan uses 1 credit</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              <span>Buy credits in bulk to save more</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
