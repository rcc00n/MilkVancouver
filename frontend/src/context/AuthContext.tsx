import axios from "axios";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "../api/auth";
import type { MePayload } from "../types/auth";

type AuthContextValue = {
  me: MePayload | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authApi.RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail || error.message || "Request failed";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MePayload | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.fetchMe();
      setMe(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setMe(null);
      } else {
        setAuthError(getErrorMessage(error));
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.login({ email, password });
      setMe(data);
    } catch (error) {
      setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: authApi.RegisterPayload) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.register(payload);
      setMe(data);
    } catch (error) {
      setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await authApi.logout();
      setMe(null);
    } catch (error) {
      setAuthError(getErrorMessage(error));
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      me,
      isAuthenticated: Boolean(me),
      authLoading,
      authError,
      login,
      register,
      logout,
      refreshMe,
    }),
    [me, authLoading, authError, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
