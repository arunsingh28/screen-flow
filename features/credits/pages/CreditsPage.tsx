import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  ArrowLeft,
  TrendingUp,
  Download,
  History,
  Sparkles,
  CreditCard,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { CreditPurchaseModal } from '@/components/credits/CreditPurchaseModal';
import { useCredits } from '@/contexts/CreditContext';
import { ROUTES } from '@/config/routes.constants';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'purchase' | 'usage';
  amount: number;
  description: string;
  date: Date;
  balance: number;
}

const CreditsPage: React.FC = () => {
  const { credits, maxCredits } = useCredits();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Dummy transaction history
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'purchase',
      amount: 50,
      description: 'Professional Package (+5 bonus)',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      balance: 100
    },
    {
      id: '2',
      type: 'usage',
      amount: -1,
      description: 'CV Scan - Sarah Connor',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      balance: 99
    },
    {
      id: '3',
      type: 'usage',
      amount: -1,
      description: 'CV Scan - John Smith',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      balance: 98
    },
    {
      id: '4',
      type: 'usage',
      amount: -1,
      description: 'CV Scan - Emily Chen',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      balance: 97
    },
    {
      id: '5',
      type: 'purchase',
      amount: 25,
      description: 'Starter Package',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      balance: 50
    },
  ];

  const percentage = (credits / maxCredits) * 100;

  const getCreditStatus = () => {
    if (percentage >= 70) return { text: 'Healthy', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (percentage >= 30) return { text: 'Low', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const status = getCreditStatus();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credits</h1>
            <p className="text-muted-foreground">Manage your credit balance and view history</p>
          </div>
        </div>
      </div>

      {/* Credit Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <Card className="lg:col-span-2 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Current Balance
            </CardTitle>
            <CardDescription>Your available credits for CV scanning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Circular Progress */}
              <div className="flex-shrink-0">
                <CircularProgress value={credits} max={maxCredits} size={200} strokeWidth={16} />
              </div>

              {/* Stats */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Credits</p>
                    <p className="text-3xl font-bold">{credits}</p>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-sm font-medium", status.bg, status.color)}>
                    {status.text}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Capacity</p>
                    <p className="text-2xl font-bold">{maxCredits}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Remaining Scans</p>
                    <p className="text-2xl font-bold text-primary">{credits}</p>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => setShowPurchaseModal(true)}
                >
                  <Sparkles className="h-5 w-5" />
                  Top Up Credits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base">Usage Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-2xl font-bold">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last 7 Days</span>
                <span className="text-xl font-semibold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-xl font-semibold">3</span>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-base">Credit Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">1 credit = 1 CV scan</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Credits never expire</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Bonus credits included in packages</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
          <Card className="dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>View your credit purchases and usage</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    transaction.type === 'purchase'
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                  )}>
                    {transaction.type === 'purchase' ? (
                      <CreditCard className="h-5 w-5" />
                    ) : (
                      <TrendingUp className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {transaction.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-bold",
                    transaction.type === 'purchase' ? "text-green-600" : "text-blue-600"
                  )}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Balance: {transaction.balance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
      />
    </div>
  );
};

export default CreditsPage;
