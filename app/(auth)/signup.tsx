import { Link } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Text } from "react-native-paper";
import { SignupForm } from "@/components/forms/SignupForm";

export default function SignupScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.card} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                  Create account
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Start your fitness journey today
                </Text>
              </View>

              <SignupForm />

              <View style={styles.footer}>
                <Text variant="bodyMedium" style={styles.footerText}>
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/login">
                  <Text style={styles.footerLink}>Sign in</Text>
                </Link>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    marginRight: 4,
  },
  footerLink: {
    color: "#3b82f6",
    fontWeight: "600",
  },
});
