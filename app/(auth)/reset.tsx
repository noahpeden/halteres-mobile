import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { z } from "zod";
import { useSignIn } from "@clerk/expo";

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResetInput = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signIn, setActive } = useSignIn();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetInput) => {
    try {
      setIsLoading(true);
      // Trigger Clerk password reset email flow
      if (!signIn) throw new Error("Auth not ready");
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });
      setStep("reset");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send password reset email";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = async () => {
    try {
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }
      setIsLoading(true);
      if (!signIn) throw new Error("Auth not ready");
      const first = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });
      // Depending on Clerk, we may need to set the new password next
      // @ts-ignore
      if (first.status === "needs_new_password") {
        // @ts-ignore
        const res = await signIn.resetPassword({ password: newPassword });
        // @ts-ignore
        if (res.status === "complete") {
          // @ts-ignore
          await setActive!({ session: res.createdSessionId });
          router.replace("/");
          return;
        }
      }
      // Some versions may return complete directly
      // @ts-ignore
      if (first.status === "complete") {
        // @ts-ignore
        await setActive!({ session: first.createdSessionId });
        router.replace("/");
        return;
      }
      Alert.alert("Error", "Could not reset password. Please try again.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Reset password
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Enter your email to receive a reset link
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email"
                    placeholder="email@example.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    mode="outlined"
                    style={styles.input}
                  />
                  <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                  </HelperText>
                </View>
              )}
            />

            {step === "request" ? (
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Send reset code
              </Button>
            ) : (
              <>
                <TextInput
                  label="Email code"
                  value={code}
                  onChangeText={setCode}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="number-pad"
                />
                <TextInput
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TextInput
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Button
                  mode="contained"
                  onPress={onReset}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Reset password
                </Button>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
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
  form: {
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
