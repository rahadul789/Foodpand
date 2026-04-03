import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  registerPushTokenRequest,
  unregisterPushTokenRequest,
} from "@/lib/auth-api";

const CUSTOMER_APP_ID = "customer-app";

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

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FFB100",
  });
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
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
    throw new Error("Expo projectId is missing. Set EXPO_PUBLIC_EAS_PROJECT_ID or use an EAS-linked build.");
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return {
    token: pushToken.data,
    platform: Platform.OS === "ios" ? ("ios" as const) : ("android" as const),
    appId: CUSTOMER_APP_ID,
  };
}

export async function syncPushTokenWithBackend(accessToken: string) {
  const payload = await registerForPushNotificationsAsync();

  if (!payload) {
    return null;
  }

  await registerPushTokenRequest(payload, accessToken);
  return payload.token;
}

export async function removePushTokenFromBackend(
  accessToken: string,
  pushToken: string | null,
) {
  if (!pushToken) {
    return;
  }

  await unregisterPushTokenRequest(
    {
      token: pushToken,
      appId: CUSTOMER_APP_ID,
    },
    accessToken,
  );
}
