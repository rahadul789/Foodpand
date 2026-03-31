import { useSyncExternalStore } from "react";

import type { AddressesBootstrapDto } from "@/lib/address-api";
import { useAuthStore } from "@/lib/auth-store";

export type DeliveryLocation = {
  label: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

export type SavedLocation = DeliveryLocation & {
  id: string;
  name: string;
};

type SaveLocationParams = {
  id?: string;
  name: string;
  label: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

const listeners = new Set<() => void>();

export const MAX_SAVED_LOCATIONS = 3;

export const defaultDeliveryLocation: DeliveryLocation = {
  label: "771/A, Sheikh-para, Nagra",
  subtitle: "Netrakona",
  latitude: 24.8833,
  longitude: 90.7278,
};

const defaultSavedLocations: SavedLocation[] = [
  {
    id: "saved-home",
    name: "Home",
    ...defaultDeliveryLocation,
  },
  {
    id: "saved-work",
    name: "Work",
    label: "College Road, Netrakona",
    subtitle: "Netrakona",
    latitude: 24.8814,
    longitude: 90.7311,
  },
  {
    id: "saved-other",
    name: "Cafe spot",
    label: "New Market Road, Netrakona",
    subtitle: "Netrakona",
    latitude: 24.8767,
    longitude: 90.7296,
  },
];

let currentLocation: DeliveryLocation = defaultDeliveryLocation;
let savedLocationsState: SavedLocation[] = defaultSavedLocations;
let backendHydrated = false;
let pendingPickedLocation: DeliveryLocation | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function locationsEqual(a: DeliveryLocation, b: DeliveryLocation) {
  return (
    a.label === b.label &&
    a.subtitle === b.subtitle &&
    Math.abs(a.latitude - b.latitude) < 0.000001 &&
    Math.abs(a.longitude - b.longitude) < 0.000001
  );
}

function savedLocationsEqual(a: SavedLocation[], b: SavedLocation[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((location, index) => {
    const next = b[index];
    return (
      location.id === next.id &&
      location.name === next.name &&
      locationsEqual(location, next)
    );
  });
}

function createSavedLocationId() {
  return `saved-${Date.now()}`;
}

function formatUserLocationLabel(location: DeliveryLocation) {
  return [location.label, location.subtitle].filter(Boolean).join(", ");
}

export function getDeliveryLocation() {
  return currentLocation;
}

export function getSavedLocations() {
  return savedLocationsState;
}

export function getSavedLocationById(id: string) {
  return savedLocationsState.find((location) => location.id === id);
}

export function getPendingPickedLocation() {
  return pendingPickedLocation;
}

export function setDeliveryLocation(location: DeliveryLocation) {
  if (locationsEqual(currentLocation, location)) {
    return;
  }

  currentLocation = location;
  const setProfileLocation = useAuthStore.getState().setProfileLocation;
  setProfileLocation(formatUserLocationLabel(location));
  emitChange();
}

export function setPendingPickedLocation(location: DeliveryLocation | null) {
  const isSame =
    pendingPickedLocation &&
    location &&
    locationsEqual(pendingPickedLocation, location);

  if ((pendingPickedLocation === null && location === null) || isSame) {
    return;
  }

  pendingPickedLocation = location;
  emitChange();
}

export function replaceSavedLocations(locations: SavedLocation[]) {
  if (savedLocationsEqual(savedLocationsState, locations)) {
    return;
  }

  savedLocationsState = locations;
  emitChange();
}

export function syncLocationsFromBackend(data: AddressesBootstrapDto) {
  const nextSavedLocations = data.addresses.map((address) => ({
    id: address.id,
    name: address.name,
    label: address.label,
    subtitle: address.subtitle,
    latitude: address.latitude,
    longitude: address.longitude,
  }));
  const nextCurrentLocation = data.selectedDeliveryLocation
    ? {
        label: data.selectedDeliveryLocation.label,
        subtitle: data.selectedDeliveryLocation.subtitle,
        latitude: data.selectedDeliveryLocation.latitude,
        longitude: data.selectedDeliveryLocation.longitude,
      }
    : data.currentDeviceLocation
      ? {
          label: data.currentDeviceLocation.label,
          subtitle: data.currentDeviceLocation.subtitle,
          latitude: data.currentDeviceLocation.latitude,
          longitude: data.currentDeviceLocation.longitude,
        }
    : currentLocation;
  const locationsChanged = !savedLocationsEqual(
    savedLocationsState,
    nextSavedLocations,
  );
  const currentChanged = !locationsEqual(currentLocation, nextCurrentLocation);

  savedLocationsState = nextSavedLocations;

  if (data.selectedDeliveryLocation) {
    currentLocation = nextCurrentLocation;
    if (currentChanged) {
      const setProfileLocation = useAuthStore.getState().setProfileLocation;
      setProfileLocation(formatUserLocationLabel(currentLocation));
    }
  }

  backendHydrated = true;

  if (locationsChanged || currentChanged) {
    emitChange();
  }
}

export function resetGuestLocations() {
  if (backendHydrated) {
    savedLocationsState = defaultSavedLocations;
    currentLocation = defaultDeliveryLocation;

    backendHydrated = false;
    emitChange();
  }
}

export function saveLocation(params: SaveLocationParams) {
  const normalizedName = params.name.trim();
  const normalizedLabel = params.label.trim();
  const normalizedSubtitle = params.subtitle.trim();

  if (!normalizedName || !normalizedLabel || !normalizedSubtitle) {
    return {
      ok: false,
      message: "Please fill all address fields.",
    };
  }

  const nextLocation: SavedLocation = {
    id: params.id ?? createSavedLocationId(),
    name: normalizedName,
    label: normalizedLabel,
    subtitle: normalizedSubtitle,
    latitude: params.latitude,
    longitude: params.longitude,
  };

  const existingIndex = savedLocationsState.findIndex(
    (location) => location.id === nextLocation.id,
  );

  if (existingIndex >= 0) {
    savedLocationsState = savedLocationsState.map((location, index) =>
      index === existingIndex ? nextLocation : location,
    );
    emitChange();

    return {
      ok: true,
      message: "Saved address updated.",
      location: nextLocation,
    };
  }

  if (savedLocationsState.length >= MAX_SAVED_LOCATIONS) {
    return {
      ok: false,
      message: `You can save up to ${MAX_SAVED_LOCATIONS} addresses only.`,
    };
  }

  savedLocationsState = [...savedLocationsState, nextLocation];
  emitChange();

  return {
    ok: true,
    message: "Address saved.",
    location: nextLocation,
  };
}

export function removeSavedLocation(id: string) {
  const exists = savedLocationsState.some((location) => location.id === id);

  if (!exists) {
    return {
      ok: false,
      message: "Address not found.",
    };
  }

  savedLocationsState = savedLocationsState.filter((location) => location.id !== id);
  emitChange();

  return {
    ok: true,
    message: "Address removed.",
  };
}

export function useDeliveryLocation() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentLocation,
    () => currentLocation,
  );
}

export function useSavedLocations() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => savedLocationsState,
    () => savedLocationsState,
  );
}

export function usePendingPickedLocation() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pendingPickedLocation,
    () => pendingPickedLocation,
  );
}
