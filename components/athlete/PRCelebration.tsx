import { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Modal, Portal, Text, Button, Surface } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { brandColors } from "@/app/_layout";

type Props = {
  visible: boolean;
  prData: {
    displayValue?: string;
    improvement?: number;
    previousValue?: number;
  } | null;
  onClose: () => void;
};

export default function PRCelebration({ visible, prData, onClose }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1);
      scale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 12 })
      );

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    opacity.value = withSpring(0, {}, () => {
      runOnJS(onClose)();
    });
    scale.value = withSpring(0);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const improvement = prData?.improvement
    ? `${prData.improvement > 0 ? "+" : ""}${prData.improvement.toFixed(1)}%`
    : null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <Surface style={styles.surface} elevation={5}>
            {/* Trophy */}
            <Text style={styles.trophy}>🏆</Text>

            {/* PR Text */}
            <Text variant="headlineLarge" style={styles.prText}>
              NEW PR!
            </Text>

            {/* Result Value */}
            <Text variant="displaySmall" style={styles.resultValue}>
              {prData?.displayValue || "Personal Record"}
            </Text>

            {/* Improvement */}
            {improvement && prData?.previousValue && (
              <Text variant="titleMedium" style={styles.improvement}>
                {improvement} better than before!
              </Text>
            )}

            {/* Message */}
            <Text variant="bodyLarge" style={styles.message}>
              You're crushing it! Keep up the amazing work! 💪
            </Text>

            {/* Button */}
            <Button
              mode="contained"
              onPress={handleClose}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Celebrate! 🎉
            </Button>
          </Surface>
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  modalContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: width - 40,
    maxWidth: 350,
  },
  surface: {
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  trophy: {
    fontSize: 64,
    marginBottom: 16,
  },
  prText: {
    fontWeight: "bold",
    color: brandColors.helpfulOrange.DEFAULT,
    marginBottom: 8,
  },
  resultValue: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  improvement: {
    color: brandColors.thrivingGreen.DEFAULT,
    fontWeight: "600",
    marginBottom: 16,
  },
  message: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
    paddingVertical: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
