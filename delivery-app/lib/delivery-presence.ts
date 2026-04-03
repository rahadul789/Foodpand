import { useEffect } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

import { updateDeliveryPresenceRequest } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

async function getCurrentCoords() {
  const permission = await Location.getForegroundPermissionsAsync();
  let status = permission.status;

  if (status !== "granted") {
    const next = await Location.requestForegroundPermissionsAsync();
    status = next.status;
  }

  if (status !== "granted") {
    return null;
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
  };
}

export function useDeliveryPresenceSync() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = Boolean(user?.id && token);
  const isOnline = user?.deliveryAvailability?.isOnline !== false;
  const acceptsNewOrders =
    user?.deliveryAvailability?.acceptsNewOrders !== false;

  useEffect(() => {
    if (!isAuthenticated || !token || !isOnline) {
      return undefined;
    }

    let cancelled = false;

    const syncPresence = async () => {
      try {
        const coords = await getCurrentCoords();
        const nextUser = await updateDeliveryPresenceRequest(
          {
            isOnline: true,
            acceptsNewOrders,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
            deliveryTransportMode: user?.deliveryTransportMode ?? "bicycle",
          },
          token,
        );

        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        // Presence sync should never block rider usage.
      }
    };

    void syncPresence();
    const intervalId = setInterval(() => {
      void syncPresence();
    }, 60000);

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncPresence();
      }
    });

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [
    acceptsNewOrders,
    isAuthenticated,
    isOnline,
    setUser,
    token,
    user?.deliveryTransportMode,
  ]);
}

export async function updateRiderAvailability(
  accessToken: string,
  payload: {
    isOnline?: boolean;
    acceptsNewOrders?: boolean;
    deliveryTransportMode?: "bicycle" | "motorbike" | "car";
  },
) {
  const coords =
    payload.isOnline === false ? null : await getCurrentCoords().catch(() => null);

  return updateDeliveryPresenceRequest(
    {
      ...payload,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    },
    accessToken,
  );
}
