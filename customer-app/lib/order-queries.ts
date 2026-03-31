import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Order } from "@/lib/customer-data";
import {
  cancelOrderRequest,
  createOrderRequest,
  type CreateOrderPayload,
  getActiveOrdersRequest,
  getOrderDetailRequest,
  getOrderHistoryRequest,
  getOrderQuoteRequest,
  type OrderQuotePayload,
} from "@/lib/orders-api";

function upsertOrder(list: Order[] | undefined, order: Order) {
  const next = list ? [...list] : [];
  const existingIndex = next.findIndex((entry) => entry.id === order.id);

  if (existingIndex >= 0) {
    next[existingIndex] = order;
    return next;
  }

  return [order, ...next];
}

export function syncOrderCaches(queryClient: QueryClient, order: Order) {
  const isHistory = order.status === "Delivered" || order.status === "Cancelled";

  queryClient.setQueryData<Order[]>(["orders", "active"], (current) => {
    if (isHistory) {
      return (current ?? []).filter((entry) => entry.id !== order.id);
    }

    return upsertOrder(current, order).sort(
      (left, right) =>
        new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime(),
    );
  });

  queryClient.setQueryData<Order[]>(["orders", "history"], (current) => {
    if (!isHistory) {
      return (current ?? []).filter((entry) => entry.id !== order.id);
    }

    return upsertOrder(current, order).sort(
      (left, right) =>
        new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime(),
    );
  });

  queryClient.setQueryData(["orders", "detail", order.id], order);
}

export function useActiveOrdersQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["orders", "active"],
    enabled,
    queryFn: getActiveOrdersRequest,
  });
}

export function useOrderHistoryQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["orders", "history"],
    enabled,
    queryFn: getOrderHistoryRequest,
  });
}

export function useOrderDetailQuery(orderId?: string, enabled = true) {
  return useQuery({
    queryKey: ["orders", "detail", orderId],
    enabled: enabled && Boolean(orderId),
    queryFn: () => getOrderDetailRequest(orderId as string),
  });
}

export function useOrderQuoteQuery(
  payload: OrderQuotePayload,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["orders", "quote", payload],
    enabled,
    retry: false,
    staleTime: 10_000,
    queryFn: () => getOrderQuoteRequest(payload),
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrderRequest(payload),
    onSuccess: (order) => {
      syncOrderCaches(queryClient, order);
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => cancelOrderRequest(orderId),
    onSuccess: (order) => {
      syncOrderCaches(queryClient, order);
    },
  });
}
