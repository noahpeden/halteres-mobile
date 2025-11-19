import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl font-bold text-foreground mb-4">404</Text>
          <Text className="text-xl text-muted-foreground mb-8">
            This screen doesn't exist.
          </Text>
          <Link href="/" className="text-primary font-semibold">
            Go to home screen
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
