import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

// Custom theme matching brand colors
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#3b82f6", // blue-600
    primaryContainer: "#dbeafe", // blue-100
    secondary: "#64748b", // slate-500
    secondaryContainer: "#f1f5f9", // slate-100
    tertiary: "#10b981", // green-500
    tertiaryContainer: "#d1fae5", // green-100
    surface: "#ffffff",
    surfaceVariant: "#f8fafc", // slate-50
    background: "#f1f5f9", // slate-100
    error: "#ef4444", // red-500
    errorContainer: "#fee2e2", // red-100
    onPrimary: "#ffffff",
    onPrimaryContainer: "#1e3a8a", // blue-900
    onSecondary: "#ffffff",
    onSecondaryContainer: "#0f172a", // slate-900
    onTertiary: "#ffffff",
    onTertiaryContainer: "#064e3b", // green-900
    onSurface: "#0f172a", // slate-900
    onSurfaceVariant: "#64748b", // slate-500
    onError: "#ffffff",
    onErrorContainer: "#7f1d1d", // red-900
    onBackground: "#0f172a", // slate-900
    outline: "#cbd5e1", // slate-300
    outlineVariant: "#e2e8f0", // slate-200
    inverseSurface: "#1e293b", // slate-800
    inverseOnSurface: "#f8fafc", // slate-50
    inversePrimary: "#60a5fa", // blue-400
    shadow: "#000000",
    scrim: "#000000",
    backdrop: "rgba(15, 23, 42, 0.4)", // slate-900 with opacity
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <QueryProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
            <StatusBar style="dark" />
          </AuthProvider>
        </QueryProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
