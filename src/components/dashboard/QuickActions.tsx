import React from 'react';
import { FolderPlus, Upload, FileText, Settings, BarChart3 } from 'lucide-react';
import Card from '../common/Card';

interface QuickActionsProps {
  onCreateProject: () => void;
  onUploadDocuments: () => void;
  onViewAnalytics: () => void;
  onOpenSettings: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateProject,
  onUploadDocuments,
  onViewAnalytics,
  onOpenSettings
}) => {
  const actions = [
    {
      icon: FolderPlus,
      title: 'Create Project',
      description: 'Start a new contract project',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      onClick: onCreateProject
    },
    {
      icon: Upload,
      title: 'Upload Documents',
      description: 'Add contracts for analysis',
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      onClick: onUploadDocuments
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'Contract insights & reports',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      onClick: onViewAnalytics
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Configure preferences',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      onClick: onOpenSettings
    }
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={action.onClick}
              className="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md text-left"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg ${action.color} ${action.hoverColor} flex items-center justify-center transition-colors`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActions;