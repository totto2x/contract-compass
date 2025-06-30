import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'complete' | 'processing' | 'pending' | 'error' | 'active' | 'draft' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
      case 'active':
        return {
          icon: CheckCircle,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: status === 'complete' ? 'Complete' : 'Active'
        };
      case 'processing':
        return {
          icon: Clock,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Processing'
        };
      case 'pending':
      case 'draft':
        return {
          icon: Clock,
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          label: status === 'pending' ? 'Pending' : 'Draft'
        };
      case 'error':
      case 'cancelled':
        return {
          icon: status === 'error' ? XCircle : AlertCircle,
          className: 'bg-red-50 text-red-700 border-red-200',
          label: status === 'error' ? 'Error' : 'Cancelled'
        };
      default:
        return {
          icon: Clock,
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span className={clsx(
      'inline-flex items-center font-medium rounded-full border',
      config.className,
      sizeClasses[size]
    )}>
      {showIcon && <Icon className={clsx(iconSizes[size], 'mr-1')} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;