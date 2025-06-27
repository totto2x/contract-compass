import React, { useState } from 'react';
import { Download, Save, Cloud } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportDefaultsProps {
  onSave: (data: any) => void;
}

const ExportDefaults: React.FC<ExportDefaultsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState({
    preferredFormats: {
      pdf: true,
      docx: true
    },
    includeWatermark: false,
    autoSaveToCloud: false
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleFormatToggle = (format: 'pdf' | 'docx') => {
    setSettings(prev => ({
      ...prev,
      preferredFormats: {
        ...prev.preferredFormats,
        [format]: !prev.preferredFormats[format]
      }
    }));
    setHasChanges(true);
  };

  const handleToggle = (field: string) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(settings);
    setHasChanges(false);
    toast.success('Export preferences saved');
  };

  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; label: string; description?: string; disabled?: boolean }> = ({ 
    enabled, 
    onChange, 
    label,
    description,
    disabled = false
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className={disabled ? 'opacity-50' : ''}>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50' : ''}`}
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
        <Download className="w-5 h-5 text-blue-600" />
        <span>Export Defaults</span>
      </h3>

      <div className="space-y-6">
        {/* Preferred Formats */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred Export Formats
          </label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferredFormats.pdf}
                onChange={() => handleFormatToggle('pdf')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">PDF</span>
                <p className="text-xs text-gray-500">Portable Document Format - best for sharing and printing</p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.preferredFormats.docx}
                onChange={() => handleFormatToggle('docx')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">DOCX</span>
                <p className="text-xs text-gray-500">Microsoft Word format - best for editing and collaboration</p>
              </div>
            </label>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-1">
          <ToggleSwitch
            enabled={settings.includeWatermark}
            onChange={() => handleToggle('includeWatermark')}
            label="Include watermark on final exports"
            description="Add a watermark to exported documents for identification"
          />
          
          <ToggleSwitch
            enabled={settings.autoSaveToCloud}
            onChange={() => handleToggle('autoSaveToCloud')}
            label="Auto-save to cloud"
            description="Automatically save exported documents to cloud storage (coming soon)"
            disabled={true}
          />
        </div>

        {/* Export Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Export Preview</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Formats: {Object.entries(settings.preferredFormats)
              .filter(([_, enabled]) => enabled)
              .map(([format]) => format.toUpperCase())
              .join(', ') || 'None selected'}</p>
            <p>• Watermark: {settings.includeWatermark ? 'Included' : 'Not included'}</p>
            <p>• Cloud save: {settings.autoSaveToCloud ? 'Enabled' : 'Disabled'} (coming soon)</p>
          </div>
        </div>

        {/* Format Warning */}
        {!settings.preferredFormats.pdf && !settings.preferredFormats.docx && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Please select at least one export format to ensure you can download your contracts.
            </p>
          </div>
        )}

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {hasChanges && (
            <button
              onClick={() => {
                setSettings({
                  preferredFormats: { pdf: true, docx: true },
                  includeWatermark: false,
                  autoSaveToCloud: false
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

export default ExportDefaults;