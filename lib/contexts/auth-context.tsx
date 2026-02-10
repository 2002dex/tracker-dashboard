"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: number;
  api_token?: string | null;
  device_ids?: object | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('auth_token');
      const userJson = localStorage.getItem('auth_user');

      if (token && userJson) {
        try {
          const storedUser = JSON.parse(userJson) as User;
          setUser(storedUser);
          setIsAuthenticated(true);
          return;
        } catch (_) {
          // fallthrough to attempt validation
        }
      }

      // If we have a token but no stored user, try to validate with backend
      if (token) {
        try {
          const resp = await fetch(`${apiBase}/api/user`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data && data.user) {
              const userFromApi: User = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: Number(data.user.role),
                api_token: data.user.api_token ?? null,
                device_ids: data.user.device_ids ?? null,
              };
              localStorage.setItem('auth_user', JSON.stringify(userFromApi));
              setUser(userFromApi);
              setIsAuthenticated(true);
              return;
            }
          }
        } catch (err) {
          console.warn('Auth validation failed:', err);
        }
      }

      // No valid auth present
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBase}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && (data.status === true || data.status)) {
        // Extract token from common locations
        const token =
          data.user?.api_token || data.api_token || data.access_token || data.token || data.data?.token || null;

        // Determine user object
        const userObj = data.user || data.user_data || data.data?.user || null;

        const userToStore: User = userObj
          ? {
              id: Number(userObj.id),
              name: userObj.name,
              email: userObj.email,
              role: Number(userObj.role ?? userObj.role_id ?? 2),
              api_token: token ?? null,
              device_ids: userObj.device_ids ?? null,
            }
          : {
              id: 0,
              name: email,
              email: email,
              role: email.includes('admin') ? 1 : 2,
            };

        if (typeof window !== 'undefined') {
          if (token) localStorage.setItem('auth_token', String(token));
          localStorage.setItem('auth_user', JSON.stringify(userToStore));
        }

        // Set cookie for Laravel session or convenience
        if (typeof document !== 'undefined') {
          const cookieValue = token ? String(token) : 'session';
          document.cookie = `auth_token=${cookieValue}; Path=/; SameSite=Lax`;
        }

        setUser(userToStore);
        setIsAuthenticated(true);

        return true;
      }

      throw new Error(data.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    
    // Clear cookie
    document.cookie = 'auth_token=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
