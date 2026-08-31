import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthTokenProvider } from "@/lib/auth/token";

// Use environment variables - these should be set in your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter using SecureStore for native and AsyncStorage for web
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

let tokenProvider: AuthTokenProvider | null = null;

export function setSupabaseAuthTokenProvider(provider: AuthTokenProvider) {
  tokenProvider = provider;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Do NOT persist Supabase sessions; we use external Clerk JWTs
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    // Inject Clerk-signed JWT into every Supabase request
    fetch: async (url, options) => {
      const headers = new Headers(options?.headers ?? {});
      if (tokenProvider) {
        const token = await tokenProvider();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return fetch(url, { ...options, headers });
    },
  },
});
