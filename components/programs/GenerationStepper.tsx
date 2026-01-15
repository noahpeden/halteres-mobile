import {
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { ProgressBar, Text, useTheme } from "react-native-paper";
import type {
  EnhancementProgress,
  SkeletonProgress,
  TwoPhaseStage,
} from "@/lib/types/twoPhaseGeneration";

type GenerationStepperProps = {
  currentStep: number;
  generationStage: TwoPhaseStage;
  skeletonProgress: SkeletonProgress | null;
  enhancementProgress: EnhancementProgress | null;
};

type Step = {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  estimatedTime: string;
};

const steps: Step[] = [
  {
    id: "skeleton",
    label: "Generate Structure",
    description: "Creating workout skeleton",
    icon: FileText,
    estimatedTime: "~1-2min",
  },
  {
    id: "review",
    label: "Review & Adjust",
    description: "Approve or modify structure",
    icon: Clock,
    estimatedTime: "~1-2min",
  },
  {
    id: "enhance",
    label: "Add Full Details",
    description: "Enhance with cues & scaling",
    icon: Sparkles,
    estimatedTime: "~2-3min/week",
  },
  {
    id: "complete",
    label: "Complete",
    description: "Ready to use",
    icon: CheckCircle2,
    estimatedTime: "",
  },
];

export function GenerationStepper({
  currentStep,
  generationStage,
  skeletonProgress,
  enhancementProgress,
}: GenerationStepperProps) {
  const theme = useTheme();

  const getStepStatus = (
    stepIndex: number,
  ): "completed" | "active" | "pending" => {
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "active";
    return "pending";
  };

  const isGenerating =
    generationStage?.includes("generating") ||
    generationStage?.includes("enhancing");

  return (
    <View style={styles.container}>
      {/* Mobile Stepper (always shown since this is mobile) */}
      <View style={styles.mobileHeader}>
        <Text variant="bodySmall" style={styles.stepCounter}>
          Step {currentStep + 1} of {steps.length}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onPrimaryContainer }}
          >
            {steps[currentStep]?.label}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        progress={(currentStep + 1) / steps.length}
        color={theme.colors.primary}
        style={styles.progressBar}
      />

      {/* Step Description */}
      <View style={styles.stepDescription}>
        <Text variant="bodyMedium" style={styles.descriptionText}>
          {steps[currentStep]?.description}
        </Text>
        {steps[currentStep]?.estimatedTime && (
          <Text variant="bodySmall" style={styles.estimatedTime}>
            Estimated: {steps[currentStep]?.estimatedTime}
          </Text>
        )}
      </View>

      {/* Step Icons Row */}
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;
          const iconSize = 20;

          let backgroundColor = theme.colors.surfaceVariant;
          let iconColor = theme.colors.onSurfaceVariant;

          if (status === "completed") {
            backgroundColor = theme.colors.primary;
            iconColor = theme.colors.onPrimary;
          } else if (status === "active") {
            backgroundColor = theme.colors.primaryContainer;
            iconColor = theme.colors.primary;
          }

          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[styles.stepCircle, { backgroundColor }]}>
                {status === "completed" ? (
                  <Check size={iconSize} color={iconColor} />
                ) : status === "active" && isGenerating ? (
                  <Loader2 size={iconSize} color={iconColor} />
                ) : (
                  <Icon size={iconSize} color={iconColor} />
                )}
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor:
                        index < currentStep
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Skeleton Progress Details */}
      {currentStep === 0 && skeletonProgress && (
        <View
          style={[
            styles.progressDetails,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text variant="labelMedium">Generating skeleton...</Text>
            <Text variant="bodySmall" style={styles.progressCount}>
              Week {skeletonProgress.currentWeek} of{" "}
              {skeletonProgress.totalWeeks}
            </Text>
          </View>
          <ProgressBar
            progress={
              skeletonProgress.totalWeeks > 0
                ? skeletonProgress.currentWeek / skeletonProgress.totalWeeks
                : 0
            }
            color={theme.colors.primary}
            style={styles.detailProgressBar}
          />
        </View>
      )}

      {/* Enhancement Progress Details */}
      {currentStep === 2 && enhancementProgress && (
        <View
          style={[
            styles.progressDetails,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text variant="labelMedium">Enhancing workouts...</Text>
            <Text variant="bodySmall" style={styles.progressCount}>
              Week {enhancementProgress.weekNumber}:{" "}
              {enhancementProgress.currentWorkout} /{" "}
              {enhancementProgress.totalWorkoutsInWeek}
            </Text>
          </View>
          <ProgressBar
            progress={
              enhancementProgress.totalWorkoutsInWeek > 0
                ? enhancementProgress.currentWorkout /
                  enhancementProgress.totalWorkoutsInWeek
                : 0
            }
            color={theme.colors.primary}
            style={styles.detailProgressBar}
          />
        </View>
      )}
    </View>
  );
}

/**
 * Compact step indicator for inline use
 */
export function StepIndicator({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.indicatorContainer}>
      <View style={styles.indicatorDots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < step
                    ? theme.colors.primary
                    : i === step
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
              },
            ]}
          />
        ))}
      </View>
      <Text variant="bodySmall" style={styles.indicatorLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  mobileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stepCounter: {
    opacity: 0.6,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  stepDescription: {
    marginTop: 16,
    alignItems: "center",
  },
  descriptionText: {
    fontWeight: "500",
  },
  estimatedTime: {
    opacity: 0.6,
    marginTop: 4,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  connector: {
    width: 24,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  progressDetails: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressCount: {
    opacity: 0.6,
  },
  detailProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicatorDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorLabel: {
    opacity: 0.6,
  },
});
