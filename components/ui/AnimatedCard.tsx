import { ReactNode } from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { Card, useTheme } from "react-native-paper";
import { usePressAnimation } from "@/lib/animations";

type AnimatedCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  variant?: "elevated" | "outlined" | "filled";
  accentColor?: string;
  disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedCard({
  children,
  onPress,
  style,
  contentStyle,
  variant = "elevated",
  accentColor,
  disabled = false,
}: AnimatedCardProps) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(0.98);

  const cardStyle = [
    styles.card,
    variant === "elevated" && styles.elevated,
    variant === "outlined" && [
      styles.outlined,
      { borderColor: theme.colors.outlineVariant },
    ],
    variant === "filled" && { backgroundColor: theme.colors.surfaceVariant },
    accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor },
    style,
  ];

  if (!onPress) {
    return (
      <Card
        style={cardStyle}
        mode={variant === "outlined" ? "outlined" : "elevated"}
      >
        <Card.Content style={contentStyle}>{children}</Card.Content>
      </Card>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[animatedStyle, { opacity: disabled ? 0.6 : 1 }]}
    >
      <Card
        style={cardStyle}
        mode={variant === "outlined" ? "outlined" : "elevated"}
      >
        <Card.Content style={contentStyle}>{children}</Card.Content>
      </Card>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
});
