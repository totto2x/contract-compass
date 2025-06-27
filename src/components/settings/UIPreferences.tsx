import React, { useState, useEffect } from 'react';
import { Monitor, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface UIPreferencesProps {
  onSave: (data: any) => void;
}

const UIPreferences: React.FC<UIPreferencesProps> = ({ onSave }) => {
  const [settings, setSettings] = useState({
    defaultLandingView: 'dashboard' as 'dashboard' | 'all-projects',
    showDocumentCount: true
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('uiPreferences');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Remove darkMode from saved settings if it exists
      const { darkMode, ...cleanSettings } = parsed;
      setSettings(cleanSettings);
    }
  }, []);

  const handleToggle = (field: string) => {
    const newSettings = { ...settings, [field]: !settings[field as keyof typeof settings] };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleLandingViewChange = (view: 'dashboard' | 'all-projects') => {
    setSettings(prev => ({ ...prev, defaultLandingView: view }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save to localStorage for immediate effect
    localStorage.setItem('uiPreferences', JSON.stringify(settings));
    
    // Save to backend/Supabase
    onSave(settings);
    setHasChanges(false);
    toast.success('UI preferences saved');
  };

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; label: string; description?: string }> = ({ 
    enabled, 
    onChange, 
    label,
    description 
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center space-x-2">
        <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span>UI Preferences</span>
      </h3>

      <div className="space-y-6">
        {/* Default Landing View */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Default Landing View
          </label>
          <div className="space-y-2">
            {[
              { value: 'dashboard', label: 'Dashboard', description: 'Overview with stats and recent activity' },
              { value: 'all-projects', label: 'All Projects', description: 'Direct access to project list' }
            ].map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="defaultView"
                  value={option.value}
                  checked={settings.defaultLandingView === option.value}
                  onChange={() => handleLandingViewChange(option.value as any)}
                  className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Show Document Count */}
        <ToggleSwitch
          enabled={settings.showDocumentCount}
          onChange={() => handleToggle('showDocumentCount')}
          label="Show document count on sidebar"
          description="Display number of documents next to project names"
        />

        {/* Preview Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Landing page: {settings.defaultLandingView === 'dashboard' ? 'Dashboard' : 'All Projects'}</p>
            <p>• Document counts: {settings.showDocumentCount ? 'Visible' : 'Hidden'}</p>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {hasChanges && (
            <button
              onClick={() => {
                const defaultSettings = {
                  defaultLandingView: 'dashboard' as const,
                  showDocumentCount: true
                };
                setSettings(defaultSettings);
                setHasChanges(false);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UIPreferences;