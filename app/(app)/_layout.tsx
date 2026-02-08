import { Tabs, Redirect } from "expo-router";
import { BarChart3, Building2, Dumbbell, Home, User } from "lucide-react-native";
import { Platform, StyleSheet, View, ActivityIndicator } from "react-native";
import { brandColors } from "@/app/_layout";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout() {
  const { isAthlete, isLoading, loadingProfile, user } = useAuth();

  // Show loading while checking auth
  if (isLoading || loadingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={brandColors.smartBlue.DEFAULT} />
      </View>
    );
  }

  // Redirect athletes to athlete section
  if (user && isAthlete) {
    return <Redirect href="/(athlete)/home" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: 12,
          // Elevated shadow for depth
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarActiveTintColor: brandColors.smartBlue.DEFAULT,
        tabBarInactiveTintColor: brandColors.practicalGray.light,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: brandColors.smartBlue.container,
                },
              ]}
            >
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: "Programs",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: brandColors.smartBlue.container,
                },
              ]}
            >
              <Dumbbell
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gym"
        options={{
          title: "Gym",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: brandColors.smartBlue.container,
                },
              ]}
            >
              <Building2
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && {
                  backgroundColor: brandColors.smartBlue.container,
                },
              ]}
            >
              <User
                color={color}
                size={22}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      {/* Hide analytics from tab bar - accessed via Dashboard quick action */}
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
      {/* Hide clients routes from tab bar - accessed via navigation */}
      <Tabs.Screen
        name="clients"
        options={{
          href: null,
        }}
      />
      {/* Hide change-password from tab bar - accessed via Profile */}
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
