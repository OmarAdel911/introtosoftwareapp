import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: number;
  text?: string;
}

export function Loading({ className, size = 24, text }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <Loader2 className="animate-spin" size={size} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading size={32} text="Loading..." />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
      <Loading size={24} text="Loading..." />
    </div>
  );
} 