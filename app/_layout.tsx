import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ClerkProvider } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { useAuth as useClerkAuth } from "@clerk/expo";
import { setAuthTokenProvider } from "@/lib/auth/token";
import { setSupabaseAuthTokenProvider } from "@/lib/supabase/client";

// Brand colors from web app (halteres.ai)
export const brandColors = {
  // Primary palette - Smart Blue
  smartBlue: {
    DEFAULT: "#1771dc",
    dark: "#134e93",
    medium: "#1a61b5",
    light: "#3682de",
    lightest: "#a5ceff",
    container: "#deebfd",
  },
  // Secondary palette - Helpful Orange
  helpfulOrange: {
    DEFAULT: "#ea7f49",
    dark: "#a75932",
    medium: "#c06e44",
    light: "#ed9264",
    lightest: "#ffd2bb",
    container: "#fff4ed",
  },
  // Accent palette - Thriving Green
  thrivingGreen: {
    DEFAULT: "#3c8f73",
    dark: "#2d6955",
    medium: "#3d846c",
    light: "#65a790",
    lightest: "#bfe8d9",
    container: "#e8f5f0",
  },
  // Warning palette - Never Preachy Peach
  peach: {
    DEFAULT: "#ffcc7b",
    dark: "#bf9147",
    medium: "#ddad61",
    light: "#ffd592",
    lightest: "#ffeed3",
    container: "#fff8eb",
  },
  // Neutral palette - Practical Gray
  practicalGray: {
    DEFAULT: "#6f879a",
    dark: "#35546c",
    medium: "#526f86",
    light: "#7995a9",
    lighter: "#e2e8eb",
    lightest: "#c4d1db",
    container: "#f5f7f9",
  },
  // Semantic colors
  error: "#e74444",
  errorContainer: "#fee2e2",
  success: "#188038",
  successContainer: "#d1fae5",
  // Backgrounds
  background: "#f9fbff",
  surface: "#ffffff",
  surfaceVariant: "#f5f4f0",
};

// Custom theme matching Halteres brand
const theme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    // Primary - Smart Blue
    primary: brandColors.smartBlue.DEFAULT,
    primaryContainer: brandColors.smartBlue.container,
    onPrimary: "#ffffff",
    onPrimaryContainer: brandColors.smartBlue.dark,
    // Secondary - Helpful Orange
    secondary: brandColors.helpfulOrange.DEFAULT,
    secondaryContainer: brandColors.helpfulOrange.container,
    onSecondary: "#ffffff",
    onSecondaryContainer: brandColors.helpfulOrange.dark,
    // Tertiary - Thriving Green
    tertiary: brandColors.thrivingGreen.DEFAULT,
    tertiaryContainer: brandColors.thrivingGreen.container,
    onTertiary: "#ffffff",
    onTertiaryContainer: brandColors.thrivingGreen.dark,
    // Surfaces
    surface: brandColors.surface,
    surfaceVariant: brandColors.surfaceVariant,
    background: brandColors.background,
    onSurface: "#121212",
    onSurfaceVariant: brandColors.practicalGray.DEFAULT,
    onBackground: "#121212",
    // Error
    error: brandColors.error,
    errorContainer: brandColors.errorContainer,
    onError: "#ffffff",
    onErrorContainer: "#7f1d1d",
    // Outlines
    outline: brandColors.practicalGray.lightest,
    outlineVariant: "#eaebed",
    // Inverse
    inverseSurface: "#121212",
    inverseOnSurface: "#f9fbff",
    inversePrimary: brandColors.smartBlue.light,
    // Other
    shadow: "#000000",
    scrim: "#000000",
    backdrop: "rgba(18, 18, 18, 0.4)",
    // Custom additions for easy access
    warning: brandColors.peach.DEFAULT,
    warningContainer: brandColors.peach.container,
    success: brandColors.success,
    successContainer: brandColors.successContainer,
  },
};

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
  const tokenCache = {
    async getToken(key: string) {
      return SecureStore.getItemAsync(key);
    },
    async saveToken(key: string, value: string) {
      return SecureStore.setItemAsync(key, value);
    },
  };

  function ClerkBridges() {
    const { getToken, isSignedIn } = useClerkAuth();
    useEffect(() => {
      // Provide tokens to Supabase and API client
      const provider = async () => {
        try {
          return await getToken({ template: "supabase" });
        } catch {
          return null;
        }
      };
      setSupabaseAuthTokenProvider(provider);
      setAuthTokenProvider(provider);
    }, [getToken, isSignedIn]);
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkBridges />
        <PaperProvider theme={theme}>
          <QueryProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(athlete)" />
              </Stack>
              <StatusBar style="dark" />
            </AuthProvider>
          </QueryProvider>
        </PaperProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
