import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  useAddressesQuery,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useSelectDeliveryLocationMutation,
  useUpdateAddressMutation,
} from "@/lib/address-queries";
import { useAuthStore } from "@/lib/auth-store";
import {
  MAX_SAVED_LOCATIONS,
  getDeliveryLocation,
  setPendingPickedLocation,
  setDeliveryLocation,
  type SavedLocation,
  useDeliveryLocation,
  usePendingPickedLocation,
  useSavedLocations,
} from "@/lib/location-store";
import { useUIStore } from "@/lib/ui-store";

type EditorState = {
  id?: string;
  name: string;
  label: string;
  subtitle: string;
  latitude: number;
  longitude: number;
};

function buildDraft(location?: SavedLocation): EditorState {
  const current = getDeliveryLocation();

  if (location) {
    return {
      id: location.id,
      name: location.name,
      label: location.label,
      subtitle: location.subtitle,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  return {
    name: "New place",
    label: current.label,
    subtitle: current.subtitle,
    latitude: current.latitude,
    longitude: current.longitude,
  };
}

export default function SavedAddressesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useUIStore((state) => state.showToast);
  const currentLocation = useDeliveryLocation();
  const pendingPickedLocation = usePendingPickedLocation();
  const savedLocations = useSavedLocations();
  const { data: addressData, isLoading } = useAddressesQuery(Boolean(user));
  const createAddressMutation = useCreateAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();
  const selectDeliveryLocationMutation = useSelectDeliveryLocationMutation();

  const [editorVisible, setEditorVisible] = useState(false);
  const [draft, setDraft] = useState<EditorState>(buildDraft());
  const isSavingAddress =
    createAddressMutation.isPending || updateAddressMutation.isPending;
  const isRemovingAddress = deleteAddressMutation.isPending;
  const isSelectingAddress = selectDeliveryLocationMutation.isPending;

  const maxSavedAddresses = addressData?.maxSavedAddresses ?? MAX_SAVED_LOCATIONS;
  const canAddMore = savedLocations.length < maxSavedAddresses;
  const editorTitle = draft.id ? "Update address" : "Add address";

  useEffect(() => {
    if (!editorVisible || draft.id) {
      return;
    }

    const current = getDeliveryLocation();
    setDraft((prev) => ({
      ...prev,
      label: current.label,
      subtitle: current.subtitle,
      latitude: current.latitude,
      longitude: current.longitude,
    }));
  }, [draft.id, editorVisible]);

  useEffect(() => {
    if (!editorVisible || !pendingPickedLocation) {
      return;
    }

    setDraft((prev) => ({
      ...prev,
      label: pendingPickedLocation.label,
      subtitle: pendingPickedLocation.subtitle,
      latitude: pendingPickedLocation.latitude,
      longitude: pendingPickedLocation.longitude,
    }));
    setPendingPickedLocation(null);
  }, [editorVisible, pendingPickedLocation]);

  const locationMeta = useMemo(
    () => `${savedLocations.length}/${maxSavedAddresses} saved`,
    [maxSavedAddresses, savedLocations.length],
  );

  const openAddEditor = () => {
    if (!canAddMore) {
      showToast(`You can save up to ${maxSavedAddresses} addresses only.`);
      return;
    }

    setDraft(buildDraft());
    setEditorVisible(true);
  };

  const openEditEditor = (location: SavedLocation) => {
    setDraft(buildDraft(location));
    setEditorVisible(true);
  };

  const handleUseCurrentLocation = () => {
    const current = getDeliveryLocation();

    setDraft((prev) => ({
      ...prev,
      label: current.label,
      subtitle: current.subtitle,
      latitude: current.latitude,
      longitude: current.longitude,
    }));
  };

  const handleChooseFromMap = () => {
    router.push({
      pathname: "/location-picker",
      params: {
        purpose: "address",
        latitude: String(draft.latitude),
        longitude: String(draft.longitude),
        label: draft.label,
        subtitle: draft.subtitle,
      },
    });
  };

  const handleSave = async () => {
    try {
      if (draft.id) {
        const previousLocation = savedLocations.find(
          (location) => location.id === draft.id,
        );
        const previousSelectedLocation = currentLocation;
        const nextLocation = {
          id: draft.id,
          name: draft.name.trim(),
          label: draft.label.trim(),
          subtitle: draft.subtitle.trim(),
          latitude: draft.latitude,
          longitude: draft.longitude,
        };
        const wasSelected = previousLocation
          ? currentLocation.label === previousLocation.label &&
            currentLocation.subtitle === previousLocation.subtitle &&
            Math.abs(currentLocation.latitude - previousLocation.latitude) <
              0.000001 &&
            Math.abs(currentLocation.longitude - previousLocation.longitude) <
              0.000001
          : false;

        await updateAddressMutation.mutateAsync({
          id: draft.id,
          payload: {
            name: draft.name,
            label: draft.label,
            subtitle: draft.subtitle,
            latitude: draft.latitude,
            longitude: draft.longitude,
          },
        });

        if (wasSelected) {
          setDeliveryLocation(nextLocation);
          try {
            await selectDeliveryLocationMutation.mutateAsync({
              addressId: nextLocation.id,
              label: nextLocation.label,
              subtitle: nextLocation.subtitle,
              latitude: nextLocation.latitude,
              longitude: nextLocation.longitude,
            });
          } catch (error) {
            setDeliveryLocation(previousSelectedLocation);
            throw error;
          }
        }

        showToast("Saved address updated.");
      } else {
        await createAddressMutation.mutateAsync({
          name: draft.name,
          label: draft.label,
          subtitle: draft.subtitle,
          latitude: draft.latitude,
          longitude: draft.longitude,
        });
        showToast("Address saved.");
      }

      setEditorVisible(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save address.",
      );
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteAddressMutation.mutateAsync(id);
      showToast("Address removed.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to remove address.",
      );
    }
  };

  const handleUseNow = async (location: SavedLocation) => {
    const previousLocation = currentLocation;
    setDeliveryLocation(location);

    try {
      await selectDeliveryLocationMutation.mutateAsync({
        addressId: location.id,
        label: location.label,
        subtitle: location.subtitle,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      showToast("Delivery location updated.");
    } catch (error) {
      setDeliveryLocation(previousLocation);
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to update delivery location.",
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar style="dark" backgroundColor="#FFF7F2" />
        <View style={styles.guestWrap}>
          <View style={styles.guestBubble}>
            <Ionicons name="location-outline" size={28} color="#20263A" />
          </View>
          <Text style={styles.guestTitle}>Login to manage addresses</Text>
          <Text style={styles.guestText}>
            Save, update, and remove delivery addresses after login.
          </Text>
          <Pressable
            style={styles.guestButton}
            onPress={() =>
              router.push({
                pathname: "/login",
                params: { redirectTo: "/saved-addresses" },
              })
            }
          >
            <Text style={styles.guestButtonText}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#FFF7F2" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#20263A" />
          </Pressable>
          <Text style={styles.topTitle}>Saved addresses</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBlobOne} />
          <View style={styles.heroBlobTwo} />
          <Text style={styles.heroTitle}>Delivery places</Text>
          <Text style={styles.heroText}>
            Keep up to three saved locations for faster checkout.
          </Text>
          <View style={styles.heroPill}>
            <Ionicons name="bookmark-outline" size={14} color="#24314A" />
            <Text style={styles.heroPillText}>{locationMeta}</Text>
          </View>
        </View>

        <Pressable
          style={[styles.addButton, !canAddMore && styles.addButtonDisabled]}
          onPress={openAddEditor}
        >
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add new address</Text>
        </Pressable>

        <View style={styles.list}>
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#24314A" />
              <Text style={styles.loadingText}>Loading saved addresses...</Text>
            </View>
          ) : null}

          {savedLocations.map((location) => (
            <View
              key={location.id}
              style={[
                styles.card,
                currentLocation.label === location.label &&
                currentLocation.subtitle === location.subtitle
                  ? styles.cardSelected
                  : null,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="location" size={18} color="#24314A" />
                </View>
                <View style={styles.cardCopy}>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardName}>{location.name}</Text>
                    {currentLocation.label === location.label &&
                    currentLocation.subtitle === location.subtitle ? (
                      <View style={styles.selectedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color="#1F9D57"
                        />
                        <Text style={styles.selectedBadgeText}>Selected</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.cardLabel}>{location.label}</Text>
                  <Text style={styles.cardSubtitle}>{location.subtitle}</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={styles.secondaryAction}
                  disabled={isSelectingAddress}
                  onPress={() => handleUseNow(location)}
                >
                  <Ionicons name="navigate-outline" size={16} color="#24314A" />
                  <Text style={styles.secondaryActionText}>Use now</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryAction}
                  disabled={isSavingAddress}
                  onPress={() => openEditEditor(location)}
                >
                  <Ionicons name="create-outline" size={16} color="#24314A" />
                  <Text style={styles.secondaryActionText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={[styles.secondaryAction, styles.secondaryActionDanger]}
                  disabled={isRemovingAddress}
                  onPress={() => handleRemove(location.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF5D8F" />
                  <Text style={styles.secondaryActionDangerText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={editorVisible}
        onRequestClose={() => setEditorVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setEditorVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editorTitle}</Text>
            <Text style={styles.modalText}>
              Use the current selected location or type your own details.
            </Text>

            <FieldLabel label="Place name" />
            <View style={styles.inputWrap}>
              <Ionicons name="bookmark-outline" size={18} color="#8D8178" />
              <TextInput
                value={draft.name}
                onChangeText={(value) =>
                  setDraft((prev) => ({ ...prev, name: value }))
                }
                placeholder="Home, Work, Other"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </View>

            <FieldLabel label="Address line" />
            <View style={styles.inputWrap}>
              <Ionicons name="home-outline" size={18} color="#8D8178" />
              <TextInput
                value={draft.label}
                onChangeText={(value) =>
                  setDraft((prev) => ({ ...prev, label: value }))
                }
                placeholder="House, road, area"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </View>

            <FieldLabel label="Area / city" />
            <View style={styles.inputWrap}>
              <Ionicons name="business-outline" size={18} color="#8D8178" />
              <TextInput
                value={draft.subtitle}
                onChangeText={(value) =>
                  setDraft((prev) => ({ ...prev, subtitle: value }))
                }
                placeholder="City or area"
                placeholderTextColor="#A39990"
                style={styles.input}
              />
            </View>

            <Pressable
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
            >
              <Ionicons name="locate-outline" size={16} color="#24314A" />
              <Text style={styles.currentLocationButtonText}>
                Use current selected location
              </Text>
            </Pressable>

            <Pressable style={styles.mapButton} onPress={handleChooseFromMap}>
              <Ionicons name="map-outline" size={16} color="#24314A" />
              <Text style={styles.mapButtonText}>Choose from map</Text>
            </Pressable>

            <Text style={styles.coordinateText}>
              {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
            </Text>

            <Pressable style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>
                {isSavingAddress ? "Saving..." : "Save address"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 18,
  },
  topRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#20263A",
  },
  placeholder: {
    width: 44,
  },
  heroCard: {
    borderRadius: 34,
    padding: 20,
    backgroundColor: "#FFE3D8",
    overflow: "hidden",
    gap: 10,
  },
  heroBlobOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#FF7A59",
    opacity: 0.15,
    top: -48,
    right: -34,
  },
  heroBlobTwo: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#FFD166",
    opacity: 0.28,
    bottom: -30,
    left: -18,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#20263A",
  },
  heroText: {
    maxWidth: 260,
    fontSize: 14,
    lineHeight: 20,
    color: "#7B6F69",
  },
  heroPill: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.84)",
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#24314A",
  },
  addButton: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#5C7CFA",
  },
  addButtonDisabled: {
    opacity: 0.55,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  list: {
    gap: 12,
  },
  loadingCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  card: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#D9C2B2",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 14,
  },
  cardSelected: {
    borderWidth: 1,
    borderColor: "#CFEEDC",
    backgroundColor: "#F7FFFA",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#20263A",
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#20263A",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#7B6F69",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E7F8EE",
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#1F9D57",
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  secondaryAction: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#F4F0EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  secondaryActionDanger: {
    backgroundColor: "#FFE8F0",
  },
  secondaryActionDangerText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FF5D8F",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 23, 35, 0.32)",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  modalHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E3DBD4",
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20263A",
  },
  modalText: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    color: "#7B6F69",
  },
  fieldLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#6F6A77",
  },
  inputWrap: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFF7F2",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#20263A",
  },
  currentLocationButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#E8EDFF",
  },
  currentLocationButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  mapButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFF1CC",
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#24314A",
  },
  coordinateText: {
    marginTop: 10,
    fontSize: 12,
    color: "#8A7E75",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  guestWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  guestBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EDFF",
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#20263A",
    textAlign: "center",
  },
  guestText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#7B6F69",
    textAlign: "center",
  },
  guestButton: {
    minHeight: 54,
    paddingHorizontal: 22,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5D8F",
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
