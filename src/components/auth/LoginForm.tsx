import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, Users, Zap, CheckCircle } from 'lucide-react';
import { AuthService } from '../../lib/auth';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignup, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await AuthService.signIn(formData.email, formData.password);
      toast.success('Welcome back!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      toast.error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex relative">
      {/* 🔥 Bolt Logo - Top Right - INCREASED SIZE */}
      <div className="absolute top-6 right-6 z-50">
        <img 
          src="/bolt-logo.svg" 
          alt="Bolt Logo" 
          className="h-16 w-16 object-contain"
        />
      </div>

      {/* Left Side - Login Form */}
      <div className="w-2/5 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Company Branding */}
          <div className="flex items-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mr-3">
              <img src="/cropped legal logo.png" alt="Logo" className="w-12 h-12 rounded-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Contract Compass</h1>
              <p className="text-xs text-gray-600">Professional Contract Management</p>
            </div>
          </div>

          {/* Header - Left aligned */}
          <div className="text-left mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-600">
              Please enter your details to sign in
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-800">Sign in failed</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-900 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-900 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-500 pr-10"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-xs text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Do not have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                disabled={isLoading}
              >
                Sign up for free
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Marketing Content */}
      <div className="w-3/5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full opacity-15"></div>
            <div className="absolute bottom-32 left-16 w-40 h-40 bg-white rounded-full opacity-10"></div>
            <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full opacity-25"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg text-white">
          {/* Header - Aligned with left side */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Streamline your contract management
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Join thousands of legal professionals who trust our platform for secure, efficient contract analysis and management
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Contract Analysis</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  AI-powered document analysis and change detection
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Team Collaboration</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Secure sharing and collaboration on contract projects
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Enterprise Security</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Bank-level security with SOC 2 compliance
                </p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 pt-6 border-t border-blue-500 border-opacity-30">
            <div className="flex items-center space-x-6 text-xs text-blue-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3" />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;