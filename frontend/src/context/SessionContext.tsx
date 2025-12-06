import axios, { AxiosError } from "axios";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/client";

type SessionStatus = "loading" | "authenticated" | "anonymous" | "error";

type SessionUser = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: boolean;
};

type SessionProfile = {
  email?: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  postalCode: string;
  regionCode: string;
  regionName?: string;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
};

type SessionCapabilities = {
  isDriver: boolean;
  canAccessAdmin: boolean;
  checked: boolean;
};

type SessionState = {
  status: SessionStatus;
  user?: SessionUser;
  profile?: SessionProfile;
  capabilities: SessionCapabilities;
  checkingAccess: boolean;
  error?: string;
};

type SessionContextValue = SessionState & {
  refresh: () => Promise<void>;
};

type AuthMeResponse = {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff?: boolean;
  };
  profile: {
    email?: string;
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
    postal_code: string;
    region_code: string;
    region_name?: string;
    email_verified_at?: string | null;
    phone_verified_at?: string | null;
  };
};

const defaultCapabilities: SessionCapabilities = {
  isDriver: false,
  canAccessAdmin: false,
  checked: false,
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function mapUser(user: AuthMeResponse["user"]): SessionUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isStaff: Boolean(user.is_staff),
  };
}

function mapProfile(profile: AuthMeResponse["profile"]): SessionProfile {
  return {
    email: profile.email || undefined,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    city: profile.city,
    postalCode: profile.postal_code,
    regionCode: profile.region_code,
    regionName: profile.region_name,
    emailVerifiedAt: profile.email_verified_at,
    phoneVerifiedAt: profile.phone_verified_at,
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail || error.message || "Request failed";
  }
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    capabilities: defaultCapabilities,
    checkingAccess: false,
  });

  const markAnonymous = useCallback(() => {
    setState({
      status: "anonymous",
      capabilities: { ...defaultCapabilities, checked: true },
      checkingAccess: false,
    });
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      status: "loading",
      error: undefined,
      capabilities: defaultCapabilities,
    }));

    try {
      const { data } = await api.get<AuthMeResponse>("/auth/me/");
      setState({
        status: "authenticated",
        user: mapUser(data.user),
        profile: mapProfile(data.profile),
        capabilities: defaultCapabilities,
        checkingAccess: true,
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axios.isAxiosError(axiosError) && axiosError.response?.status === 401) {
        markAnonymous();
        return;
      }

      setState((prev) => ({
        ...prev,
        status: "error",
        error: getErrorMessage(error),
        capabilities: defaultCapabilities,
        checkingAccess: false,
      }));
    }
  }, [markAnonymous]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (state.status !== "authenticated" || state.capabilities.checked) return;

    let isActive = true;

    const probeAdmin = async () => {
      try {
        await api.get("/admin/dashboard/");
        return true;
      } catch (error) {
        if (!isActive) return false;
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 403) return false;
          if (status === 401) {
            markAnonymous();
            return false;
          }
        }
        return false;
      }
    };

    const probeDriver = async () => {
      try {
        await api.get("/delivery/driver/routes/today/");
        return true;
      } catch (error) {
        if (!isActive) return false;
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 403) return false;
          if (status === 401) {
            markAnonymous();
            return false;
          }
        }
        return false;
      }
    };

    const run = async () => {
      setState((prev) => ({ ...prev, checkingAccess: true }));
      const [adminAccess, driverAccess] = await Promise.all([probeAdmin(), probeDriver()]);
      if (!isActive) return;
      setState((prev) => ({
        ...prev,
        capabilities: {
          isDriver: driverAccess,
          canAccessAdmin: adminAccess || prev.user?.isStaff === true,
          checked: true,
        },
        checkingAccess: false,
      }));
    };

    run();
    return () => {
      isActive = false;
    };
  }, [state.status, state.capabilities.checked, markAnonymous]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
