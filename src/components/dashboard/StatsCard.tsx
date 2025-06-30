import React from 'react';
import { DivideIcon as LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'amber';
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  onClick
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      hover: 'hover:bg-blue-100'
    },
    green: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      hover: 'hover:bg-emerald-100'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      hover: 'hover:bg-purple-100'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      hover: 'hover:bg-amber-100'
    }
  };

  const colors = colorClasses[color];

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border border-gray-200 p-6 shadow-sm transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-legal-lg hover:-translate-y-1'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={clsx(
                'text-sm font-medium',
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        
        <div className={clsx(
          'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
          colors.bg,
          onClick && colors.hover
        )}>
          <Icon className={clsx('w-7 h-7', colors.icon)} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;