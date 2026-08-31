import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Shield } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  HelperText,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { palette } from "@/lib/theme";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      setIsLoading(true);

      // First, verify the current password by re-authenticating
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.email) {
        throw new Error("Unable to verify user");
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert(
        "Password Changed",
        "Your password has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );

      reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change password";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={palette.inkFaint} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Change Password
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Card */}
          <Surface style={styles.infoCard} elevation={1}>
            <View style={styles.infoIconContainer}>
              <Shield size={24} color={palette.blue} />
            </View>
            <View style={styles.infoContent}>
              <Text variant="titleSmall" style={styles.infoTitle}>
                Password Requirements
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                {"\u2022"} At least 8 characters{"\n"}
                {"\u2022"} One uppercase letter{"\n"}
                {"\u2022"} One lowercase letter{"\n"}
                {"\u2022"} One number
              </Text>
            </View>
          </Surface>

          {/* Form */}
          <Surface style={styles.formCard} elevation={1}>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Current Password"
                    placeholder="Enter your current password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.currentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    mode="outlined"
                    style={styles.input}
                    left={
                      <TextInput.Icon
                        icon={() => <Lock size={20} color={palette.inkSoft} />}
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={() =>
                          showCurrentPassword ? (
                            <EyeOff size={20} color={palette.inkSoft} />
                          ) : (
                            <Eye size={20} color={palette.inkSoft} />
                          )
                        }
                        onPress={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      />
                    }
                  />
                  <HelperText type="error" visible={!!errors.currentPassword}>
                    {errors.currentPassword?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="New Password"
                    placeholder="Enter your new password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.newPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    mode="outlined"
                    style={styles.input}
                    left={
                      <TextInput.Icon
                        icon={() => <Lock size={20} color={palette.inkSoft} />}
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={() =>
                          showNewPassword ? (
                            <EyeOff size={20} color={palette.inkSoft} />
                          ) : (
                            <Eye size={20} color={palette.inkSoft} />
                          )
                        }
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      />
                    }
                  />
                  <HelperText type="error" visible={!!errors.newPassword}>
                    {errors.newPassword?.message}
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
                    label="Confirm New Password"
                    placeholder="Confirm your new password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.confirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    mode="outlined"
                    style={styles.input}
                    left={
                      <TextInput.Icon
                        icon={() => <Lock size={20} color={palette.inkSoft} />}
                      />
                    }
                    right={
                      <TextInput.Icon
                        icon={() =>
                          showConfirmPassword ? (
                            <EyeOff size={20} color={palette.inkSoft} />
                          ) : (
                            <Eye size={20} color={palette.inkSoft} />
                          )
                        }
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      />
                    }
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
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              Update Password
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    flexDirection: "row",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: palette.blueWash,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    color: palette.inkSoft,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
});
