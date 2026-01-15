import { brandColors } from "@/app/_layout";
import {
  Dumbbell,
  FileText,
  FolderOpen,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import type React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Text } from "react-native-paper";

type EmptyStateVariant =
  | "programs"
  | "workouts"
  | "clients"
  | "search"
  | "default";

type EmptyStateProps = {
  variant?: EmptyStateVariant;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: LucideIcon;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantConfig: Record<
  EmptyStateVariant,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  programs: {
    icon: FileText,
    color: brandColors.smartBlue.DEFAULT,
    bgColor: brandColors.smartBlue.container,
  },
  workouts: {
    icon: Dumbbell,
    color: brandColors.helpfulOrange.DEFAULT,
    bgColor: brandColors.helpfulOrange.container,
  },
  clients: {
    icon: Users,
    color: brandColors.thrivingGreen.DEFAULT,
    bgColor: brandColors.thrivingGreen.container,
  },
  search: {
    icon: Search,
    color: brandColors.practicalGray.DEFAULT,
    bgColor: brandColors.practicalGray.container,
  },
  default: {
    icon: FolderOpen,
    color: brandColors.practicalGray.DEFAULT,
    bgColor: brandColors.practicalGray.container,
  },
};

export function EmptyState({
  variant = "default",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon: CustomIcon,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;
  const primaryScale = useSharedValue(1);
  const secondaryScale = useSharedValue(1);

  const primaryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryScale.value }],
  }));

  const secondaryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryScale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
      {/* Icon circle */}
      <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
        <Icon size={40} color={config.color} strokeWidth={1.5} />
      </View>

      {/* Text content */}
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {description}
      </Text>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {actionLabel && onAction && (
          <AnimatedPressable
            onPress={onAction}
            onPressIn={() => {
              primaryScale.value = withSpring(0.95, {
                damping: 15,
                stiffness: 300,
              });
            }}
            onPressOut={() => {
              primaryScale.value = withSpring(1, {
                damping: 15,
                stiffness: 150,
              });
            }}
            style={[
              styles.primaryButton,
              { backgroundColor: brandColors.smartBlue.DEFAULT },
              primaryAnimatedStyle,
            ]}
          >
            <Text variant="labelLarge" style={styles.primaryButtonText}>
              {actionLabel}
            </Text>
          </AnimatedPressable>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <AnimatedPressable
            onPress={onSecondaryAction}
            onPressIn={() => {
              secondaryScale.value = withSpring(0.95, {
                damping: 15,
                stiffness: 300,
              });
            }}
            onPressOut={() => {
              secondaryScale.value = withSpring(1, {
                damping: 15,
                stiffness: 150,
              });
            }}
            style={[styles.secondaryButton, secondaryAnimatedStyle]}
          >
            <Text variant="labelLarge" style={styles.secondaryButtonText}>
              {secondaryActionLabel}
            </Text>
          </AnimatedPressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "700",
    color: "#121212",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    color: brandColors.practicalGray.DEFAULT,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
    alignItems: "center",
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 180,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 180,
    alignItems: "center",
    borderWidth: 1,
    borderColor: brandColors.practicalGray.light,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: brandColors.practicalGray.medium,
    fontWeight: "600",
  },
});
