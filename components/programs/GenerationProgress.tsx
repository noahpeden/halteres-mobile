import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  ProgressBar,
  Text,
  useTheme,
} from "react-native-paper";
import type {
  GenerationStage,
  StreamingWorkout,
} from "@/hooks/useProgramGeneration";

type GenerationProgressProps = {
  stage: GenerationStage;
  progress: { current: number; total: number };
  streamingWorkouts: StreamingWorkout[];
  duration: number;
  error: string | null;
  onCancel: () => void;
  onRetry?: () => void;
};

const stageLabels: Record<GenerationStage, string> = {
  idle: "Ready",
  preparing: "Preparing program data...",
  generating: "Starting generation...",
  streaming: "Generating workouts...",
  complete: "Generation complete!",
  error: "Generation failed",
  retrying: "Retrying...",
};

export function GenerationProgress({
  stage,
  progress,
  streamingWorkouts,
  duration,
  error,
  onCancel,
  onRetry,
}: GenerationProgressProps) {
  const theme = useTheme();

  const progressPercent = useMemo(() => {
    if (progress.total === 0) return 0;
    return progress.current / progress.total;
  }, [progress]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isActive = [
    "preparing",
    "generating",
    "streaming",
    "retrying",
  ].includes(stage);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {isActive && (
              <ActivityIndicator size="small" style={styles.spinner} />
            )}
            <Text
              variant="titleMedium"
              style={[
                styles.stageLabel,
                stage === "error" && { color: theme.colors.error },
                stage === "complete" && { color: theme.colors.primary },
              ]}
            >
              {stageLabels[stage]}
            </Text>
          </View>
          {isActive && (
            <Text variant="bodySmall" style={styles.duration}>
              {formatDuration(duration)}
            </Text>
          )}
        </View>

        {/* Progress bar */}
        {(stage === "streaming" || stage === "complete") && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progressPercent}
              color={
                stage === "complete"
                  ? theme.colors.primary
                  : theme.colors.secondary
              }
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressText}>
              {progress.current} / {progress.total} workouts
            </Text>
          </View>
        )}

        {/* Error message */}
        {stage === "error" && error && (
          <View style={styles.errorContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {error}
            </Text>
            {onRetry && (
              <Button
                mode="outlined"
                onPress={onRetry}
                style={styles.retryButton}
                compact
              >
                Try Again
              </Button>
            )}
          </View>
        )}

        {/* Streaming workouts preview */}
        {streamingWorkouts.length > 0 && (
          <View style={styles.workoutsPreview}>
            <Text variant="labelMedium" style={styles.previewLabel}>
              Generated Workouts
            </Text>
            <ScrollView
              style={styles.workoutsList}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {streamingWorkouts.slice(-5).map((workout, index) => (
                <View key={workout.id || index} style={styles.workoutItem}>
                  <Text
                    variant="bodySmall"
                    numberOfLines={1}
                    style={styles.workoutTitle}
                  >
                    ✓ {workout.title}
                  </Text>
                  {workout.scheduled_date && (
                    <Text variant="labelSmall" style={styles.workoutDate}>
                      {new Date(workout.scheduled_date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </Text>
                  )}
                </View>
              ))}
              {streamingWorkouts.length > 5 && (
                <Text variant="labelSmall" style={styles.moreText}>
                  ...and {streamingWorkouts.length - 5} more
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Cancel button */}
        {isActive && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
            textColor={theme.colors.error}
          >
            Cancel
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinner: {
    marginRight: 8,
  },
  stageLabel: {
    fontWeight: "600",
  },
  duration: {
    opacity: 0.7,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 4,
    opacity: 0.7,
    textAlign: "center",
  },
  errorContainer: {
    marginBottom: 12,
  },
  retryButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  workoutsPreview: {
    marginTop: 8,
    marginBottom: 12,
  },
  previewLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  workoutsList: {
    maxHeight: 150,
  },
  workoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  workoutTitle: {
    flex: 1,
    marginRight: 8,
  },
  workoutDate: {
    opacity: 0.6,
  },
  moreText: {
    marginTop: 8,
    opacity: 0.5,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 8,
  },
});
