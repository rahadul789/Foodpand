import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

import {
  type AuthPayload,
  type SignupPayload,
  getMeRequest,
  loginRequest,
  signupRequest,
} from "@/lib/auth-api";
import { setApiAccessToken } from "@/lib/api-client";

const AUTH_TOKEN_KEY = "customer-app-auth-token";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "restaurant_owner" | "delivery_partner" | "admin";
  location: string;
  loyaltyPoints: number;
};

type AuthResult = {
  ok: boolean;
  message: string;
};

type AuthStore = {
  accessToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isHydrating: boolean;
  hasHydrated: boolean;
  signIn: (payload: AuthPayload) => Promise<AuthResult>;
  signUp: (payload: SignupPayload) => Promise<AuthResult>;
  restoreSession: () => Promise<void>;
  hydrateMe: () => Promise<void>;
  setProfileLocation: (location: string) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  accessToken: null,
  user: null,
  isLoading: false,
  isHydrating: false,
  hasHydrated: false,
  signIn: async (payload) => {
    set({ isLoading: true });

    try {
      const data = await loginRequest(payload);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.accessToken);
      setApiAccessToken(data.accessToken);
      set({
        accessToken: data.accessToken,
        user: data.user,
        isLoading: false,
      });

      return {
        ok: true,
        message: "Welcome back",
      };
    } catch (error) {
      set({ isLoading: false });
      return {
        ok: false,
        message:
          error instanceof Error ? error.message : "Login failed. Try again.",
      };
    }
  },
  signUp: async (payload) => {
    set({ isLoading: true });

    try {
      const data = await signupRequest(payload);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.accessToken);
      setApiAccessToken(data.accessToken);
      set({
        accessToken: data.accessToken,
        user: data.user,
        isLoading: false,
      });

      return {
        ok: true,
        message: "Account created",
      };
    } catch (error) {
      set({ isLoading: false });
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Signup failed. Try again.",
      };
    }
  },
  restoreSession: async () => {
    if (get().hasHydrated || get().isHydrating) {
      return;
    }

    set({ isHydrating: true });

    try {
      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

      if (!storedToken) {
        setApiAccessToken(null);
        set({
          accessToken: null,
          user: null,
          isHydrating: false,
          hasHydrated: true,
        });
        return;
      }

      setApiAccessToken(storedToken);
      set({
        accessToken: storedToken,
      });

      const user = await getMeRequest(storedToken);
      set({
        accessToken: storedToken,
        user,
        isHydrating: false,
        hasHydrated: true,
      });
    } catch (_error) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      setApiAccessToken(null);
      set({
        accessToken: null,
        user: null,
        isHydrating: false,
        hasHydrated: true,
      });
    }
  },
  hydrateMe: async () => {
    const token = get().accessToken;

    if (!token) {
      return;
    }

    try {
      const user = await getMeRequest(token);
      set({ user });
    } catch (_error) {
      setApiAccessToken(null);
      set({
        accessToken: null,
        user: null,
      });
    }
  },
  setProfileLocation: (location) =>
    set((state) => {
      if (!state.user || state.user.location === location) {
        return state;
      }

      return {
        user: {
          ...state.user,
          location,
        },
      };
    }),
  signOut: () => {
    void SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    setApiAccessToken(null);
    set({
      accessToken: null,
      user: null,
      isLoading: false,
    });
  },
}));

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
