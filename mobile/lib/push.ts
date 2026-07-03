import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { apiFetch } from "./api";

const TOKEN_KEY = "kk-push-token";

/**
 * Register this device for Expo push notifications and store the token
 * server-side (B4). Fails soft everywhere push can't work: web, simulators,
 * Expo Go on Android (no remote push since SDK 53), missing EAS projectId,
 * or denied permission — the app just runs without push.
 */
export async function registerPushToken(): Promise<void> {
  if (Platform.OS === "web") return; // expo-notifications is native-only
  try {
    const Device = await import("expo-device");
    if (!Device.isDevice) return; // emulators can't receive push

    const Notifications = await import("expo-notifications");

    // Android 13+ requires a channel to exist before the permission prompt
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return;

    // getExpoPushTokenAsync defaults to Constants.expoConfig.extra.eas.projectId;
    // pass it explicitly so the failure mode is obvious when it's missing.
    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : {}
    );

    const res = await apiFetch("/api/push-tokens", {
      method: "POST",
      body: { token, platform: Platform.OS },
    });
    if (res.ok) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    // Expected in Expo Go / unconfigured EAS — push stays off
    console.log("[push] registration skipped:", e);
  }
}

/** Unregister the stored token on logout so a shared device stops buzzing. */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await apiFetch("/api/push-tokens", {
      method: "DELETE",
      body: { token },
    });
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Best effort — dead tokens get pruned server-side anyway
  }
}
