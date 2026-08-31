import {
  Dumbbell,
  FileText,
  FolderOpen,
  type LucideIcon,
  Search,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { palette } from "@/lib/theme";
import { AppText } from "./AppText";
import { HButton } from "./HButton";

type EmptyStateVariant = "programs" | "workouts" | "search" | "default";

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

const variantConfig: Record<
  EmptyStateVariant,
  { icon: LucideIcon; color: string; bg: string }
> = {
  programs: {
    icon: FileText,
    color: palette.orange,
    bg: palette.orangeWash,
  },
  workouts: {
    icon: Dumbbell,
    color: palette.blue,
    bg: palette.blueWash,
  },
  search: {
    icon: Search,
    color: palette.inkFaint,
    bg: palette.paperSunken,
  },
  default: {
    icon: FolderOpen,
    color: palette.inkFaint,
    bg: palette.paperSunken,
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

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
        <Icon size={36} color={config.color} strokeWidth={1.5} />
      </View>
      <AppText variant="headline" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" style={styles.description}>
        {description}
      </AppText>
      <View style={styles.actions}>
        {actionLabel && onAction ? (
          <HButton label={actionLabel} onPress={onAction} tone="orange" />
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <HButton
            label={secondaryActionLabel}
            onPress={onSecondaryAction}
            tone="ghost"
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 28,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    transform: [{ rotate: "-6deg" }],
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    maxWidth: 300,
  },
  actions: {
    marginTop: 22,
    gap: 10,
    alignSelf: "stretch",
  },
});
