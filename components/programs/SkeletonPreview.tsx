import { Loader2, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, ProgressBar, Text, useTheme } from "react-native-paper";
import {
  groupWorkoutsByWeek,
  type TwoPhaseWorkout,
  type WeekData,
} from "@/lib/types/twoPhaseGeneration";
import { WeekCard } from "./WeekCard";

type EnhanceAllOptions = {
  includeEnhanced?: boolean;
};

type SkeletonPreviewProps = {
  workouts: TwoPhaseWorkout[];
  weekNotes: Record<number, string>;
  onWeekNoteChange: (weekNumber: number, note: string) => void;
  onEnhanceWeek: (weekNumber: number, workoutIds: string[]) => void;
  onEnhanceAll: (options?: EnhanceAllOptions) => void;
  isEnhancing: boolean;
  enhancingWeek: number | null;
  // Action props for detailed workouts
  programId?: string;
  onDeleteWorkout?: (workoutId: string) => void;
  onToggleComplete?: (workoutId: string, completed: boolean) => void;
  onChangeDateWorkout?: (workoutId: string, currentDate?: string) => void;
};

export function SkeletonPreview({
  workouts,
  weekNotes,
  onWeekNoteChange,
  onEnhanceWeek,
  onEnhanceAll,
  isEnhancing,
  enhancingWeek,
  // Action props for detailed workouts
  programId,
  onDeleteWorkout,
  onToggleComplete,
  onChangeDateWorkout,
}: SkeletonPreviewProps) {
  const theme = useTheme();
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>(
    {},
  );

  // Group workouts by week
  const groupedWeeks = groupWorkoutsByWeek(workouts);

  // Calculate stats
  const totalWeeks = groupedWeeks.length;
  const detailedWeeks = groupedWeeks.filter(
    (w) => w.status === "detailed",
  ).length;
  const skeletonWeeks = groupedWeeks.filter(
    (w) => w.status === "skeleton",
  ).length;

  const toggleWeekExpanded = (weekNumber: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNumber]: !prev[weekNumber],
    }));
  };

  const handleEnhanceWeek = (week: WeekData) => {
    const workoutIds = week.workouts.map((w) => w.id);
    onEnhanceWeek(week.weekNumber, workoutIds);
  };

  // Handle "Enhance All" button click - shows confirmation if weeks already enhanced
  const handleEnhanceAllClick = () => {
    if (detailedWeeks > 0) {
      // Show confirmation if some weeks are already enhanced
      Alert.alert(
        "Enhance Remaining Weeks?",
        `${detailedWeeks} week${detailedWeeks > 1 ? "s have" : " has"} already been enhanced and will be preserved. ${skeletonWeeks} week${skeletonWeeks > 1 ? "s" : ""} will be enhanced.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: `Re-enhance All (${totalWeeks})`,
            onPress: () => onEnhanceAll({ includeEnhanced: true }),
          },
          {
            text: `Enhance Rest (${skeletonWeeks})`,
            style: "default",
            onPress: () => onEnhanceAll(),
          },
        ]
      );
    } else {
      // No enhanced weeks, proceed directly
      onEnhanceAll();
    }
  };

  if (!workouts || workouts.length === 0) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Header */}
      <Card
        style={[
          styles.headerCard,
          {
            backgroundColor: theme.colors.primaryContainer + "30",
          },
        ]}
      >
        <Card.Content style={styles.headerContent}>
          <Text style={styles.emoji}>🎉</Text>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Program Structure Ready!
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {workouts.length} workouts across {totalWeeks} weeks. Review and add
            details below.
          </Text>
        </Card.Content>
      </Card>

      {/* Progress Bar */}
      <Card style={styles.progressCard}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <Text variant="titleSmall" style={styles.progressTitle}>
              Enhancement Progress
            </Text>
            <Text variant="bodySmall" style={styles.progressCount}>
              {detailedWeeks} of {totalWeeks} weeks detailed
            </Text>
          </View>
          <ProgressBar
            progress={totalWeeks > 0 ? detailedWeeks / totalWeeks : 0}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </Card.Content>
      </Card>

      {/* Week Cards */}
      <View style={styles.weeksContainer}>
        {groupedWeeks.map((week) => (
          <WeekCard
            key={week.weekNumber}
            week={week}
            isExpanded={expandedWeeks[week.weekNumber] || false}
            onToggleExpand={() => toggleWeekExpanded(week.weekNumber)}
            weekNote={weekNotes[week.weekNumber] || ""}
            onNoteChange={(note) => onWeekNoteChange(week.weekNumber, note)}
            onEnhance={() => handleEnhanceWeek(week)}
            isEnhancing={isEnhancing && enhancingWeek === week.weekNumber}
            // Action props for detailed workouts
            programId={programId}
            onDeleteWorkout={onDeleteWorkout}
            onToggleComplete={onToggleComplete}
            onChangeDateWorkout={onChangeDateWorkout}
          />
        ))}
      </View>

      {/* Bulk Enhancement Action */}
      {skeletonWeeks > 0 && (
        <Card style={styles.bulkCard}>
          <Card.Content style={styles.bulkContent}>
            <View style={styles.bulkInfo}>
              <Text variant="titleSmall">Enhance All Remaining Weeks</Text>
              <Text variant="bodySmall" style={styles.bulkEstimate}>
                {skeletonWeeks} weeks x ~2.5 min = ~
                {Math.round(skeletonWeeks * 2.5)} minutes total
              </Text>
            </View>
            <Button
              mode="outlined"
              onPress={handleEnhanceAllClick}
              disabled={isEnhancing}
              icon={({ size, color }) =>
                isEnhancing ? (
                  <Loader2 size={size} color={color} />
                ) : (
                  <Sparkles size={size} color={color} />
                )
              }
            >
              {isEnhancing ? "Enhancing..." : "Enhance All"}
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* All Complete Message */}
      {skeletonWeeks === 0 && totalWeeks > 0 && (
        <Card
          style={[
            styles.completeCard,
            { backgroundColor: theme.colors.primaryContainer + "30" },
          ]}
        >
          <Card.Content style={styles.completeContent}>
            <Text style={styles.completeEmoji}>✅</Text>
            <Text variant="titleMedium" style={styles.completeTitle}>
              All Weeks Enhanced!
            </Text>
            <Text variant="bodyMedium" style={styles.completeSubtitle}>
              Your program is ready to use with full coaching details.
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  headerContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontWeight: "600",
  },
  progressCount: {
    opacity: 0.6,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  weeksContainer: {
    gap: 12,
  },
  bulkCard: {
    marginTop: 16,
  },
  bulkContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  bulkInfo: {
    flex: 1,
    minWidth: 150,
  },
  bulkEstimate: {
    opacity: 0.6,
    marginTop: 4,
  },
  completeCard: {
    marginTop: 16,
    borderRadius: 16,
  },
  completeContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  completeEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  completeTitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  completeSubtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
});
