import { Platform } from "react-native";

/**
 * Gets the correct API URL based on platform
 *
 * Android emulator uses 10.0.2.2 to reach the host machine's localhost
 * iOS simulator can use localhost directly
 * Physical devices need the actual network IP or production URL
 */
export function getApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // If pointing to production, use as-is
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }

  // For local development
  if (__DEV__) {
    if (Platform.OS === "android") {
      // Android emulator uses 10.0.2.2 to reach host's localhost
      return "http://10.0.2.2:3000";
    }
    // iOS simulator can use localhost
    return "http://localhost:3000";
  }

  // Production fallback
  return envUrl || "https://halteres.ai";
}

export const API_BASE = getApiUrl();
