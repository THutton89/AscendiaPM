import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../utils/api';

export interface AuthContextType {
  user: User | null;
  login: (userData: User, token?: string) => void;
  googleSignIn: () => Promise<void>;
  githubSignIn: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  token: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (userData: User, token?: string) => {
    setUser(userData);
    if (token) {
      setToken(token);
      localStorage.setItem('auth_token', token);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const result = await api('google-oauth-signin');

      if (result.success && result.authUrl) {
        // Redirect to Google OAuth - this will navigate away from the page
        // Use replace to avoid adding to browser history
        window.location.replace(result.authUrl);
        // The page will navigate away, so this function never returns
      } else {
        throw new Error(result.error || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const githubSignIn = async () => {
    setLoading(true);
    try {
      const result = await api('github-oauth-signin');

      if (result.success && result.authUrl) {
        // Redirect to GitHub OAuth - this will navigate away from the page
        // Use replace to avoid adding to browser history
        window.location.replace(result.authUrl);
        // Don't return or throw - the page will navigate away
      } else {
        setLoading(false);
        throw new Error(result.error || 'GitHub sign-in failed');
      }
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        await api('logout', { userId: user.id });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't block logout if backend call fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, googleSignIn, githubSignIn, logout, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}