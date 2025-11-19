import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6">
        <View className="py-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Settings
          </Text>
        </View>

        <View className="space-y-4">
          <View className="bg-muted p-4 rounded-lg">
            <Text className="text-foreground font-semibold mb-2">Account</Text>
            <Text className="text-muted-foreground">
              Account settings coming soon
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-destructive p-4 rounded-lg active:opacity-80"
          >
            <Text className="text-destructive-foreground font-semibold text-center">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
