import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse, EmployeeProfile, LoginCredentials, Tenant, TokenSession } from '../types/auth';
import { apiClient } from '../services/apiClient';
import { secureStorage } from '../services/storage';

interface AuthContextType {
  employee: EmployeeProfile | null;
  tenant: Tenant | null;
  session: TokenSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<EmployeeProfile>) => Promise<EmployeeProfile>;
  changePassword: (curr: string, newP: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<TokenSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = secureStorage.getToken();
        if (token) {
          // Verify with server
          const prof = await apiClient.getProfile();
          setEmployee(prof);
          setSession({
            accessToken: token,
            tokenType: 'Bearer',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      } catch {
        secureStorage.clearSession();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (creds: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(creds);
      secureStorage.saveSession(res.session.accessToken, res.session.expiresAt);
      secureStorage.setSavedIdentifier(creds.identifier);
      setEmployee(res.employee);
      setTenant(res.tenant);
      setSession(res.session);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.logout();
    } finally {
      secureStorage.clearSession();
      setEmployee(null);
      setTenant(null);
      setSession(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const prof = await apiClient.getProfile();
      setEmployee(prof);
    } catch {
      // ignore
    }
  };

  const updateProfile = async (updates: Partial<EmployeeProfile>): Promise<EmployeeProfile> => {
    const updated = await apiClient.updateProfile(updates);
    setEmployee(updated);
    return updated;
  };

  const changePassword = async (curr: string, newP: string): Promise<boolean> => {
    return apiClient.changePassword(curr, newP);
  };

  return (
    <AuthContext.Provider
      value={{
        employee,
        tenant,
        session,
        isAuthenticated: !!employee && !!session,
        isLoading,
        login,
        logout,
        refreshProfile,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
