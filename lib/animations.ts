import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useCallback } from "react";

// Spring configurations
export const springConfig = {
  gentle: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.6,
  },
};

// Timing configurations
export const timingConfig = {
  fast: {
    duration: 150,
    easing: Easing.out(Easing.cubic),
  },
  normal: {
    duration: 250,
    easing: Easing.out(Easing.cubic),
  },
  slow: {
    duration: 400,
    easing: Easing.out(Easing.cubic),
  },
};

/**
 * Hook for press scale animation
 * Use with Pressable's onPressIn/onPressOut
 */
export function usePressAnimation(scale = 0.97) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          pressed.value,
          [0, 1],
          [1, scale],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, springConfig.snappy);
  }, [pressed]);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springConfig.gentle);
  }, [pressed]);

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Hook for fade-in animation with optional slide
 */
export function useFadeIn(delay = 0, slideDistance = 20) {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [slideDistance, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const startAnimation = useCallback(() => {
    progress.value = withDelay(delay, withTiming(1, timingConfig.normal));
  }, [delay, progress]);

  return { animatedStyle, startAnimation, progress };
}

/**
 * Hook for staggered list item animation
 */
export function useStaggeredAnimation(index: number, baseDelay = 50) {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [30, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [0.95, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const startAnimation = useCallback(() => {
    progress.value = withDelay(
      index * baseDelay,
      withSpring(1, springConfig.gentle),
    );
  }, [index, baseDelay, progress]);

  return { animatedStyle, startAnimation };
}

/**
 * Hook for card hover/press elevation effect
 */
export function useElevationAnimation(baseElevation = 2, pressedElevation = 6) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pressed.value, [0, 1], [0.1, 0.2]),
    shadowRadius: interpolate(
      pressed.value,
      [0, 1],
      [baseElevation * 2, pressedElevation * 2],
    ),
    elevation: interpolate(
      pressed.value,
      [0, 1],
      [baseElevation, pressedElevation],
    ),
  }));

  const onPressIn = useCallback(() => {
    pressed.value = withSpring(1, springConfig.snappy);
  }, [pressed]);

  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springConfig.gentle);
  }, [pressed]);

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Hook for pulse animation (great for loading states)
 */
export function usePulseAnimation() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startPulse = useCallback(() => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 500 }),
      withTiming(1, { duration: 500 }),
    );
  }, [scale]);

  return { animatedStyle, startPulse };
}

/**
 * Hook for shake animation (great for errors)
 */
export function useShakeAnimation() {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 50 }),
    );
  }, [translateX]);

  return { animatedStyle, shake };
}

/**
 * Entering animation for screens/modals
 */
export const enteringAnimation = {
  fadeInUp: {
    initialValues: {
      opacity: 0,
      transform: [{ translateY: 20 }],
    },
    animations: {
      opacity: { value: 1, type: "timing", duration: 250 },
      transform: [
        {
          translateY: { value: 0, type: "spring", damping: 15, stiffness: 150 },
        },
      ],
    },
  },
  fadeInScale: {
    initialValues: {
      opacity: 0,
      transform: [{ scale: 0.95 }],
    },
    animations: {
      opacity: { value: 1, type: "timing", duration: 200 },
      transform: [
        { scale: { value: 1, type: "spring", damping: 15, stiffness: 200 } },
      ],
    },
  },
};
