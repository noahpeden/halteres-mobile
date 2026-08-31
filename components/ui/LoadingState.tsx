import { Dumbbell, Loader2 } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { palette } from "@/lib/theme";

type LoadingStateProps = {
  message?: string;
  variant?: "default" | "full" | "inline";
};

export function LoadingState({
  message = "Loading...",
  variant = "default",
}: LoadingStateProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (variant === "inline") {
    return (
      <View style={styles.inlineContainer}>
        <Animated.View style={spinStyle}>
          <Loader2 size={18} color={palette.blue} strokeWidth={2} />
        </Animated.View>
        <Text variant="bodySmall" style={styles.inlineText}>
          {message}
        </Text>
      </View>
    );
  }

  if (variant === "full") {
    return (
      <View style={styles.fullContainer}>
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.iconCircle, pulseStyle]}>
            <Dumbbell size={32} color={palette.blue} strokeWidth={1.5} />
          </Animated.View>
          <Animated.View style={[styles.spinnerWrapper, spinStyle]}>
            <View style={styles.spinnerDot} />
          </Animated.View>
        </View>
        <Text variant="titleMedium" style={styles.title}>
          {message}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          This won't take long
        </Text>
      </View>
    );
  }

  // Default variant
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconCircleSmall, pulseStyle]}>
        <Animated.View style={spinStyle}>
          <Loader2 size={24} color={palette.blue} strokeWidth={2} />
        </Animated.View>
      </Animated.View>
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  fullContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: palette.paper,
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iconWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.blueWash,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.blueWash,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  spinnerWrapper: {
    position: "absolute",
    width: 80,
    height: 80,
  },
  spinnerDot: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.blue,
  },
  title: {
    fontWeight: "700",
    color: "#121212",
    marginBottom: 8,
  },
  subtitle: {
    color: palette.inkFaint,
  },
  message: {
    color: palette.inkFaint,
    fontWeight: "500",
  },
  inlineText: {
    color: palette.inkFaint,
  },
});
