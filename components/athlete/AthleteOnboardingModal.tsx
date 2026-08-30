import { useState } from "react";
import { View, StyleSheet, ScrollView, Modal } from "react-native";
import { Text, Button, TextInput, Surface, ProgressBar } from "react-native-paper";
import { Check, Dumbbell, Trophy, Sparkles, ChartBar } from "lucide-react-native";
import { brandColors } from "@/app/_layout";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";

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
  gymName,
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
            <Text style={styles.welcomeEmoji}>🏋️</Text>
            <Text variant="headlineMedium" style={styles.welcomeTitle}>
              Welcome to HalteresAI!
            </Text>
            <Text variant="bodyMedium" style={styles.welcomeText}>
              Let's get you set up so you can start tracking your workouts and crushing goals.
            </Text>

            <Surface style={styles.featuresCard} elevation={1}>
              <Text variant="titleSmall" style={styles.featuresTitle}>
                Here's what you can do:
              </Text>
              <View style={styles.featureRow}>
                <Check size={18} color={brandColors.thrivingGreen.DEFAULT} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  View today's personalized workouts
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Check size={18} color={brandColors.thrivingGreen.DEFAULT} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Log your results and track PRs
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Check size={18} color={brandColors.thrivingGreen.DEFAULT} />
                <Text variant="bodyMedium" style={styles.featureText}>
                  Get AI-powered feedback on performance
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
              onChangeText={(text) => setFormData({ ...formData, display_name: text })}
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
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
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
                  onChangeText={(text) => setFormData({ ...formData, squat_1rm: text })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Deadlift 1RM (kg)"
                  value={formData.deadlift_1rm}
                  onChangeText={(text) => setFormData({ ...formData, deadlift_1rm: text })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Bench 1RM (kg)"
                  value={formData.bench_1rm}
                  onChangeText={(text) => setFormData({ ...formData, bench_1rm: text })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Mile Time"
                  value={formData.mile_time}
                  onChangeText={(text) => setFormData({ ...formData, mile_time: text })}
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
                  onChangeText={(text) => setFormData({ ...formData, weight_kg: text })}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.metricInput}
                />
              </View>
              <View style={styles.metricField}>
                <TextInput
                  label="Height (cm)"
                  value={formData.height_cm}
                  onChangeText={(text) => setFormData({ ...formData, height_cm: text })}
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
            <Text style={styles.welcomeEmoji}>🎉</Text>
            <Text variant="headlineMedium" style={styles.welcomeTitle}>
              You're All Set!
            </Text>
            <Text variant="bodyMedium" style={styles.welcomeText}>
              Time to start crushing workouts and setting PRs.
            </Text>

            <Surface style={styles.tipsCard} elevation={1}>
              <Text variant="titleSmall" style={styles.tipsTitle}>
                Quick Tips:
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Check your dashboard daily for today's workouts
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Log your results immediately after each workout
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Request AI feedback for personalized guidance
              </Text>
              <Text variant="bodySmall" style={styles.tipText}>
                • Track your PRs and progress over time
              </Text>
            </Surface>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={(currentStep + 1) / ONBOARDING_STEPS.length}
            color={brandColors.smartBlue.DEFAULT}
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
              {currentStep === ONBOARDING_STEPS.length - 2 ? "Almost Done" : "Next"}
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
    backgroundColor: "#fff",
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
    backgroundColor: brandColors.smartBlue.DEFAULT,
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
    backgroundColor: "#f8f9fa",
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
    backgroundColor: brandColors.smartBlue.container,
  },
  tipsTitle: {
    fontWeight: "600",
    color: brandColors.smartBlue.DEFAULT,
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
