import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

import { useAuthStore } from "@/lib/auth-store";
import { useDeliveryPresenceSync } from "@/lib/delivery-presence";
import { useDeliveryOrdersRealtime } from "@/lib/order-queries";
import { syncDeliveryPushTokenWithBackend } from "@/lib/push-notifications";
import { queryClient } from "@/lib/query-client";

const PUSH_TOKEN_KEY = "delivery-app-push-token";

function AuthBootstrap() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return null;
}

function PushNotificationsBootstrap() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !user || !accessToken) {
      return;
    }

    let cancelled = false;

    const syncToken = async () => {
      try {
        const token = await syncDeliveryPushTokenWithBackend(accessToken);

        if (!cancelled && token) {
          await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
        }
      } catch {
        // Push registration should not block rider usage.
      }
    };

    void syncToken();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, user]);

  useEffect(() => {
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const target =
          typeof data?.target === "string" ? data.target : undefined;

        if (target === "available-orders") {
          router.push("/");
          return;
        }

        router.push("/");
      });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  return null;
}

function AppRuntimeEffects() {
  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.user?.id && state.accessToken),
  );

  useDeliveryPresenceSync();
  useDeliveryOrdersRealtime(isAuthenticated);

  return <PushNotificationsBootstrap />;
}

export default function RootLayout() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthBootstrap />
          {hasHydrated ? (
            <>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                }}
              />
              <AppRuntimeEffects />
            </>
          ) : null}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
