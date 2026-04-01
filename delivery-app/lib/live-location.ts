import { useEffect, useState } from "react";

import * as Location from "expo-location";

import { updateDeliveryOrderLocation } from "@/lib/order-api";

type LiveLocationArgs = {
  enabled: boolean;
  orderId: string | null;
  token: string | null;
};

type LiveLocationState = {
  isSharing: boolean;
  statusText: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  } | null;
};

export function useDeliveryLiveLocation({
  enabled,
  orderId,
  token,
}: LiveLocationArgs): LiveLocationState {
  const [isSharing, setIsSharing] = useState(false);
  const [statusText, setStatusText] = useState("Waiting for live route");
  const [currentLocation, setCurrentLocation] = useState<LiveLocationState["currentLocation"]>(null);

  useEffect(() => {
    if (!enabled || !orderId || !token) {
      setIsSharing(false);
      setStatusText("Live sharing is idle");
      setCurrentLocation(null);
      return undefined;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    const startSharing = async () => {
      try {
        setStatusText("Checking location permission");
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          if (!cancelled) {
            setIsSharing(false);
            setStatusText("Location permission is needed for live route sharing");
          }
          return;
        }

        if (!cancelled) {
          setStatusText("Live location is being shared");
        }

        const initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const initialLocation = {
          latitude: initialPosition.coords.latitude,
          longitude: initialPosition.coords.longitude,
          heading:
            typeof initialPosition.coords.heading === "number"
              ? initialPosition.coords.heading
              : undefined,
          speed:
            typeof initialPosition.coords.speed === "number"
              ? initialPosition.coords.speed
              : undefined,
        };

        setCurrentLocation(initialLocation);
        await updateDeliveryOrderLocation(
          orderId,
          {
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
            heading: initialLocation.heading ?? null,
            speed: initialLocation.speed ?? null,
          },
          token,
        );

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15_000,
            distanceInterval: 30,
          },
          (position) => {
            const nextLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              heading:
                typeof position.coords.heading === "number" ? position.coords.heading : undefined,
              speed: typeof position.coords.speed === "number" ? position.coords.speed : undefined,
            };
            setCurrentLocation(nextLocation);
            void updateDeliveryOrderLocation(
              orderId,
              {
                latitude: nextLocation.latitude,
                longitude: nextLocation.longitude,
                heading: nextLocation.heading ?? null,
                speed: nextLocation.speed ?? null,
              },
              token,
            );
          },
        );

        if (!cancelled) {
          setIsSharing(true);
          setStatusText("Customer can now see your live route");
        }
      } catch {
        if (!cancelled) {
          setIsSharing(false);
          setStatusText("Could not start live location sharing");
          setCurrentLocation(null);
        }
      }
    };

    void startSharing();

    return () => {
      cancelled = true;
      setCurrentLocation(null);
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, orderId, token]);

  return {
    isSharing,
    statusText,
    currentLocation,
  };
}
