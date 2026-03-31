import { useSyncExternalStore } from "react";

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

let currentLocation: DeliveryLocation = defaultDeliveryLocation;

let savedLocationsState: SavedLocation[] = [
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

function emitChange() {
  listeners.forEach((listener) => listener());
}

function createSavedLocationId() {
  return `saved-${Date.now()}`;
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

export function setDeliveryLocation(location: DeliveryLocation) {
  currentLocation = location;
  emitChange();
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
