import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  registerDeliveryPushTokenRequest,
  unregisterDeliveryPushTokenRequest,
} from "@/lib/auth-api";

const DELIVERY_APP_ID = "delivery-app";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    null
  );
}

function isExpoGo() {
  return Constants.appOwnership === "expo";
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: "#F0802C",
  });
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  if (isExpoGo()) {
    return null;
  }

  await ensureAndroidChannel();

  const currentSettings = await Notifications.getPermissionsAsync();
  let finalStatus = currentSettings.status;

  if (finalStatus !== "granted") {
    const nextSettings = await Notifications.requestPermissionsAsync();
    finalStatus = nextSettings.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = getProjectId();

  if (!projectId) {
    throw new Error(
      "Expo projectId is missing. Set EXPO_PUBLIC_EAS_PROJECT_ID or use an EAS-linked build.",
    );
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return {
    token: pushToken.data,
    platform: Platform.OS === "ios" ? ("ios" as const) : ("android" as const),
    appId: DELIVERY_APP_ID,
  };
}

export async function syncDeliveryPushTokenWithBackend(accessToken: string) {
  const payload = await registerForPushNotificationsAsync();

  if (!payload) {
    return null;
  }

  await registerDeliveryPushTokenRequest(payload, accessToken);
  return payload.token;
}

export async function removeDeliveryPushTokenFromBackend(
  accessToken: string,
  pushToken: string | null,
) {
  if (!pushToken) {
    return;
  }

  await unregisterDeliveryPushTokenRequest(
    {
      token: pushToken,
      appId: DELIVERY_APP_ID,
    },
    accessToken,
  );
}
