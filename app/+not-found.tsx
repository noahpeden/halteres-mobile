import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { palette } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Missing page" }} />
      <Screen notebook={false}>
        <View style={styles.wrap}>
          <AppText variant="eyebrow" color={palette.orange}>
            404
          </AppText>
          <AppText variant="display" style={styles.title}>
            This page wandered off.
          </AppText>
          <AppText variant="italic" style={styles.sub}>
            Back to today — that's where the work is.
          </AppText>
          <Link href="/" style={styles.link}>
            <AppText variant="label" color={palette.blue}>
              Go to Today
            </AppText>
          </Link>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  title: { marginTop: 8, marginBottom: 10 },
  sub: { marginBottom: 24 },
  link: { alignSelf: "flex-start" },
});
