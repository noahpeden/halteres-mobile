import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user, isLoading, loadingProfile, isAthlete, isCoach } = useAuth();

  // Show loading while checking auth and profile
  if (isLoading || loadingProfile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fbff" }}>
        <ActivityIndicator size="large" color="#1771dc" />
      </View>
    );
  }

  // Not logged in - go to login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Route based on user role
  if (isAthlete) {
    return <Redirect href="/(athlete)/home" />;
  }

  // Default to coach dashboard
  return <Redirect href="/(app)/dashboard" />;
}
