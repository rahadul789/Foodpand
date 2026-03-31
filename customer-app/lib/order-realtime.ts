import { useEffect } from "react";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { Order } from "@/lib/customer-data";
import { syncOrderCaches } from "@/lib/order-queries";

type OrderRealtimePayload = {
  type: string;
  order?: Order;
};

const SOCKET_BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || API_BASE_URL;

let customerSocket: Socket | null = null;
let currentSocketToken: string | null = null;

function ensureCustomerSocket(token: string) {
  if (!SOCKET_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_SOCKET_URL is not configured.");
  }

  if (customerSocket && currentSocketToken === token) {
    return customerSocket;
  }

  if (customerSocket) {
    customerSocket.disconnect();
  }

  customerSocket = io(SOCKET_BASE_URL, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });
  currentSocketToken = token;

  return customerSocket;
}

export function disconnectCustomerOrderSocket() {
  if (customerSocket) {
    customerSocket.disconnect();
    customerSocket = null;
  }

  currentSocketToken = null;
}

function handleRealtimeOrderUpdate(queryClient: QueryClient, payload: OrderRealtimePayload) {
  if (payload.order) {
    syncOrderCaches(queryClient, payload.order);
    return;
  }

  void queryClient.invalidateQueries({ queryKey: ["orders", "active"] });
  void queryClient.invalidateQueries({ queryKey: ["orders", "history"] });
}

export function useCustomerOrderRealtime(enabled = true) {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => Boolean(state.user?.id && state.accessToken));

  useEffect(() => {
    if (!enabled || !token || !isAuthenticated) {
      disconnectCustomerOrderSocket();
      return undefined;
    }

    const socket = ensureCustomerSocket(token);
    const handleOrdersChanged = (payload: OrderRealtimePayload) => {
      handleRealtimeOrderUpdate(queryClient, payload);
    };

    socket.on("customer:orders:changed", handleOrdersChanged);

    return () => {
      socket.off("customer:orders:changed", handleOrdersChanged);
      disconnectCustomerOrderSocket();
    };
  }, [enabled, isAuthenticated, queryClient, token]);
}
