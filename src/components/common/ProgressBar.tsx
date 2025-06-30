import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500'
  };

  const backgroundClasses = {
    blue: 'bg-blue-100',
    green: 'bg-emerald-100',
    yellow: 'bg-amber-100',
    red: 'bg-red-100'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={clsx(
        'w-full rounded-full overflow-hidden',
        backgroundClasses[color],
        sizeClasses[size]
      )}>
        <div
          className={clsx(
            'transition-all duration-300 ease-out rounded-full',
            colorClasses[color],
            sizeClasses[size]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;