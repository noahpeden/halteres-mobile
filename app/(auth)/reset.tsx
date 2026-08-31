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
import { HelperText, TextInput } from "react-native-paper";
import { z } from "zod";
import { AppText } from "@/components/ui/AppText";
import { HButton } from "@/components/ui/HButton";
import { Screen } from "@/components/ui/Screen";
import { supabase } from "@/lib/supabase/client";
import { palette } from "@/lib/theme";

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResetInput = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ResetInput) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: "https://halteres.ai/auth/callback?reset=true",
      });
      if (error) throw error;
      Alert.alert(
        "Check your email",
        "We sent you a link to reset your password.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to send password reset email",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <AppText variant="eyebrow" color={palette.blue}>
            Account
          </AppText>
          <AppText variant="display" style={styles.title}>
            Reset the lock.
          </AppText>
          <AppText variant="italic" style={styles.sub}>
            We'll email a link. Same inbox you signed up with.
          </AppText>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    label="Email"
                    placeholder="you@example.com"
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
            <HButton
              label="Send reset link"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              tone="ink"
            />
            <HButton
              label="Back to sign in"
              onPress={() => router.replace("/(auth)/login")}
              tone="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: { marginTop: 10, marginBottom: 8 },
  sub: { marginBottom: 24 },
  form: { gap: 12 },
  input: { backgroundColor: palette.paperElevated },
});
