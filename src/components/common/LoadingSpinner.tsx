import React from 'react';
import { RotateCcw } from 'lucide-react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <RotateCcw className={clsx(
        'animate-spin text-blue-600',
        sizeClasses[size]
      )} />
    </div>
  );
};

export default LoadingSpinner;