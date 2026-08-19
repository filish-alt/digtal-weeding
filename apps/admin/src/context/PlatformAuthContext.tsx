import React, { createContext, useContext, useState } from 'react';

interface PlatformAdminUser {
  id: string;
  email: string;
  name: string;
}

interface PlatformAuthContextType {
  platformToken: string | null;
  adminUser: PlatformAdminUser | null;
  loginPlatform: (email: string, password: string) => Promise<void>;
  logoutPlatform: () => void;
  fetchWithPlatformAuth: (url: string, options?: RequestInit) => Promise<Response>;
  isPlatformAuthenticated: boolean;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformToken, setPlatformToken] = useState<string | null>(() => {
    return localStorage.getItem('platform_admin_token');
  });

  const [adminUser, setAdminUser] = useState<PlatformAdminUser | null>(() => {
    const saved = localStorage.getItem('platform_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const loginPlatform = async (email: string, password: string) => {
    const res = await fetch('/api/auth/platform/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid platform administrator credentials');
    }

    const data = await res.json();
    localStorage.setItem('platform_admin_token', data.access_token);
    if (data.admin) {
      localStorage.setItem('platform_admin_user', JSON.stringify(data.admin));
      setAdminUser(data.admin);
    }
    setPlatformToken(data.access_token);
  };

  const logoutPlatform = () => {
    localStorage.removeItem('platform_admin_token');
    localStorage.removeItem('platform_admin_user');
    setPlatformToken(null);
    setAdminUser(null);
  };

  const fetchWithPlatformAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (platformToken) {
      headers.set('Authorization', `Bearer ${platformToken}`);
    }
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      logoutPlatform();
    }

    return res;
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        platformToken,
        adminUser,
        loginPlatform,
        logoutPlatform,
        fetchWithPlatformAuth,
        isPlatformAuthenticated: !!platformToken,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error('usePlatformAuth must be used within a PlatformAuthProvider');
  }
  return context;
};
