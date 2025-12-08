import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
    );
}

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Đang tải...' }: LoadingScreenProps) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}
