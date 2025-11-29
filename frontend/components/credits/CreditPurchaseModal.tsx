import React, { useState } from 'react';
import { X, Coins, Check, Sparkles, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCredits } from '@/contexts/CreditContext';
import { cn } from '@/lib/utils';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  popular?: boolean;
  bonus?: number;
  icon: React.ReactNode;
  features: string[];
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose
}) => {
  const { addCredits, credits } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const packages: CreditPackage[] = [
    {
      id: 'starter',
      credits: 25,
      price: 9.99,
      icon: <Coins className="h-6 w-6" />,
      features: ['25 CV Scans', 'Basic Support', 'Valid for 30 days']
    },
    {
      id: 'professional',
      credits: 50,
      price: 19.99,
      bonus: 5,
      popular: true,
      icon: <Zap className="h-6 w-6" />,
      features: ['50 CV Scans', '+5 Bonus Credits', 'Priority Support', 'Valid for 60 days']
    },
    {
      id: 'enterprise',
      credits: 100,
      price: 34.99,
      bonus: 15,
      icon: <Crown className="h-6 w-6" />,
      features: ['100 CV Scans', '+15 Bonus Credits', 'Premium Support', 'Valid for 90 days', 'Early Access Features']
    }
  ];

  const handlePurchase = async (pkg: CreditPackage) => {
    // Simulate purchase
    const totalCredits = pkg.credits + (pkg.bonus || 0);
    try {
      await addCredits(totalCredits, `Purchase: ${pkg.id} package`);
      setSelectedPackage(pkg.id);

      // Show success and close after delay
      setTimeout(() => {
        onClose();
        setSelectedPackage(null);
      }, 1500);
    } catch (error) {
      console.error("Purchase failed", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-4 animate-in zoom-in-95 duration-200">
        <Card className="p-6 bg-background shadow-xl border-border">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Buy Credits</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Current Balance: <span className="font-semibold text-primary">{credits} credits</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-lg border-2 transition-all duration-200 hover:shadow-lg bg-card",
                  pkg.popular
                    ? "border-primary shadow-md ring-1 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                    pkg.popular
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {pkg.icon}
                  </div>

                  {/* Credits */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{pkg.credits}</span>
                      {pkg.bonus && (
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          +{pkg.bonus} bonus
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Credits</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-3xl font-bold">${pkg.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">USD</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Purchase Button */}
                  <Button
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handlePurchase(pkg)}
                    disabled={selectedPackage !== null}
                  >
                    {selectedPackage === pkg.id ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Purchased!
                      </>
                    ) : (
                      'Purchase'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Credits are added instantly to your account. Each CV scan costs 1 credit.
              Unused credits never expire.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};