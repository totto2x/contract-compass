import React, { useState, useEffect } from 'react';
import { User, Camera, Key, Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../lib/auth';
import toast from 'react-hot-toast';

interface AccountProfileProps {
  onSave: (data: any) => void;
}

const AccountProfile: React.FC<AccountProfileProps> = ({ onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: null as File | null
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data with user's actual data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email || '',
        avatar: null
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Avatar image must be less than 2MB');
        return;
      }
      setFormData(prev => ({ ...prev, avatar: file }));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('No user logged in');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare avatar URL if file was uploaded
      let avatarUrl = user.user_metadata?.avatar_url;
      
      if (formData.avatar) {
        // In a real implementation, you would upload the file to storage
        // For now, we'll create a temporary URL
        avatarUrl = URL.createObjectURL(formData.avatar);
      }

      // Update user profile through AuthService
      await AuthService.updateProfile({
        user_metadata: {
          name: formData.name,
          avatar_url: avatarUrl
        }
      });

      // Call the onSave callback
      onSave({
        name: formData.name,
        email: formData.email,
        avatar_url: avatarUrl
      });

      setHasChanges(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.updatePassword(passwordData.newPassword);
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email || '',
        avatar: null
      });
      setHasChanges(false);
    }
  };

  // Show loading state if user data is not yet available
  if (!user) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
        <User className="w-5 h-5 text-blue-600" />
        <span>Account & Profile</span>
      </h3>

      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {formData.avatar ? (
                <img 
                  src={URL.createObjectURL(formData.avatar)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Profile Photo</p>
            <p className="text-xs text-gray-500">JPG, PNG up to 2MB</p>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            disabled={true}
            title="Email cannot be changed"
          />
          <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
        </div>

        {/* Change Password Button */}
        <div>
          <button
            onClick={() => setShowPasswordModal(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {hasChanges && (
            <button
              onClick={resetForm}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Change Password</h4>
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountProfile;