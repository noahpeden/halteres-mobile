import { useRouter } from "expo-router";
import { Calendar, ChevronRight, Dumbbell } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { AppText } from "@/components/ui/AppText";
import { fonts, palette, radii, shadows } from "@/lib/theme";

type ProgramCardProps = {
  program: {
    id: string;
    name: string;
    description?: string;
    duration_weeks: number;
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

  return (
    <AnimatedPressable
      onPress={() => router.push(`/(athlete)/programs/${program.id}`)}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={[styles.wrap, animatedStyle]}
    >
      <View style={styles.spine} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.titles}>
            <AppText variant="title">{program.name}</AppText>
            {program.description ? (
              <AppText
                variant="bodySmall"
                numberOfLines={1}
                style={styles.desc}
              >
                {program.description}
              </AppText>
            ) : null}
          </View>
          <ChevronRight size={18} color={palette.inkFaint} />
        </View>
        <View style={styles.meta}>
          <View style={[styles.chip, { backgroundColor: palette.blueWash }]}>
            <Calendar size={13} color={palette.blue} strokeWidth={2} />
            <AppText
              variant="label"
              color={palette.blueDeep}
              style={styles.chipText}
            >
              {program.duration_weeks} weeks
            </AppText>
          </View>
          {program.workout_count !== undefined && program.workout_count > 0 ? (
            <View
              style={[styles.chip, { backgroundColor: palette.orangeWash }]}
            >
              <Dumbbell size={13} color={palette.orange} strokeWidth={2} />
              <AppText
                variant="label"
                color={palette.orangeDeep}
                style={styles.chipText}
              >
                {program.workout_count} days
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    backgroundColor: palette.paperElevated,
    borderRadius: radii.lg,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(26, 35, 50, 0.05)",
    ...shadows.card,
  },
  spine: {
    width: 5,
    backgroundColor: palette.orange,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  titles: { flex: 1 },
  desc: { marginTop: 2 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
  },
});
