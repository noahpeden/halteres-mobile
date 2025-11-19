import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoginForm } from "@/components/forms/LoginForm";
import { SignupForm } from "@/components/forms/SignupForm";

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
              {/* Header */}
              <View style={styles.header}>
                <Text
                  variant="headlineMedium"
                  style={[styles.title, { color: theme.colors.onSurface }]}
                >
                  {activeTab === "login" ? "Welcome back" : "Get started"}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.subtitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {activeTab === "login"
                    ? "Sign in to continue your fitness journey"
                    : "Create your account to begin"}
                </Text>
              </View>

              {/* Tab Navigation */}
              <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                buttons={[
                  { value: "login", label: "Login" },
                  { value: "signup", label: "Sign Up" },
                ]}
                style={styles.tabs}
              />

              {/* Form Content */}
              {activeTab === "login" ? <LoginForm /> : <SignupForm />}
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
  tabs: {
    marginBottom: 24,
  },
});
