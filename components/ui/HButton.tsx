import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { usePressAnimation } from "@/lib/animations";
import { fonts, palette, radii } from "@/lib/theme";
import { AppText } from "./AppText";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Tone = "ink" | "blue" | "orange" | "ghost" | "danger";

type HButtonProps = {
  label: string;
  onPress?: () => void;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  compact?: boolean;
};

const tones: Record<Tone, { bg: string; fg: string; border?: string }> = {
  ink: { bg: palette.ink, fg: palette.paper },
  blue: { bg: palette.blue, fg: palette.white },
  orange: { bg: palette.orange, fg: palette.white },
  ghost: { bg: "transparent", fg: palette.inkSoft, border: palette.rule },
  danger: { bg: palette.errorWash, fg: palette.error, border: "#F3C4C4" },
};

export function HButton({
  label,
  onPress,
  tone = "blue",
  disabled,
  loading,
  icon,
  compact,
}: HButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.97);
  const t = tones[tone];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        styles.base,
        compact ? styles.compact : styles.full,
        { backgroundColor: t.bg, borderColor: t.border ?? "transparent" },
        t.border ? styles.outlined : null,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <AppText variant="label" style={[styles.label, { color: t.fg }]}>
            {label}
          </AppText>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    minHeight: 52,
  },
  full: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  outlined: {
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
  },
});
