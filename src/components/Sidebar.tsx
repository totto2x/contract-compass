import React from 'react';
import { LayoutDashboard, FolderPlus, Settings, BarChart3, Users, FolderOpen } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: 'dashboard' | 'contracts' | 'all-projects' | 'contract-summaries' | 'upload' | 'analytics' | 'clients' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  const mainMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all-projects', label: 'All Projects', icon: FolderOpen },
    { id: 'upload', label: 'Create New Project', icon: FolderPlus },
  ];

  const toolsItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tools Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-4">Tools & Settings</p>
          <div className="space-y-1">
            {toolsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-left transition-all duration-200 font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;