import { Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AthleteTabBar } from "@/components/navigation/AthleteTabBar";
import { useAuth } from "@/hooks/useAuth";
import { palette } from "@/lib/theme";

export default function AthleteLayout() {
  const { isLoading, loadingProfile } = useAuth();

  if (isLoading || loadingProfile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: palette.paper,
        }}
      >
        <ActivityIndicator size="large" color={palette.blue} />
      </View>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <AthleteTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: "absolute" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Today" }} />
      <Tabs.Screen name="programs" options={{ title: "Write" }} />
      <Tabs.Screen name="history" options={{ title: "Log" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
      <Tabs.Screen name="feedback" options={{ href: null }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
    </Tabs>
  );
}
