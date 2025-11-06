import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  googleSignIn: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.googleOAuthSignin();

      if (result.success && result.user) {
        setUser(result.user);
      } else {
        throw new Error(result.error || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        await window.electronAPI.logout(user.id);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't block logout if backend call fails
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, googleSignIn, logout, loading }}>
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