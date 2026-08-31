import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LoginForm } from "@/components/forms/LoginForm";
import { SignupForm } from "@/components/forms/SignupForm";
import { AppText } from "@/components/ui/AppText";
import { HaltereMark } from "@/components/ui/HaltereMark";
import { Screen } from "@/components/ui/Screen";
import { fonts, palette, SUPPORT_EMAIL } from "@/lib/theme";

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

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
              <HaltereMark size={64} color={palette.blue} />
            </View>
            <AppText variant="eyebrow" style={styles.brand}>
              Halteres
            </AppText>
            <AppText variant="display" style={styles.title}>
              {activeTab === "login"
                ? "Back to the page."
                : "Write your own program."}
            </AppText>
            <AppText variant="italic" style={styles.sub}>
              {activeTab === "login"
                ? "Pick up today's session, log it, keep going."
                : "Self-coached. Already trains. No gym code."}
            </AppText>
          </View>

          <View style={styles.switcher}>
            {(
              [
                ["login", "Sign in"],
                ["signup", "Join"],
              ] as const
            ).map(([key, label]) => {
              const on = activeTab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setActiveTab(key)}
                  style={[styles.switchItem, on && styles.switchOn]}
                >
                  <AppText
                    variant="label"
                    style={{ color: on ? palette.paper : palette.inkSoft }}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.form}>
            {activeTab === "login" ? <LoginForm /> : <SignupForm />}
          </View>

          <AppText variant="bodySmall" style={styles.contact}>
            Questions? {SUPPORT_EMAIL}
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
  hero: {
    marginBottom: 28,
  },
  markHalo: {
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: palette.blueWash,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    transform: [{ rotate: "-8deg" }],
  },
  brand: {
    marginBottom: 8,
    color: palette.blue,
  },
  title: {
    marginBottom: 10,
  },
  sub: {
    maxWidth: 320,
  },
  switcher: {
    flexDirection: "row",
    backgroundColor: palette.paperSunken,
    borderRadius: 999,
    padding: 4,
    marginBottom: 22,
    alignSelf: "flex-start",
  },
  switchItem: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  switchOn: {
    backgroundColor: palette.ink,
  },
  form: {
    backgroundColor: palette.paperElevated,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(26, 35, 50, 0.05)",
  },
  contact: {
    textAlign: "center",
    marginTop: 24,
    fontFamily: fonts.ui,
  },
});
