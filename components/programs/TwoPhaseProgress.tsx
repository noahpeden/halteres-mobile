import { AlertCircle, CheckCircle2, Sparkles, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { Button, ProgressBar, Text, useTheme } from "react-native-paper";
import type {
  EnhancementProgress,
  SkeletonProgress,
  TwoPhaseStage,
} from "@/lib/types/twoPhaseGeneration";
import { GenerationStepper } from "./GenerationStepper";

type TwoPhaseProgressProps = {
  visible: boolean;
  stage: TwoPhaseStage;
  skeletonProgress: SkeletonProgress | null;
  enhancementProgress: EnhancementProgress | null;
  duration: number;
  error: string | null;
  onCancel: () => void;
  onComplete?: () => void;
};

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function estimateTimeRemaining(
  generated: number,
  total: number,
  elapsed: number,
): string {
  if (generated === 0 || elapsed === 0) return "calculating...";

  const rate = generated / elapsed;
  const remaining = total - generated;
  const estimatedSeconds = Math.round(remaining / rate);

  if (estimatedSeconds < 60) {
    return `${estimatedSeconds}s`;
  }
  const mins = Math.floor(estimatedSeconds / 60);
  const secs = estimatedSeconds % 60;
  return `${mins}m ${secs}s`;
}

export function TwoPhaseProgress({
  visible,
  stage,
  skeletonProgress,
  enhancementProgress,
  duration,
  error,
  onCancel,
  onComplete,
}: TwoPhaseProgressProps) {
  const theme = useTheme();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Calculate progress
  const totalWorkouts = skeletonProgress?.totalExpected || 0;
  const workoutsGenerated = skeletonProgress?.workoutsSaved || 0;
  const currentWeek = skeletonProgress?.currentWeek || 0;
  const totalWeeks = skeletonProgress?.totalWeeks || 0;

  const progress =
    totalWorkouts > 0
      ? workoutsGenerated / totalWorkouts
      : totalWeeks > 0
        ? currentWeek / totalWeeks
        : 0;

  // Animate progress bar
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timeout);
  }, [progress]);

  // Map stage to step index for stepper
  const getCurrentStep = (): number => {
    switch (stage) {
      case "preparing":
      case "generating_skeleton":
      case "skeleton_streaming":
      case "retrying":
        return 0;
      case "skeleton_complete":
        return 1;
      case "enhancing_week":
      case "enhancing_all":
        return 2;
      case "complete":
        return 3;
      default:
        return 0;
    }
  };

  const getStageInfo = () => {
    switch (stage) {
      case "preparing":
        return {
          title: "Preparing...",
          subtitle: "Setting up program generation",
        };
      case "generating_skeleton":
        return {
          title: "Creating Program Structure",
          subtitle: "Generating workout skeletons...",
        };
      case "skeleton_streaming":
        return {
          title: "Building Workouts",
          subtitle: "Streaming workout data...",
        };
      case "enhancing_week":
        return {
          title: "Adding Full Details",
          subtitle: `Enhancing Week ${enhancementProgress?.weekNumber || ""} with training cues and scaling...`,
        };
      case "enhancing_all":
        return {
          title: "Enhancing All Weeks",
          subtitle: "Adding details to remaining weeks...",
        };
      case "skeleton_complete":
        return {
          title: "Structure Complete!",
          subtitle: "Your program skeleton is ready for review",
        };
      case "complete":
        return {
          title: "Program Complete!",
          subtitle: "All workouts are ready to use",
        };
      case "error":
        return {
          title: "Generation Error",
          subtitle: error || "Something went wrong",
        };
      case "retrying":
        return {
          title: "Retrying...",
          subtitle: "Connection issue, retrying generation",
        };
      default:
        return {
          title: "Generating Program",
          subtitle: "Please wait...",
        };
    }
  };

  const { title, subtitle } = getStageInfo();
  const isComplete = stage === "skeleton_complete" || stage === "complete";
  const isError = stage === "error";
  const isGenerating =
    stage === "preparing" ||
    stage === "generating_skeleton" ||
    stage === "skeleton_streaming" ||
    stage === "enhancing_week" ||
    stage === "enhancing_all" ||
    stage === "retrying";

  const iconSize = 48;

  const getIcon = () => {
    if (isError) {
      return <AlertCircle size={iconSize} color={theme.colors.onError} />;
    }
    if (isComplete) {
      return <CheckCircle2 size={iconSize} color={theme.colors.onPrimary} />;
    }
    return <Sparkles size={iconSize} color={theme.colors.onPrimary} />;
  };

  const getIconBackground = () => {
    if (isError) return theme.colors.error;
    if (isComplete) return theme.colors.primary;
    return theme.colors.primary;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View
        style={[
          styles.overlay,
          { backgroundColor: theme.colors.background + "F5" },
        ]}
      >
        <View style={styles.content}>
          {/* Generation Stepper */}
          <GenerationStepper
            currentStep={getCurrentStep()}
            generationStage={stage}
            skeletonProgress={skeletonProgress}
            enhancementProgress={enhancementProgress}
          />

          {/* Animated icon */}
          <View style={styles.iconContainer}>
            {isGenerating && (
              <View
                style={[
                  styles.iconPing,
                  { backgroundColor: theme.colors.primary + "30" },
                ]}
              />
            )}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: getIconBackground() },
              ]}
            >
              {getIcon()}
            </View>
          </View>

          {/* Status text */}
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { opacity: 0.6 }]}
          >
            {subtitle}
          </Text>

          {/* Progress bar */}
          {isGenerating && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={animatedProgress}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          )}

          {/* Stats */}
          {!isError && (
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text
                  variant="headlineMedium"
                  style={{ color: theme.colors.primary }}
                >
                  {currentWeek}/{totalWeeks}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Weeks
                </Text>
              </View>
              <View style={styles.stat}>
                <Text
                  variant="headlineMedium"
                  style={{ color: theme.colors.secondary }}
                >
                  {workoutsGenerated}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Workouts
                </Text>
              </View>
              <View style={styles.stat}>
                <Text
                  variant="headlineMedium"
                  style={{ color: theme.colors.tertiary }}
                >
                  {formatTime(duration)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Elapsed
                </Text>
              </View>
            </View>
          )}

          {/* Estimated time remaining */}
          {isGenerating && workoutsGenerated > 0 && (
            <Text
              variant="bodySmall"
              style={[styles.estimate, { opacity: 0.5 }]}
            >
              Estimated time remaining: ~
              {estimateTimeRemaining(
                workoutsGenerated,
                totalWorkouts,
                duration,
              )}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {isGenerating && (
              <Button
                mode="text"
                onPress={onCancel}
                icon={({ size, color }) => <X size={size} color={color} />}
                textColor={theme.colors.error}
              >
                Cancel Generation
              </Button>
            )}

            {stage === "skeleton_complete" && (
              <Button
                mode="contained"
                onPress={onComplete || onCancel}
                icon={({ size, color }) => (
                  <CheckCircle2 size={size} color={color} />
                )}
              >
                Review Skeleton
              </Button>
            )}

            {stage === "complete" && (
              <Button
                mode="contained"
                onPress={onComplete || onCancel}
                icon={({ size, color }) => (
                  <CheckCircle2 size={size} color={color} />
                )}
              >
                View Program
              </Button>
            )}

            {isError && (
              <Button
                mode="contained"
                onPress={onCancel}
                buttonColor={theme.colors.error}
              >
                Close
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  iconPing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    minHeight: 20,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginBottom: 24,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    opacity: 0.6,
    marginTop: 4,
  },
  estimate: {
    textAlign: "center",
    marginBottom: 16,
  },
  actions: {
    marginTop: 8,
  },
});
