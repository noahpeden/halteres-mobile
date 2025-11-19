import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

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
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    try {
      setIsLoading(true);
      await signUp(data.email, data.password);
      Alert.alert(
        "Success",
        "Account created! Please check your email to confirm your account.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(app)/dashboard"),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create account");
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
              placeholder="Create a password"
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
          <View style={styles.inputContainer}>
            <TextInput
              label="Confirm Password"
              placeholder="Confirm your password"
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

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Create Account
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
});
