import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { queryClient } from "@/lib/query-client";

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthBootstrap />
          {hasHydrated ? (
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
              }}
            />
          ) : null}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
