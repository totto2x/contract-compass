import React, { useState } from 'react';
import { Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationsProps {
  onSave: (data: any) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState({
    contractUploadAlerts: true,
    amendmentDetectionAlerts: true,
    frequency: 'real-time' as 'real-time' | 'daily' | 'weekly'
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (field: string) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
    setHasChanges(true);
  };

  const handleFrequencyChange = (frequency: 'real-time' | 'daily' | 'weekly') => {
    setSettings(prev => ({ ...prev, frequency }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(settings);
    setHasChanges(false);
    toast.success('Notification preferences saved');
  };

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; label: string }> = ({ 
    enabled, 
    onChange, 
    label 
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
        <Bell className="w-5 h-5 text-blue-600" />
        <span>Notifications</span>
      </h3>

      <div className="space-y-6">
        {/* Notification Toggles */}
        <div className="space-y-1">
          <ToggleSwitch
            enabled={settings.contractUploadAlerts}
            onChange={() => handleToggle('contractUploadAlerts')}
            label="Receive contract upload alerts"
          />
          <ToggleSwitch
            enabled={settings.amendmentDetectionAlerts}
            onChange={() => handleToggle('amendmentDetectionAlerts')}
            label="Get notified when amendments are detected"
          />
        </div>

        {/* Frequency Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Notification Frequency
          </label>
          <div className="space-y-2">
            {[
              { value: 'real-time', label: 'Real-time', description: 'Immediate notifications as events occur' },
              { value: 'daily', label: 'Daily digest', description: 'Summary of activity sent once per day' },
              { value: 'weekly', label: 'Weekly digest', description: 'Weekly summary of all activity' }
            ].map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={settings.frequency === option.value}
                  onChange={() => handleFrequencyChange(option.value as any)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {hasChanges && (
            <button
              onClick={() => {
                setSettings({
                  contractUploadAlerts: true,
                  amendmentDetectionAlerts: true,
                  frequency: 'real-time'
                });
                setHasChanges(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;