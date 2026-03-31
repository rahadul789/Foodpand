import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useUpdateDeviceLocationMutation,
} from "@/lib/address-queries";
import { useAuthStore } from "@/lib/auth-store";
import {
  defaultDeliveryLocation,
  getDeliveryLocation,
  setPendingPickedLocation,
  setDeliveryLocation,
} from "@/lib/location-store";

const DEFAULT_DELTA = {
  latitudeDelta: 0.00035,
  longitudeDelta: 0.00035,
};
const INITIAL_CAMERA_ZOOM = 18.2;
const MIN_CAMERA_ZOOM = 16.2;
const MAX_CAMERA_ZOOM = 19.5;

export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    purpose?: string;
    latitude?: string;
    longitude?: string;
    label?: string;
    subtitle?: string;
  }>();
  const user = useAuthStore((state) => state.user);
  const updateDeviceLocationMutation = useUpdateDeviceLocationMutation();
  const fallbackLocation = getDeliveryLocation();
  const initialLocation =
    params.purpose === "address" &&
    params.latitude &&
    params.longitude &&
    Number.isFinite(Number(params.latitude)) &&
    Number.isFinite(Number(params.longitude))
      ? {
          label: params.label || fallbackLocation.label,
          subtitle: params.subtitle || fallbackLocation.subtitle,
          latitude: Number(params.latitude),
          longitude: Number(params.longitude),
        }
      : fallbackLocation;
  const initialLatitude = initialLocation.latitude;
  const initialLongitude = initialLocation.longitude;
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const reverseGeocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isDraggingRef = useRef(false);
  const hasResolvedInitialCamera = useRef(false);

  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude,
    longitude: initialLongitude,
    ...DEFAULT_DELTA,
  });
  const [label, setLabel] = useState(initialLocation.label);
  const [subtitle, setSubtitle] = useState(initialLocation.subtitle);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const pickerPurpose = params.purpose === "address" ? "address" : "delivery";

  const pinLift = useRef(new Animated.Value(0)).current;
  const pinPulse = useRef(new Animated.Value(1)).current;
  const pinBob = useRef(new Animated.Value(0)).current;
  const pinHalo = useRef(new Animated.Value(0)).current;
  const currentPulse = useRef(new Animated.Value(1)).current;

  const isFallbackLocation = (location: typeof initialLocation) =>
    location.label === defaultDeliveryLocation.label &&
    location.subtitle === defaultDeliveryLocation.subtitle &&
    Math.abs(location.latitude - defaultDeliveryLocation.latitude) < 0.0001 &&
    Math.abs(location.longitude - defaultDeliveryLocation.longitude) < 0.0001;

  useEffect(() => {
    const resolveInitialLocation = async () => {
      if (!isFallbackLocation(initialLocation)) {
        void reverseGeocode(initialLatitude, initialLongitude);
        return;
      }

      setLocating(true);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          void reverseGeocode(initialLatitude, initialLongitude);
          return;
        }

        const position =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        if (!position) {
          void reverseGeocode(initialLatitude, initialLongitude);
          return;
        }

        applyRegion(position.coords.latitude, position.coords.longitude, {
          animated: false,
          zoom: INITIAL_CAMERA_ZOOM,
        });
      } catch {
        void reverseGeocode(initialLatitude, initialLongitude);
      } finally {
        setLocating(false);
      }
    };

    void resolveInitialLocation();

    return () => {
      if (reverseGeocodeTimer.current) {
        clearTimeout(reverseGeocodeTimer.current);
      }
    };
    // This bootstraps the picker from the initial saved/default location once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const bobAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pinBob, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pinBob, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const haloAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pinHalo, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pinHalo, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    bobAnimation.start();
    haloAnimation.start();

    return () => {
      bobAnimation.stop();
      haloAnimation.stop();
    };
  }, [pinBob, pinHalo]);

  const startDraggingPin = () => {
    if (isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = true;

    Animated.parallel([
      Animated.timing(pinLift, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pinPulse, {
            toValue: 1.08,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pinPulse, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  };

  const stopDraggingPin = () => {
    isDraggingRef.current = false;
    pinPulse.stopAnimation(() => {
      pinPulse.setValue(1);
    });

    Animated.timing(pinLift, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    setLoadingAddress(true);

    try {
      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const place = places[0];

      if (place) {
        const mainLabel =
          [place.name, place.street].filter(Boolean).join(", ") ||
          [place.district, place.city].filter(Boolean).join(", ") ||
          `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        const subLabel =
          [place.city, place.region, place.country]
            .filter(Boolean)
            .join(", ") || "Selected on map";

        setLabel(mainLabel);
        setSubtitle(subLabel);
      } else {
        setLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setSubtitle("Selected on map");
      }
    } catch {
      setLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setSubtitle("Selected on map");
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleRegionChange = () => {
    startDraggingPin();
  };

  const handleRegionChangeComplete = (nextRegion: Region) => {
    stopDraggingPin();
    setRegion(nextRegion);

    if (reverseGeocodeTimer.current) {
      clearTimeout(reverseGeocodeTimer.current);
    }

    reverseGeocodeTimer.current = setTimeout(() => {
      void reverseGeocode(nextRegion.latitude, nextRegion.longitude);
    }, 320);
  };

  const focusCamera = (
    latitude: number,
    longitude: number,
    animated = true,
    zoom = INITIAL_CAMERA_ZOOM,
  ) => {
    const camera = {
      center: { latitude, longitude },
      zoom,
      heading: 0,
      pitch: 0,
    };

    if (animated) {
      mapRef.current?.animateCamera(camera, { duration: 350 });
      return;
    }

    mapRef.current?.setCamera(camera);
  };

  const applyRegion = (
    latitude: number,
    longitude: number,
    {
      animated = true,
      zoom = INITIAL_CAMERA_ZOOM,
      refreshAddress = true,
    }: {
      animated?: boolean;
      zoom?: number;
      refreshAddress?: boolean;
    } = {},
  ) => {
    const nextRegion = {
      latitude,
      longitude,
      ...DEFAULT_DELTA,
    };

    setRegion(nextRegion);

    if (mapReadyRef.current) {
      focusCamera(latitude, longitude, animated, zoom);
    }

    if (refreshAddress) {
      void reverseGeocode(latitude, longitude);
    }
  };

  const goToCurrentLocation = async () => {
    setLocating(true);
    Animated.sequence([
      Animated.timing(currentPulse, {
        toValue: 1.08,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(currentPulse, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Location access needed",
          "Please allow location permission so we can center the map on your current position.",
        );
        return;
      }

      const position =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));

      if (!position) {
        Alert.alert(
          "Location unavailable",
          "We couldn't determine your current location.",
        );
        return;
      }

      applyRegion(position.coords.latitude, position.coords.longitude, {
        animated: true,
        zoom: INITIAL_CAMERA_ZOOM,
      });

      if (user) {
        void updateDeviceLocationMutation
          .mutateAsync({
            label: "Current device location",
            subtitle: "Updated from device GPS",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          .catch(() => undefined);
      }
    } catch {
      Alert.alert(
        "Something went wrong",
        "Unable to fetch your current location right now.",
      );
    } finally {
      setLocating(false);
    }
  };

  const confirmLocation = () => {
    const nextLocation = {
      label,
      subtitle,
      latitude: region.latitude,
      longitude: region.longitude,
    };

    if (pickerPurpose === "address") {
      setPendingPickedLocation(nextLocation);
      router.back();
      return;
    }

    setDeliveryLocation(nextLocation);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#20263A" />
          </Pressable>
          <Pressable style={styles.headerLocateButton} onPress={goToCurrentLocation}>
            {locating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="locate" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.headerLocateText}>Current</Text>
          </Pressable>
        </View>
        <Text style={styles.headerTitle}>Choose your spot</Text>
        <Text style={styles.headerSubtitle}>
          Drag the map and keep the pin in the center.
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialCamera={{
            center: {
              latitude: initialLatitude,
              longitude: initialLongitude,
            },
            zoom: INITIAL_CAMERA_ZOOM,
            heading: 0,
            pitch: 0,
          }}
          minZoomLevel={MIN_CAMERA_ZOOM}
          maxZoomLevel={MAX_CAMERA_ZOOM}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={() => {
            if (hasResolvedInitialCamera.current) {
              return;
            }

            mapReadyRef.current = true;
            hasResolvedInitialCamera.current = true;
            focusCamera(
              region.latitude,
              region.longitude,
              false,
              INITIAL_CAMERA_ZOOM,
            );
          }}
          showsCompass={false}
          toolbarEnabled={false}
          showsBuildings
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation
          showsMyLocationButton={false}
        />

        <View style={styles.mapTopBadge}>
          <Ionicons name="radio-button-on-outline" size={14} color="#24314A" />
          <Text style={styles.mapTopBadgeText}>Pin stays in the middle</Text>
        </View>

        <View pointerEvents="none" style={styles.centerPinWrap}>
          <Animated.View
            style={[
              styles.pinShadow,
              {
                transform: [
                  {
                    scale: pinLift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.74],
                    }),
                  },
                ],
                opacity: pinLift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.22, 0.12],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pinHalo,
              {
                transform: [
                  {
                    scale: pinHalo.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.72, 1.42],
                    }),
                  },
                ],
                opacity: pinHalo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pinIconWrap,
              {
                transform: [
                  {
                    translateY: pinLift.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -16],
                    }),
                  },
                  {
                    translateY: pinBob.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    }),
                  },
                  { scale: pinPulse },
                ],
              },
            ]}
          >
            <Ionicons name="location" size={40} color="#FF5D8F" />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.currentLocationFab,
            {
              transform: [{ scale: currentPulse }],
            },
          ]}
        >
          <Pressable
            style={styles.currentLocationFabInner}
            onPress={goToCurrentLocation}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#24314A" />
            ) : (
              <Ionicons name="navigate" size={22} color="#24314A" />
            )}
          </Pressable>
        </Animated.View>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.bottomTopRow}>
          <View style={styles.bottomIcon}>
            <Ionicons name="pin" size={18} color="#24314A" />
          </View>
          <View style={styles.bottomCopy}>
            <Text style={styles.bottomLabel}>Selected location</Text>
            <Text style={styles.bottomTitle}>{label}</Text>
            <Text style={styles.bottomSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.coordinateRow}>
          <Text style={styles.coordinateText}>
            {region.latitude.toFixed(5)}, {region.longitude.toFixed(5)}
          </Text>
          {loadingAddress ? (
            <View style={styles.statusPill}>
              <ActivityIndicator size="small" color="#24314A" />
              <Text style={styles.statusPillText}>Updating</Text>
            </View>
          ) : (
            <View style={styles.statusPill}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#24314A"
              />
              <Text style={styles.statusPillText}>Ready</Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.confirmButton}
          onPress={confirmLocation}
        >
          <Text style={styles.confirmButtonLabel}>Use this location</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  headerLocateButton: {
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#5C7CFA",
  },
  headerLocateText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#20263A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#7B6F69",
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 14,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(32,38,58,0.06)",
  },
  map: {
    flex: 1,
  },
  mapTopBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  mapTopBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  centerPinWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    alignItems: "center",
    marginTop: -34,
  },
  pinIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5D8F",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pinHalo: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 93, 143, 0.28)",
  },
  pinShadow: {
    position: "absolute",
    bottom: -6,
    width: 24,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
  currentLocationFab: {
    position: "absolute",
    right: 14,
    bottom: 16,
  },
  currentLocationFabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  bottomCard: {
    margin: 14,
    marginTop: 12,
    padding: 18,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    gap: 14,
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  bottomTopRow: {
    flexDirection: "row",
    gap: 12,
  },
  bottomIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  bottomCopy: {
    flex: 1,
    gap: 4,
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7B6F69",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#20263A",
  },
  bottomSubtitle: {
    fontSize: 13,
    color: "#7B6F69",
  },
  coordinateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  coordinateText: {
    fontSize: 12,
    color: "#7B6F69",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF1CC",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  confirmButton: {
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  confirmButtonLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
