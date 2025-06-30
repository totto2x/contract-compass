import React from 'react';
import { Clock, FileText, GitBranch, Download } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../common/Card';

interface ActivityItem {
  id: string;
  type: 'upload' | 'analysis' | 'download' | 'merge';
  title: string;
  description: string;
  timestamp: string;
  projectName?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll: () => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  onViewAll
}) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'upload':
        return FileText;
      case 'analysis':
        return GitBranch;
      case 'download':
        return Download;
      case 'merge':
        return GitBranch;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'upload':
        return 'text-blue-600 bg-blue-50';
      case 'analysis':
        return 'text-purple-600 bg-purple-50';
      case 'download':
        return 'text-emerald-600 bg-emerald-50';
      case 'merge':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No recent activity</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.description}
                </p>
                {activity.projectName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Project: {activity.projectName}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(activity.timestamp), 'MMM dd, yyyy at h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RecentActivity;