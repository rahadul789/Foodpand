import { useEffect } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { useAuthStore } from "@/lib/auth-store";
import {
  acceptDeliveryOrder,
  getAssignedDeliveryOrders,
  getAvailableDeliveryOrders,
  type DeliveryOrder,
  updateDeliveryOrderStatus,
} from "@/lib/order-api";
import { disconnectDeliverySocket, getDeliverySocket } from "@/lib/socket";

type DeliveryRealtimePayload = {
  type: string;
  order?: DeliveryOrder;
};

function syncDeliveryOrders(queryClient: QueryClient, order: DeliveryOrder) {
  queryClient.setQueryData<DeliveryOrder[]>(["delivery", "available"], (current = []) => {
    if (order.status === "Ready for pickup") {
      const exists = current.some((item) => item.id === order.id);

      if (exists) {
        return current.map((item) => (item.id === order.id ? order : item));
      }

      return [order, ...current];
    }

    return current.filter((item) => item.id !== order.id);
  });

  queryClient.setQueryData<DeliveryOrder[]>(["delivery", "assigned"], (current = []) => {
    const shouldKeep = order.status === "Ready for pickup" || order.status === "On the way";

    if (!shouldKeep) {
      return current.filter((item) => item.id !== order.id);
    }

    const exists = current.some((item) => item.id === order.id);
    if (exists) {
      return current.map((item) => (item.id === order.id ? order : item));
    }

    return [order, ...current];
  });
}

function invalidateDeliveryQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["delivery", "available"] });
  void queryClient.invalidateQueries({ queryKey: ["delivery", "assigned"] });
}

export function useAvailableDeliveryOrdersQuery(enabled: boolean) {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["delivery", "available"],
    queryFn: () => getAvailableDeliveryOrders(token ?? ""),
    enabled: enabled && Boolean(token),
  });
}

export function useAssignedDeliveryOrdersQuery(enabled: boolean) {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["delivery", "assigned"],
    queryFn: () => getAssignedDeliveryOrders(token ?? ""),
    enabled: enabled && Boolean(token),
    refetchInterval: (query) => {
      const orders = query.state.data ?? [];
      return orders.some((order) => order.status === "On the way") ? 20_000 : 45_000;
    },
  });
}

export function useAcceptDeliveryMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => acceptDeliveryOrder(orderId, token ?? ""),
    onSuccess: (order) => {
      syncDeliveryOrders(queryClient, order);
      invalidateDeliveryQueries(queryClient);
    },
  });
}

export function useDeliveryOrderStatusMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: { status: "On the way" | "Delivered" };
    }) => updateDeliveryOrderStatus(orderId, payload, token ?? ""),
    onSuccess: (order) => {
      syncDeliveryOrders(queryClient, order);
      invalidateDeliveryQueries(queryClient);
    },
  });
}

export function useDeliveryOrdersRealtime(enabled = true) {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => Boolean(state.user?.id && state.accessToken));

  useEffect(() => {
    if (!enabled || !token || !isAuthenticated) {
      disconnectDeliverySocket();
      return undefined;
    }

    const socket = getDeliverySocket(token);
    const handleOrdersChanged = (payload: DeliveryRealtimePayload) => {
      if (payload.order) {
        syncDeliveryOrders(queryClient, payload.order);
        return;
      }

      invalidateDeliveryQueries(queryClient);
    };

    socket.on("delivery:orders:changed", handleOrdersChanged);

    return () => {
      socket.off("delivery:orders:changed", handleOrdersChanged);
      disconnectDeliverySocket();
    };
  }, [enabled, isAuthenticated, queryClient, token]);
}
