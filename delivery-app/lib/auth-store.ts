import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

import { setApiAccessToken } from "@/lib/api-client";
import { getDeliveryMe, loginDeliveryPartner, type DeliveryUser } from "@/lib/auth-api";

const AUTH_TOKEN_KEY = "delivery-app-auth-token";

type AuthState = {
  user: DeliveryUser | null;
  accessToken: string | null;
  isAuthenticating: boolean;
  isHydrating: boolean;
  hasHydrated: boolean;
  authError: string;
  setUser: (user: DeliveryUser | null) => void;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticating: false,
  isHydrating: false,
  hasHydrated: false,
  authError: "",
  setUser(user) {
    set({ user });
  },
  async login(payload) {
    set({
      isAuthenticating: true,
      authError: "",
    });

    try {
      const response = await loginDeliveryPartner(payload);

      if (response.user.role !== "delivery_partner") {
        throw new Error("This account is not a delivery partner account.");
      }

      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.accessToken);
      setApiAccessToken(response.accessToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticating: false,
        authError: "",
      });
    } catch (error) {
      setApiAccessToken(null);
      set({
        user: null,
        accessToken: null,
        isAuthenticating: false,
        authError: error instanceof Error ? error.message : "Could not log in.",
      });
      throw error;
    }
  },
  logout() {
    void SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    setApiAccessToken(null);
    set({
      user: null,
      accessToken: null,
      authError: "",
      isAuthenticating: false,
    });
  },
  async restoreSession() {
    if (get().hasHydrated || get().isHydrating) {
      return;
    }

    set({
      isHydrating: true,
      authError: "",
    });

    try {
      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

      if (!storedToken) {
        setApiAccessToken(null);
        set({
          user: null,
          accessToken: null,
          isHydrating: false,
          hasHydrated: true,
        });
        return;
      }

      setApiAccessToken(storedToken);
      const user = await getDeliveryMe(storedToken);

      if (user.role !== "delivery_partner") {
        throw new Error("This account is not a delivery partner account.");
      }

      set({
        user,
        accessToken: storedToken,
        isHydrating: false,
        hasHydrated: true,
        authError: "",
      });
    } catch (_error) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      setApiAccessToken(null);
      set({
        user: null,
        accessToken: null,
        isHydrating: false,
        hasHydrated: true,
        authError: "",
      });
    }
  },
  async refreshMe() {
    const token = get().accessToken;

    if (!token) {
      return;
    }

    const user = await getDeliveryMe(token);
    set({ user });
  },
}));
