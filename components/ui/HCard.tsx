import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { usePressAnimation } from "@/lib/animations";
import { palette, radii, shadows } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accent?: "blue" | "orange" | "green" | "peach" | "none";
  padded?: boolean;
};

const accentColor = {
  blue: palette.blue,
  orange: palette.orange,
  green: palette.green,
  peach: palette.peach,
  none: "transparent",
};

export function HCard({
  children,
  onPress,
  style,
  accent = "none",
  padded = true,
}: HCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.985);
  const body = (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        accent !== "none" && styles.withSpine,
        style,
      ]}
    >
      {accent !== "none" ? (
        <View
          style={[styles.spine, { backgroundColor: accentColor[accent] }]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (!onPress) return body;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={animatedStyle}
    >
      {body}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.paperElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(26, 35, 50, 0.05)",
    overflow: "hidden",
    flexDirection: "row",
    ...shadows.card,
  },
  padded: {
    minHeight: 64,
  },
  withSpine: {
    paddingLeft: 0,
  },
  spine: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
