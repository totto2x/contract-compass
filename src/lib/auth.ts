import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
}

export class AuthService {
  static async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get current user - fixed to return proper AuthUser format
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) return null;

      // Return user in AuthUser format
      return {
        id: user.id,
        email: user.email || '',
        user_metadata: {
          name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url
        }
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Update user profile
  static async updateProfile(updates: Partial<Pick<AuthUser, 'user_metadata'>>) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: updates.user_metadata
    });

    if (authError) throw authError;

    // Also update our users table if it exists
    try {
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: updates.user_metadata?.name,
          avatar_url: updates.user_metadata?.avatar_url
        })
        .eq('user_id', user.id);

      // Don't throw error if users table doesn't exist or update fails
      if (profileError) {
        console.warn('Failed to update user profile table:', profileError);
      }
    } catch (error) {
      console.warn('Users table may not exist:', error);
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  }

  // Update password
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: {
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url
          }
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }
}