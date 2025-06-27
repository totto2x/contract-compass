import React, { useState, useEffect } from 'react';
import { AuthService, type AuthUser } from '../../lib/auth';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import LoadingSpinner from '../common/LoadingSpinner';

interface AuthWrapperProps {
  children: (user: AuthUser) => React.ReactNode;
}

type AuthView = 'login' | 'signup' | 'forgot-password';

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('login');

  useEffect(() => {
    // Check for existing session
    AuthService.getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(setUser);

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {authView === 'login' && (
          <LoginForm
            onSuccess={() => {}} // User state will be updated by the auth listener
            onSwitchToSignup={() => setAuthView('signup')}
            onForgotPassword={() => setAuthView('forgot-password')}
          />
        )}
        {authView === 'signup' && (
          <SignupForm
            onSuccess={() => setAuthView('login')}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
        {authView === 'forgot-password' && (
          <ForgotPasswordForm
            onBack={() => setAuthView('login')}
          />
        )}
      </div>
    );
  }

  return <>{children(user)}</>;
};

export default AuthWrapper;