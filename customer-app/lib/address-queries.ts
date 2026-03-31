import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAddressRequest,
  deleteAddressRequest,
  getAddressesRequest,
  type DeliveryLocationPayload,
  type SaveAddressPayload,
  updateAddressRequest,
  updateCurrentDeviceLocationRequest,
  updateSelectedDeliveryLocationRequest,
} from "@/lib/address-api";

export function useAddressesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["addresses"],
    enabled,
    queryFn: getAddressesRequest,
  });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveAddressPayload) => createAddressRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveAddressPayload }) =>
      updateAddressRequest(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddressRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useSelectDeliveryLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeliveryLocationPayload & { addressId?: string }) =>
      updateSelectedDeliveryLocationRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      await queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    },
  });
}

export function useUpdateDeviceLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeliveryLocationPayload) =>
      updateCurrentDeviceLocationRequest(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}
