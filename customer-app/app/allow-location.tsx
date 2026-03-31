import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useRootNavigationState, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useUpdateDeviceLocationMutation,
} from "@/lib/address-queries";
import { useAuthStore } from "@/lib/auth-store";
import {
  defaultDeliveryLocation,
  setDeliveryLocation,
  type DeliveryLocation,
} from "@/lib/location-store";
import { useUIStore } from "@/lib/ui-store";

async function syncCurrentLocation() {
  const permission = await Location.getForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    return null;
  }

  try {
    const position =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }));

    if (!position) {
      return defaultDeliveryLocation;
    }

    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const place = places[0];

    return {
      label:
        [place?.name, place?.street].filter(Boolean).join(", ") ||
        defaultDeliveryLocation.label,
      subtitle:
        [place?.district, place?.city, place?.region]
          .filter(Boolean)
          .join(", ") || defaultDeliveryLocation.subtitle,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return defaultDeliveryLocation;
  }
}

export default function AllowLocationScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const updateDeviceLocationMutation = useUpdateDeviceLocationMutation();
  const rootNavigationState = useRootNavigationState();
  const [checking, setChecking] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [granted, setGranted] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const continueToHome = useCallback(() => {
    if (rootNavigationState?.key) {
      router.replace("/(tabs)/home");
      return;
    }

    setPendingRedirect(true);
  }, [rootNavigationState?.key, router]);

  const syncBackendLocation = useCallback(
    async (location: DeliveryLocation) => {
      if (!user) {
        return;
      }

      try {
        await updateDeviceLocationMutation.mutateAsync(location);
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : "Unable to sync your selected location right now.",
        );
      }
    },
    [
      showToast,
      updateDeviceLocationMutation,
      user,
    ],
  );

  const checkPermission = useCallback(async () => {
    const location = await syncCurrentLocation();

    if (location) {
      setDeliveryLocation(location);
      void syncBackendLocation(location);
      continueToHome();
    }

    setGranted(Boolean(location));
    setChecking(false);
  }, [continueToHome, syncBackendLocation]);

  useEffect(() => {
    if (!pendingRedirect || !rootNavigationState?.key) {
      return;
    }

    setPendingRedirect(false);
    router.replace("/(tabs)/home");
  }, [pendingRedirect, rootNavigationState?.key, router]);

  useEffect(() => {
    void checkPermission();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setChecking(true);
        void checkPermission();
      }
    });

    return () => subscription.remove();
  }, [checkPermission]);

  const handleAllowLocation = async () => {
    setRequesting(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status === "granted") {
        setGranted(true);
        const location = await syncCurrentLocation();

        if (location) {
          setDeliveryLocation(location);
          await syncBackendLocation(location);
          continueToHome();
        }
      } else {
        setGranted(false);
      }
    } finally {
      setRequesting(false);
      setChecking(false);
    }
  };

  const handleOpenSettings = async () => {
    await Linking.openSettings();
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF5D8F" />
          <Text style={styles.loadingText}>Checking location access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <View style={styles.wrap}>
        <View style={styles.heroCard}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />

          <View style={styles.iconWrap}>
            <Ionicons name="location" size={34} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Allow your location</Text>
          <Text style={styles.text}>
            Nearby restaurants, delivery time, আর offers better দেখানোর জন্য location দরকার।
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="navigate-outline" size={18} color="#24314A" />
            </View>
            <Text style={styles.infoText}>Show restaurants near you</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={18} color="#24314A" />
            </View>
            <Text style={styles.infoText}>Estimate delivery more accurately</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="pricetag-outline" size={18} color="#24314A" />
            </View>
            <Text style={styles.infoText}>Show location-based offers</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.primaryButton}
            onPress={handleAllowLocation}
            disabled={requesting}
          >
            {requesting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Allow location</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          {!granted ? (
            <Pressable style={styles.secondaryButton} onPress={handleOpenSettings}>
              <Text style={styles.secondaryButtonText}>Open settings</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6F6A77",
  },
  wrap: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  heroCard: {
    borderRadius: 34,
    padding: 22,
    overflow: "hidden",
    backgroundColor: "#E8EDFF",
  },
  heroBubbleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#5C7CFA",
    opacity: 0.16,
    top: -56,
    right: -34,
  },
  heroBubbleTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#7BDFF2",
    opacity: 0.28,
    bottom: -34,
    left: -26,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C7CFA",
  },
  title: {
    marginTop: 18,
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "900",
    color: "#20263A",
    maxWidth: 240,
  },
  text: {
    marginTop: 10,
    maxWidth: 290,
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
  },
  infoCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#20263A",
  },
  footer: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FF5D8F",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F0EB",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#24314A",
  },
});
