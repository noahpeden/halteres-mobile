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

  // For local development only
  if (__DEV__) {
    // If env is set to a non-localhost URL, use it (e.g., testing against production)
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("10.0.2.2")) {
      return envUrl;
    }
    // Otherwise use localhost with platform-appropriate address
    if (Platform.OS === "android") {
      // Android emulator uses 10.0.2.2 to reach host's localhost
      return "http://10.0.2.2:3000";
    }
    // iOS simulator can use localhost
    return "http://localhost:3000";
  }

  // Production: always use production URL, ignore any localhost env vars
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("10.0.2.2")) {
    return envUrl;
  }

  // Production fallback
  return "https://app.halteres.ai";
}

export const API_BASE = getApiUrl();
