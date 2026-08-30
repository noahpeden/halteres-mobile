import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import type { WeekData } from "@/lib/types/twoPhaseGeneration";
import { WorkoutCard } from "./WorkoutCard";
import type { Workout } from "@/hooks/useProgramWorkoutsMobile";

type WeekCardProps = {
  week: WeekData;
  weekNote: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNoteChange: (note: string) => void;
  onEnhance: () => void;
  isEnhancing: boolean;
  // Action props for detailed workouts
  programId?: string;
  onDeleteWorkout?: (workoutId: string) => void;
  onToggleComplete?: (workoutId: string, completed: boolean) => void;
  onChangeDateWorkout?: (workoutId: string, currentDate?: string) => void;
};

function extractFocus(title: string | undefined): string {
  if (!title) return "Workout";
  const match = title.match(/:\s*(.+)$/);
  return match ? match[1] : "Workout";
}

export function WeekCard({
  week,
  weekNote,
  isExpanded,
  onToggleExpand,
  onNoteChange,
  onEnhance,
  isEnhancing,
  // Action props for detailed workouts
  programId,
  onDeleteWorkout,
  onToggleComplete,
  onChangeDateWorkout,
}: WeekCardProps) {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (week.status) {
      case "detailed":
        return {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primaryContainer + "20",
          badgeColor: theme.colors.primaryContainer,
          badgeTextColor: theme.colors.onPrimaryContainer,
          label: "Fully Written",
        };
      case "enhancing":
        return {
          borderColor: theme.colors.secondary,
          backgroundColor: theme.colors.secondaryContainer + "20",
          badgeColor: theme.colors.secondaryContainer,
          badgeTextColor: theme.colors.onSecondaryContainer,
          label: "Enhancing...",
        };
      default:
        return {
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surfaceVariant + "20",
          badgeColor: theme.colors.tertiaryContainer,
          badgeTextColor: theme.colors.onTertiaryContainer,
          label: "Structure Only",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card
      style={[
        styles.card,
        {
          borderWidth: 2,
          borderColor: config.borderColor,
          backgroundColor: config.backgroundColor,
        },
      ]}
    >
      <Card.Content>
        {/* Week Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.weekBadge,
                {
                  backgroundColor:
                    week.status === "detailed"
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                },
              ]}
            >
              {week.status === "detailed" ? (
                <Check size={16} color={theme.colors.onPrimary} />
              ) : (
                <Text
                  variant="labelMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {week.weekNumber}
                </Text>
              )}
            </View>
            <Text variant="titleMedium" style={styles.weekTitle}>
              Week {week.weekNumber}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Chip
              style={{ backgroundColor: config.badgeColor }}
              textStyle={{ color: config.badgeTextColor, fontSize: 12 }}
              compact
            >
              {week.status === "enhancing" && (
                <Loader2
                  size={12}
                  color={config.badgeTextColor}
                  style={{ marginRight: 4 }}
                />
              )}
              {config.label}
            </Chip>
            <IconButton
              icon={({ size, color }) =>
                isExpanded ? (
                  <ChevronUp size={size} color={color} />
                ) : (
                  <ChevronDown size={size} color={color} />
                )
              }
              onPress={onToggleExpand}
              size={20}
            />
          </View>
        </View>

        {/* Workout Previews Grid */}
        <View style={styles.previewGrid}>
          {week.workouts.slice(0, 5).map((workout, i) => (
            <View
              key={workout.id}
              style={[
                styles.previewItem,
                { backgroundColor: theme.colors.surfaceVariant + "50" },
              ]}
            >
              <Text variant="labelSmall" style={styles.dayLabel}>
                Day {i + 1}
              </Text>
              <Text
                variant="bodySmall"
                style={styles.focusLabel}
                numberOfLines={1}
              >
                {extractFocus(workout.title)}
              </Text>
            </View>
          ))}
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {week.workouts.map((workout) => {
              // For detailed workouts with programId, use WorkoutCard with actions
              if (week.status === "detailed" && programId) {
                // Convert TwoPhaseWorkout to Workout type
                const workoutForCard: Workout = {
                  ...workout,
                  tags: Array.isArray(workout.tags) ? workout.tags : [],
                };
                return (
                  <WorkoutCard
                    key={workout.id}
                    workout={workoutForCard}
                    programId={programId}
                    onDelete={onDeleteWorkout}
                    onToggleComplete={onToggleComplete}
                    onChangeDate={onChangeDateWorkout}
                  />
                );
              }

              // For skeleton workouts, show simple view
              return (
                <View
                  key={workout.id}
                  style={[
                    styles.workoutDetail,
                    { backgroundColor: theme.colors.surfaceVariant + "30" },
                  ]}
                >
                  <Text variant="titleSmall" style={styles.workoutTitle}>
                    {workout.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.workoutBody}>
                    {workout.body_skeleton || workout.body || "No content"}
                  </Text>
                  {week.status === "skeleton" && (
                    <View
                      style={[
                        styles.skeletonNote,
                        {
                          backgroundColor: theme.colors.tertiaryContainer + "30",
                        },
                      ]}
                    >
                      <Text
                        variant="labelSmall"
                        style={{ color: theme.colors.onTertiaryContainer }}
                      >
                        Skeleton version - Click "Add Full Details" to add
                        training cues, warm-up, cool-down, and scaling options.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Enhancement Action */}
        {week.status === "skeleton" && (
          <View style={styles.enhanceSection}>
            <TextInput
              mode="outlined"
              placeholder="Optional: Add notes for this week..."
              value={weekNote}
              onChangeText={onNoteChange}
              multiline
              numberOfLines={2}
              style={styles.noteInput}
              dense
            />
            <Button
              mode="contained"
              onPress={onEnhance}
              disabled={isEnhancing}
              icon={({ size, color }) =>
                isEnhancing ? (
                  <Loader2 size={size} color={color} />
                ) : (
                  <Sparkles size={size} color={color} />
                )
              }
              style={styles.enhanceButton}
            >
              {isEnhancing
                ? `Enhancing Week ${week.weekNumber}...`
                : `Add Full Details (~2-3 min)`}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weekBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  weekTitle: {
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  previewItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  dayLabel: {
    opacity: 0.6,
  },
  focusLabel: {
    fontWeight: "500",
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#00000010",
    paddingTop: 16,
    marginTop: 8,
    gap: 12,
  },
  workoutDetail: {
    padding: 12,
    borderRadius: 8,
  },
  workoutTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  workoutBody: {
    opacity: 0.8,
    lineHeight: 20,
  },
  skeletonNote: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
  },
  enhanceSection: {
    marginTop: 16,
    gap: 12,
  },
  noteInput: {
    fontSize: 14,
  },
  enhanceButton: {
    marginTop: 4,
  },
});
