import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Monitor, Download } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AccountProfile from '../components/settings/AccountProfile';
import Notifications from '../components/settings/Notifications';
import UIPreferences from '../components/settings/UIPreferences';
import ExportDefaults from '../components/settings/ExportDefaults';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'ui' | 'export'>('account');

  const tabs = [
    { id: 'account', label: 'Account & Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ui', label: 'UI Preferences', icon: Monitor },
    { id: 'export', label: 'Export Defaults', icon: Download },
  ];

  const handleSaveAccountProfile = (data: any) => {
    // In real app, save to Supabase using user_id
    console.log('Saving account profile:', data);
  };

  const handleSaveNotifications = (data: any) => {
    // In real app, save to Supabase using user_id
    console.log('Saving notification preferences:', data);
  };

  const handleSaveUIPreferences = (data: any) => {
    // In real app, save to Supabase using user_id
    console.log('Saving UI preferences:', data);
  };

  const handleSaveExportDefaults = (data: any) => {
    // In real app, save to Supabase using user_id
    console.log('Saving export defaults:', data);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'account':
        return <AccountProfile onSave={handleSaveAccountProfile} />;
      case 'notifications':
        return <Notifications onSave={handleSaveNotifications} />;
      case 'ui':
        return <UIPreferences onSave={handleSaveUIPreferences} />;
      case 'export':
        return <ExportDefaults onSave={handleSaveExportDefaults} />;
      default:
        return <AccountProfile onSave={handleSaveAccountProfile} />;
    }
  };

  return (
    <div className="p-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your experience with contract notifications, UI preferences, and export behavior</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Settings Info */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Settings Info</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>• Settings persist between sessions</p>
                <p>• UI changes take effect immediately</p>
                <p>• All preferences are stored securely</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;