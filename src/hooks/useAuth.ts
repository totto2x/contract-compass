import { useState, useEffect } from 'react';
import { AuthService, type AuthUser } from '../lib/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    AuthService.getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(setUser);

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};