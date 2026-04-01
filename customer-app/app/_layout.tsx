import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { GuideBuddyOverlay } from "@/components/guide-buddy";
import { useAddressesQuery } from "@/lib/address-queries";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import { resetGuestLocations, syncLocationsFromBackend } from "@/lib/location-store";
import { queryClient } from "@/lib/query-client";
import { useUIStore } from "@/lib/ui-store";

function GlobalToast() {
  const visible = useUIStore((state) => state.visible);
  const message = useUIStore((state) => state.message);
  const hideToast = useUIStore((state) => state.hideToast);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      hideToast();
    }, 2200);

    return () => clearTimeout(timer);
  }, [hideToast, visible]);

  if (!visible || !message) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.toastWrap}>
      <View style={styles.toast}>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </View>
  );
}

function GlobalCartSwitchModal() {
  const router = useRouter();
  const pendingCartSwitch = useCartStore((state) => state.pendingCartSwitch);
  const confirmPendingCartSwitch = useCartStore(
    (state) => state.confirmPendingCartSwitch,
  );
  const cancelPendingCartSwitch = useCartStore(
    (state) => state.cancelPendingCartSwitch,
  );

  if (!pendingCartSwitch) {
    return null;
  }

  const isOrderReplace = pendingCartSwitch.mode === "order";

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={cancelPendingCartSwitch}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={cancelPendingCartSwitch} />
        <View style={styles.modalCard}>
          <View style={styles.modalIcon}>
            <Text style={styles.modalIconText}>!</Text>
          </View>
          <Text style={styles.modalTitle}>
            {isOrderReplace ? "Replace cart with this order?" : "Replace current cart?"}
          </Text>
          <Text style={styles.modalText}>
            {isOrderReplace
              ? `Your cart has items from ${pendingCartSwitch.currentRestaurantName}. Clear it and reorder from ${pendingCartSwitch.nextRestaurantName} instead?`
              : `Your cart has items from ${pendingCartSwitch.currentRestaurantName}. Clear it and add this item from ${pendingCartSwitch.nextRestaurantName} instead?`}
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonGhost]}
              onPress={cancelPendingCartSwitch}
            >
              <Text style={styles.modalButtonGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => {
                const redirectTo = pendingCartSwitch.redirectTo;
                confirmPendingCartSwitch();
                if (redirectTo) {
                  router.push(redirectTo as never);
                }
              }}
            >
              <Text style={styles.modalButtonPrimaryText}>
                {isOrderReplace ? "Clear and reorder" : "Clear and add"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LocationSyncGate() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const { data } = useAddressesQuery(Boolean(userId));

  useEffect(() => {
    if (userId && data) {
      syncLocationsFromBackend(data);
      return;
    }

    if (!userId) {
      resetGuestLocations();
    }
  }, [data, userId]);

  return null;
}

function AuthBootstrap() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return null;
}

export default function RootLayout() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <AuthBootstrap />
      {!hasHydrated ? null : (
        <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <LocationSyncGate />
      <GuideBuddyOverlay />
      <GlobalCartSwitchModal />
      <GlobalToast />
        </>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 25, 40, 0.34)",
  },
  modalCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#FFF7F2",
    gap: 14,
  },
  modalIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1CC",
  },
  modalIconText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFB100",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  modalText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6F6A77",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modalButtonGhost: {
    backgroundColor: "#FFFFFF",
  },
  modalButtonPrimary: {
    backgroundColor: "#FFB100",
  },
  modalButtonGhostText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#20263A",
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: "center",
  },
  toast: {
    maxWidth: "100%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#20263A",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
