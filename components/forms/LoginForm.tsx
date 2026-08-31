import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { z } from "zod";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { AppText } from "@/components/ui/AppText";
import { HButton } from "@/components/ui/HButton";
import { useAuth } from "@/hooks/useAuth";
import { palette } from "@/lib/theme";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      router.replace("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to sign in";
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
              placeholder="Your password"
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
            <Pressable
              onPress={() => router.push("/(auth)/reset")}
              style={styles.forgot}
            >
              <AppText variant="label" color={palette.blue}>
                Forgot password?
              </AppText>
            </Pressable>
          </View>
        )}
      />

      <HButton
        label="Sign in"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        tone="ink"
      />
      <GoogleSignIn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  input: { backgroundColor: palette.paperElevated },
  forgot: { alignSelf: "flex-end", marginBottom: 12, marginTop: -4 },
});
