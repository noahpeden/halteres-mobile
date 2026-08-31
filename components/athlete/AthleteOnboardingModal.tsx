import { Check } from "lucide-react-native";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  ProgressBar,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";
import { palette } from "@/lib/theme";

type Profile = {
  display_name?: string;
  full_name?: string;
  squat_1rm?: number;
  deadlift_1rm?: number;
  bench_1rm?: number;
  mile_time?: string;
  weight_kg?: number;
  height_cm?: number;
};

type Props = {
  profile?: Profile | null;
  gymName?: string;
  visible: boolean;
  onComplete: () => void;
};

const ONBOARDING_STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "profile", title: "Profile" },
  { id: "metrics", title: "Metrics" },
  { id: "complete", title: "Ready!" },
];

export default function AthleteOnboardingModal({
  profile,
  gymName: _gymName,
  visible,
  onComplete,
}: Props) {
  const { updateProfile, loading: saving } = useAthleteProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || profile?.full_name || "",
    squat_1rm: profile?.squat_1rm?.toString() || "",
    deadlift_1rm: profile?.deadlift_1rm?.toString() || "",
    bench_1rm: profile?.bench_1rm?.toString() || "",
    mile_time: profile?.mile_time || "",
    weight_kg: profile?.weight_kg?.toString() || "",
    height_cm: profile?.height_cm?.toString() || "",
  });

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const result = await updateProfile({
      ...formData,
      onboarding_completed: true,
    });

    if (result.success) {
      onComplete();
    }
  };

  const renderStep = () => {
    switch (ONBOARDING_STEPS[currentStep].id) {
      case "welcome":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.welcomeEmoji}>✎</Text>
            <Text variant="headlineMedium" style={styles.welcomeTitle}>
              Welcome to Halteres
            </Text>
            <Text variant="bodyMedium" style={styles.welcomeText}>
              A training companion for people who already train. Write a
              program, edit any day, log it.
            </Text>

            <Surface style={styles.featuresCard} elevation={1}>
              <Text variant="titleSmall" style={styles.featuresTitle}>
                The loop
              </Text>
              <View style={styles.featureRow}>
                <Check size={18} color={palette.green} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Today — what's on the floor
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Check size={18} color={palette.green} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Write a program, then generate the days
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Check size={18} color={palette.green} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Log the session while it's still in your hands
                </Text>
              </View>
            </Surface>
          </View>
        );

      case "profile":
        return (
          <View style={styles.stepContent}>
            <Text variant="titleLarge" style={styles.stepTitle}>
              Set Up Your Profile
            </Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>
              Choose a display name for your training
            </Text>

            <TextInput
              label="Display Name"
              value={formData.display_name}
              onChangeText={(text) =>
                setFormData({ ...formData, display_name: text })
              }
              mode="outlined"
              style={styles.input}
            />
            <Text variant="bodySmall" style={styles.inputHint}>
              This is how your name appears in the app
            </Text>
          </View>
        );

      case "metrics":
        return (
          <ScrollView
            style={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text variant="titleLarge" style={styles.stepTitle}>
              Your Baseline Metrics
            </Text>
            <Text variant="bodyMedium" style={styles.stepSubtitle}>
              Optional: Add your current PRs to personalize your experience
            </Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricField}>
                <TextInput
                  label="Squat 1RM (kg)"
                  value={formData.squat_1rm}
                  onChangeText={(text) =>
                    setFormData({ ...formData, squat_1rm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Deadlift 1RM (kg)"
                  value={formData.deadlift_1rm}
                  onChangeText={(text) =>
                    setFormData({ ...formData, deadlift_1rm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Bench 1RM (kg)"
                  value={formData.bench_1rm}
                  onChangeText={(text) =>
                    setFormData({ ...formData, bench_1rm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Mile Time"
                  value={formData.mile_time}
                  onChangeText={(text) =>
                    setFormData({ ...formData, mile_time: text })
                  }
                  mode="outlined"
                  placeholder="e.g. 7:30"
                  style={styles.metricInput}
                />
              </View>
            </View>

            <Text variant="titleSmall" style={styles.sectionLabel}>
              Body Metrics
            </Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricField}>
                <TextInput
                  label="Weight (kg)"
                  value={formData.weight_kg}
                  onChangeText={(text) =>
                    setFormData({ ...formData, weight_kg: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Height (cm)"
                  value={formData.height_cm}
                  onChangeText={(text) =>
                    setFormData({ ...formData, height_cm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
            </View>

            <Text variant="bodySmall" style={styles.skipHint}>
              You can skip this step and add metrics later from your profile.
            </Text>
          </ScrollView>
        );

      case "complete":
        return (
          <View style={styles.stepContent}>
            <Text style={styles.welcomeEmoji}>✓</Text>
            <Text variant="headlineMedium" style={styles.welcomeTitle}>
              The page is open.
            </Text>
            <Text variant="bodyMedium" style={styles.welcomeText}>
              Write a block, train the day, log the ink. That's the whole
              product.
            </Text>

            <Surface style={styles.tipsCard} elevation={1}>
              <Text variant="titleSmall" style={styles.tipsTitle}>
                Keep it easy
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Today is the home key — one thumb to log
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Programs is the writer, not a coach inbox
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Weeks are yours — don't lock yourself to eight
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Stuck? noah@halteres.ai
              </Text>
            </Surface>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={(currentStep + 1) / ONBOARDING_STEPS.length}
            color={palette.blue}
            style={styles.progressBar}
          />
          <View style={styles.stepsRow}>
            {ONBOARDING_STEPS.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.stepDot,
                  index <= currentStep && styles.stepDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>{renderStep()}</View>

        {/* Navigation */}
        <View style={styles.navRow}>
          {currentStep > 0 && currentStep < ONBOARDING_STEPS.length - 1 && (
            <Button mode="text" onPress={handleBack}>
              Back
            </Button>
          )}
          <View style={{ flex: 1 }} />
          {currentStep < ONBOARDING_STEPS.length - 1 ? (
            <Button mode="contained" onPress={handleNext}>
              {currentStep === ONBOARDING_STEPS.length - 2
                ? "Almost Done"
                : "Next"}
            </Button>
          ) : (
            <Button mode="contained" onPress={handleComplete} loading={saving}>
              Let's Go!
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paper,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  stepDotActive: {
    backgroundColor: palette.blue,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  welcomeEmoji: {
    fontSize: 64,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  welcomeTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 12,
  },
  welcomeText: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featuresCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: palette.paperSunken,
  },
  featuresTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    opacity: 0.8,
  },
  stepTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  stepSubtitle: {
    opacity: 0.7,
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  inputHint: {
    opacity: 0.5,
    marginLeft: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricField: {
    width: "47%",
  },
  metricInput: {
    fontSize: 14,
  },
  sectionLabel: {
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  skipHint: {
    opacity: 0.5,
    textAlign: "center",
    marginTop: 16,
  },
  tipsCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: palette.blueWash,
  },
  tipsTitle: {
    fontWeight: "600",
    color: palette.blue,
    marginBottom: 12,
  },
  tipText: {
    marginBottom: 8,
    opacity: 0.8,
    lineHeight: 20,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
  },
});
