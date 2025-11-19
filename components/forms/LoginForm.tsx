import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

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
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      router.replace("/(app)/dashboard");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/reset");
  };

  return (
    <View style={styles.container}>
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

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Password"
              placeholder="Enter your password"
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
            <Button
              mode="text"
              onPress={handleForgotPassword}
              compact
              style={styles.forgotButton}
            >
              Forgot password?
            </Button>
          </View>
        )}
      />

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Sign In
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
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
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
});
