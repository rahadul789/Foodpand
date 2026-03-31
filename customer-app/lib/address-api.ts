import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";

export type DeliveryLocationPayload = {
  label: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

export type SavedAddressDto = DeliveryLocationPayload & {
  id: string;
  name: string;
  isSelected: boolean;
};

export type AddressesBootstrapDto = {
  selectedDeliveryLocation: (DeliveryLocationPayload & {
    savedAddressId?: string | null;
    updatedAt?: string | null;
  }) | null;
  currentDeviceLocation: DeliveryLocationPayload | null;
  addresses: SavedAddressDto[];
  maxSavedAddresses: number;
};

export type SaveAddressPayload = DeliveryLocationPayload & {
  name: string;
};

export async function getAddressesRequest() {
  const response = await apiGet<AddressesBootstrapDto>("/api/v1/addresses");
  return response.data;
}

export async function createAddressRequest(payload: SaveAddressPayload) {
  const response = await apiPost<SavedAddressDto>("/api/v1/addresses", payload);
  return response.data;
}

export async function updateAddressRequest(
  id: string,
  payload: SaveAddressPayload,
) {
  const response = await apiPatch<SavedAddressDto>(`/api/v1/addresses/${id}`, payload);
  return response.data;
}

export async function deleteAddressRequest(id: string) {
  const response = await apiDelete<{ id: string }>(`/api/v1/addresses/${id}`);
  return response.data;
}

export async function updateSelectedDeliveryLocationRequest(
  payload: DeliveryLocationPayload & { addressId?: string },
) {
  const response = await apiPatch<AddressesBootstrapDto["selectedDeliveryLocation"]>(
    "/api/v1/addresses/selected",
    payload,
  );
  return response.data;
}

export async function updateCurrentDeviceLocationRequest(
  payload: DeliveryLocationPayload,
) {
  const response = await apiPatch<AddressesBootstrapDto["currentDeviceLocation"]>(
    "/api/v1/addresses/device-location",
    payload,
  );
  return response.data;
}
