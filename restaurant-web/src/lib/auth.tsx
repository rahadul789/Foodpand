/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiGet, apiPost } from "./api";

const STORAGE_KEY = "restaurant-web-token";

export type OwnerUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
  location: string;
  loyaltyPoints: number;
};

type AuthResponse = {
  user: OwnerUser;
  accessToken: string;
};

type AuthContextValue = {
  token: string | null;
  user: OwnerUser | null;
  isHydrating: boolean;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getMe(token: string) {
  const response = await apiGet<OwnerUser>("/api/v1/users/me", token);
  return response.data;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<OwnerUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEY);

    if (!currentToken) {
      setToken(null);
      setUser(null);
      return;
    }

    try {
      const nextUser = await getMe(currentToken);

      if (nextUser.role !== "restaurant_owner") {
        throw new Error("Only restaurant owners can use this panel.");
      }

      setToken(currentToken);
      setUser(nextUser);
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        await refreshMe();
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [logout, refreshMe]);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const response = await apiPost<AuthResponse>("/api/v1/auth/login", payload);

    if (response.data.user.role !== "restaurant_owner") {
      throw new Error("This account is not a restaurant owner account.");
    }

    localStorage.setItem(STORAGE_KEY, response.data.accessToken);
    setToken(response.data.accessToken);
    setUser(response.data.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isHydrating,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshMe,
    }),
    [isHydrating, login, logout, refreshMe, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
