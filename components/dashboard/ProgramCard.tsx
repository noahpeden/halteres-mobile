import { useRouter } from "expo-router";
import { Calendar, ChevronRight, Dumbbell, User } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Text } from "react-native-paper";
import { brandColors } from "@/app/_layout";

type ProgramCardProps = {
  program: {
    id: string;
    name: string;
    description?: string;
    duration_weeks: number;
    client_name?: string;
    workout_count?: number;
  };
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProgramCard({ program }: ProgramCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    router.push(`/(app)/programs/${program.id}`);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.title}>
                {program.name}
              </Text>
              {program.description && (
                <Text
                  variant="bodySmall"
                  style={styles.description}
                  numberOfLines={1}
                >
                  {program.description}
                </Text>
              )}
            </View>
            <ChevronRight size={20} color={brandColors.practicalGray.light} />
          </View>

          <View style={styles.metaContainer}>
            <View style={[styles.metaItem, styles.metaItemPrimary]}>
              <Calendar
                size={14}
                color={brandColors.smartBlue.DEFAULT}
                strokeWidth={2}
              />
              <Text variant="labelSmall" style={styles.metaTextPrimary}>
                {program.duration_weeks} weeks
              </Text>
            </View>

            {program.client_name && (
              <View style={[styles.metaItem, styles.metaItemSecondary]}>
                <User
                  size={14}
                  color={brandColors.thrivingGreen.DEFAULT}
                  strokeWidth={2}
                />
                <Text variant="labelSmall" style={styles.metaTextSecondary}>
                  {program.client_name}
                </Text>
              </View>
            )}

            {program.workout_count !== undefined &&
              program.workout_count > 0 && (
                <View style={[styles.metaItem, styles.metaItemTertiary]}>
                  <Dumbbell
                    size={14}
                    color={brandColors.helpfulOrange.DEFAULT}
                    strokeWidth={2}
                  />
                  <Text variant="labelSmall" style={styles.metaTextTertiary}>
                    {program.workout_count} workouts
                  </Text>
                </View>
              )}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    width: 4,
    backgroundColor: brandColors.smartBlue.DEFAULT,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "700",
    color: "#121212",
  },
  description: {
    color: brandColors.practicalGray.DEFAULT,
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaItemPrimary: {
    backgroundColor: brandColors.smartBlue.container,
  },
  metaItemSecondary: {
    backgroundColor: brandColors.thrivingGreen.container,
  },
  metaItemTertiary: {
    backgroundColor: brandColors.helpfulOrange.container,
  },
  metaTextPrimary: {
    color: brandColors.smartBlue.dark,
    fontWeight: "600",
  },
  metaTextSecondary: {
    color: brandColors.thrivingGreen.dark,
    fontWeight: "600",
  },
  metaTextTertiary: {
    color: brandColors.helpfulOrange.dark,
    fontWeight: "600",
  },
});
