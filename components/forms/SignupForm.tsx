import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { z } from "zod";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { HButton } from "@/components/ui/HButton";
import { useAuth } from "@/hooks/useAuth";
import { palette } from "@/lib/theme";

const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupInput = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignupInput) => {
    try {
      setIsLoading(true);
      await signUp(data.email, data.password);
      Alert.alert(
        "Check your inbox",
        "Account created. Confirm the email and you're in.",
        [{ text: "OK", onPress: () => router.replace("/") }],
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create account";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              label="Password"
              placeholder="At least 8 characters"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.password}
              secureTextEntry
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              label="Confirm password"
              placeholder="Same again"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword?.message}
            </HelperText>
          </View>
        )}
      />

      <HButton
        label="Create account"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        tone="orange"
      />
      <GoogleSignIn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  input: { backgroundColor: palette.paperElevated },
});
