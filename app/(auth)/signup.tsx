import { Link } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SignupForm } from "@/components/forms/SignupForm";
import { AppText } from "@/components/ui/AppText";
import { HaltereMark } from "@/components/ui/HaltereMark";
import { Screen } from "@/components/ui/Screen";
import { palette, SUPPORT_EMAIL } from "@/lib/theme";

export default function SignupScreen() {
  return (
    <Screen notebook={false} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.markHalo}>
              <HaltereMark size={56} color={palette.orange} />
            </View>
            <AppText variant="eyebrow" color={palette.orange}>
              Halteres
            </AppText>
            <AppText variant="display" style={styles.title}>
              Start writing.
            </AppText>
            <AppText variant="italic">
              Describe how you already train. We'll turn it into a program you
              can edit and log.
            </AppText>
          </View>

          <View style={styles.form}>
            <SignupForm />
          </View>

          <View style={styles.footer}>
            <AppText variant="body">Already in?</AppText>
            <Link href="/(auth)/login">
              <AppText variant="label" color={palette.blue}>
                Sign in
              </AppText>
            </Link>
          </View>
          <AppText variant="bodySmall" style={styles.contact}>
            {SUPPORT_EMAIL}
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  hero: { marginBottom: 24 },
  markHalo: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: palette.orangeWash,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    transform: [{ rotate: "6deg" }],
  },
  title: { marginTop: 8, marginBottom: 10 },
  form: {
    backgroundColor: palette.paperElevated,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(26, 35, 50, 0.05)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 22,
  },
  contact: { textAlign: "center", marginTop: 16 },
});
