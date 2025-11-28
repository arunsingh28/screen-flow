import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface ComingSoonProps {
  pageName: string;
  onReturnHome: () => void;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ pageName, onReturnHome }) => {
  return (
    <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center">
        <Construction className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Coming Soon</h1>
        <p className="text-muted-foreground max-w-[600px] text-lg">
          The <span className="font-semibold text-foreground">{pageName}</span> page is currently under construction. 
          We are working hard to bring this feature to you soon.
        </p>
      </div>
      <Button onClick={onReturnHome} size="lg" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Button>
    </div>
  );
};

export default ComingSoon;