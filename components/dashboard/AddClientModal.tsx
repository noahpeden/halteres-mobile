import { brandColors } from "@/app/_layout";
import { useCreateClient, type ClientMetrics, type ClassMetrics, type SkillDistribution } from "@/hooks/useClients";
import type { EntityType } from "@/lib/validations/program.schema";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import Animated, { Easing, FadeIn, SlideInDown } from "react-native-reanimated";
import {
  Button,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";

// Unit conversion helpers (matching web app)
const kgToLbs = (kg: number | null | undefined): number =>
  kg ? Math.round(kg * 2.20462 * 10) / 10 : 0;
const lbsToKg = (lbs: number | null | undefined): number =>
  lbs ? Math.round((lbs / 2.20462) * 10) / 10 : 0;
const cmToFeetInches = (
  cm: number | null | undefined
): { feet: number; inches: number } => {
  if (!cm) return { feet: 0, inches: 0 };
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};
const feetInchesToCm = (feet: number, inches: number): number => {
  const ft = feet || 0;
  const inch = inches || 0;
  return Math.round((ft * 12 + inch) * 2.54);
};

type AddClientModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (entity: { id: string; name: string; type: EntityType }) => void;
};

export function AddClientModal({
  visible,
  onClose,
  onSuccess,
}: AddClientModalProps) {
  const createClient = useCreateClient();

  // Core fields
  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>("CLIENT");

  // Metrics (only for CLIENT type)
  const [useImperial, setUseImperial] = useState(true);
  const [bench1rm, setBench1rm] = useState("");
  const [squat1rm, setSquat1rm] = useState("");
  const [deadlift1rm, setDeadlift1rm] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weight, setWeight] = useState("");
  const [mileTime, setMileTime] = useState("");
  const [recoveryScore, setRecoveryScore] = useState("");
  const [injuryHistory, setInjuryHistory] = useState("");
  const [gender, setGender] = useState("");

  // Class metrics (only for CLASS type)
  const [classSize, setClassSize] = useState("");
  const [averageAge, setAverageAge] = useState("");
  const [hasEliteAthletes, setHasEliteAthletes] = useState(false);
  const [avgExperience, setAvgExperience] = useState("");
  const [classDuration, setClassDuration] = useState("60");
  const [warmupDuration, setWarmupDuration] = useState("15");

  const isClientType = type === "CLIENT";
  const isClassType = type === "CLASS";
  const isSubmitting = createClient.isPending;

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setName("");
    setType("CLIENT");
    setBench1rm("");
    setSquat1rm("");
    setDeadlift1rm("");
    setHeightFeet("");
    setHeightInches("");
    setHeightCm("");
    setWeight("");
    setMileTime("");
    setRecoveryScore("");
    setInjuryHistory("");
    setGender("");
    setUseImperial(true);
    // Reset class metrics
    setClassSize("");
    setAverageAge("");
    setHasEliteAthletes(false);
    setAvgExperience("");
    setClassDuration("60");
    setWarmupDuration("15");
  };

  const toggleUnitSystem = () => {
    const newImperial = !useImperial;
    setUseImperial(newImperial);

    // Convert values when toggling
    if (newImperial) {
      // Going to Imperial
      setBench1rm((prev) =>
        prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""
      );
      setSquat1rm((prev) =>
        prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""
      );
      setDeadlift1rm((prev) =>
        prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""
      );
      setWeight((prev) =>
        prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""
      );
      if (heightCm) {
        const { feet, inches } = cmToFeetInches(Number.parseFloat(heightCm));
        setHeightFeet(feet.toString());
        setHeightInches(inches.toString());
      }
    } else {
      // Going to Metric
      setBench1rm((prev) =>
        prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""
      );
      setSquat1rm((prev) =>
        prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""
      );
      setDeadlift1rm((prev) =>
        prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""
      );
      setWeight((prev) =>
        prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""
      );
      const cm = feetInchesToCm(
        Number.parseFloat(heightFeet) || 0,
        Number.parseFloat(heightInches) || 0
      );
      setHeightCm(cm > 0 ? cm.toString() : "");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    let metrics: ClientMetrics | undefined;
    let classMetrics: ClassMetrics | undefined;

    if (isClientType) {
      // Convert values back to metric (kg, cm) for storage
      const convertedBench = useImperial
        ? lbsToKg(Number.parseFloat(bench1rm) || 0)
        : Number.parseFloat(bench1rm) || null;
      const convertedSquat = useImperial
        ? lbsToKg(Number.parseFloat(squat1rm) || 0)
        : Number.parseFloat(squat1rm) || null;
      const convertedDeadlift = useImperial
        ? lbsToKg(Number.parseFloat(deadlift1rm) || 0)
        : Number.parseFloat(deadlift1rm) || null;
      const convertedWeight = useImperial
        ? lbsToKg(Number.parseFloat(weight) || 0)
        : Number.parseFloat(weight) || null;
      const convertedHeight = useImperial
        ? feetInchesToCm(
            Number.parseFloat(heightFeet) || 0,
            Number.parseFloat(heightInches) || 0
          )
        : Number.parseFloat(heightCm) || null;

      metrics = {
        bench_1rm: convertedBench || null,
        squat_1rm: convertedSquat || null,
        deadlift_1rm: convertedDeadlift || null,
        height_cm: convertedHeight || null,
        weight_kg: convertedWeight || null,
        mile_time: mileTime || null,
        recovery_score: recoveryScore
          ? Number.parseInt(recoveryScore, 10)
          : null,
        injury_history: injuryHistory || null,
        gender: gender || null,
      };
    }

    if (isClassType) {
      classMetrics = {
        class_size: classSize ? Number.parseInt(classSize, 10) : null,
        average_age: averageAge ? Number.parseInt(averageAge, 10) : null,
        has_elite_athletes: hasEliteAthletes,
        average_experience_years: avgExperience ? Number.parseFloat(avgExperience) : null,
        skill_distribution: { beginner: 33, intermediate: 34, advanced: 33 },
        class_duration_minutes: classDuration ? Number.parseInt(classDuration, 10) : 60,
        warmup_duration_minutes: warmupDuration ? Number.parseInt(warmupDuration, 10) : 15,
      };
    }

    try {
      const result = await createClient.mutateAsync({ name, type, metrics, classMetrics });
      const typeLabel = type === "CLASS" ? "Class" : "Client";
      Alert.alert("Success", `${typeLabel} created successfully`);
      resetForm();
      onClose();
      if (onSuccess && result) {
        onSuccess({ id: result.id, name: result.name, type: result.type });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create";
      Alert.alert("Error", message);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
          <Pressable style={styles.backdropPress} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.duration(250).easing(Easing.out(Easing.cubic))}
          style={styles.modal}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>
              Add New Client/Class
            </Text>
            <Pressable onPress={handleClose} disabled={isSubmitting}>
              <X size={24} color={brandColors.practicalGray.DEFAULT} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Name field */}
            <View style={styles.field}>
              <Text variant="labelLarge" style={styles.label}>
                Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                mode="outlined"
                placeholder="Enter name"
                style={styles.input}
                outlineColor={brandColors.practicalGray.lighter}
                activeOutlineColor={brandColors.smartBlue.DEFAULT}
                disabled={isSubmitting}
              />
            </View>

            {/* Type selector */}
            <View style={styles.field}>
              <Text variant="labelLarge" style={styles.label}>
                Type
              </Text>
              <SegmentedButtons
                value={type}
                onValueChange={(value) => setType(value as EntityType)}
                buttons={[
                  { value: "CLIENT", label: "Client (Individual)", disabled: isSubmitting },
                  { value: "CLASS", label: "Class (Group)", disabled: isSubmitting },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Client Metrics (only for CLIENT type) */}
            {isClientType && (
              <View style={styles.metricsSection}>
                <View style={styles.metricsSectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Client Metrics (Optional)
                  </Text>
                  <Pressable
                    onPress={toggleUnitSystem}
                    style={styles.unitToggle}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.unitToggleText}>
                      {useImperial ? "Imperial" : "Metric"}
                    </Text>
                  </Pressable>
                </View>

                {/* 1RM Lifts */}
                <Text variant="labelMedium" style={styles.subsectionLabel}>
                  1RM Lifts ({useImperial ? "lbs" : "kg"})
                </Text>
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Bench Press
                    </Text>
                    <TextInput
                      value={bench1rm}
                      onChangeText={setBench1rm}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Squat
                    </Text>
                    <TextInput
                      value={squat1rm}
                      onChangeText={setSquat1rm}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Deadlift
                    </Text>
                    <TextInput
                      value={deadlift1rm}
                      onChangeText={setDeadlift1rm}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                  <View style={styles.halfField} />
                </View>

                {/* Physical Stats */}
                <Text
                  variant="labelMedium"
                  style={[styles.subsectionLabel, { marginTop: 16 }]}
                >
                  Physical Stats
                </Text>
                <View style={styles.row}>
                  {useImperial ? (
                    <>
                      <View style={styles.thirdField}>
                        <Text variant="labelSmall" style={styles.smallLabel}>
                          Height (ft)
                        </Text>
                        <TextInput
                          value={heightFeet}
                          onChangeText={setHeightFeet}
                          mode="outlined"
                          keyboardType="numeric"
                          style={styles.smallInput}
                          outlineColor={brandColors.practicalGray.lighter}
                          activeOutlineColor={brandColors.smartBlue.DEFAULT}
                          disabled={isSubmitting}
                        />
                      </View>
                      <View style={styles.thirdField}>
                        <Text variant="labelSmall" style={styles.smallLabel}>
                          Height (in)
                        </Text>
                        <TextInput
                          value={heightInches}
                          onChangeText={setHeightInches}
                          mode="outlined"
                          keyboardType="numeric"
                          style={styles.smallInput}
                          outlineColor={brandColors.practicalGray.lighter}
                          activeOutlineColor={brandColors.smartBlue.DEFAULT}
                          disabled={isSubmitting}
                        />
                      </View>
                    </>
                  ) : (
                    <View style={styles.halfField}>
                      <Text variant="labelSmall" style={styles.smallLabel}>
                        Height (cm)
                      </Text>
                      <TextInput
                        value={heightCm}
                        onChangeText={setHeightCm}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.smallInput}
                        outlineColor={brandColors.practicalGray.lighter}
                        activeOutlineColor={brandColors.smartBlue.DEFAULT}
                        disabled={isSubmitting}
                      />
                    </View>
                  )}
                  <View style={styles.thirdField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Weight ({useImperial ? "lbs" : "kg"})
                    </Text>
                    <TextInput
                      value={weight}
                      onChangeText={setWeight}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Mile Time (min:sec)
                    </Text>
                    <TextInput
                      value={mileTime}
                      onChangeText={setMileTime}
                      mode="outlined"
                      placeholder="e.g. 7:30"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Gender
                    </Text>
                    <View style={styles.genderButtonGroup}>
                      {["Male", "Female", "Other"].map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => setGender(gender === g ? "" : g)}
                          style={[
                            styles.genderButton,
                            gender === g && styles.genderButtonSelected,
                          ]}
                          disabled={isSubmitting}
                        >
                          <Text
                            style={[
                              styles.genderButtonText,
                              gender === g && styles.genderButtonTextSelected,
                            ]}
                          >
                            {g}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Recovery & Injuries */}
                <Text
                  variant="labelMedium"
                  style={[styles.subsectionLabel, { marginTop: 16 }]}
                >
                  Recovery & Injuries
                </Text>
                <View style={styles.field}>
                  <Text variant="labelSmall" style={styles.smallLabel}>
                    Recovery Score (1-10)
                  </Text>
                  <TextInput
                    value={recoveryScore}
                    onChangeText={setRecoveryScore}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.smallInput}
                    outlineColor={brandColors.practicalGray.lighter}
                    activeOutlineColor={brandColors.smartBlue.DEFAULT}
                    disabled={isSubmitting}
                  />
                </View>
                <View style={styles.field}>
                  <Text variant="labelSmall" style={styles.smallLabel}>
                    Injury History
                  </Text>
                  <TextInput
                    value={injuryHistory}
                    onChangeText={setInjuryHistory}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    placeholder="List any relevant injuries"
                    style={styles.textArea}
                    outlineColor={brandColors.practicalGray.lighter}
                    activeOutlineColor={brandColors.smartBlue.DEFAULT}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            )}

            {/* Class Metrics (only for CLASS type) */}
            {isClassType && (
              <View style={styles.metricsSection}>
                <View style={styles.metricsSectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Class Metrics (Optional)
                  </Text>
                </View>

                {/* Class Demographics */}
                <Text variant="labelMedium" style={styles.subsectionLabel}>
                  Class Demographics
                </Text>
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Class Size
                    </Text>
                    <TextInput
                      value={classSize}
                      onChangeText={setClassSize}
                      mode="outlined"
                      keyboardType="numeric"
                      placeholder="e.g. 15"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Average Age
                    </Text>
                    <TextInput
                      value={averageAge}
                      onChangeText={setAverageAge}
                      mode="outlined"
                      keyboardType="numeric"
                      placeholder="e.g. 32"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Avg Experience (years)
                    </Text>
                    <TextInput
                      value={avgExperience}
                      onChangeText={setAvgExperience}
                      mode="outlined"
                      keyboardType="decimal-pad"
                      placeholder="e.g. 2.5"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                  <View style={styles.halfField} />
                </View>

                {/* Elite Athletes Toggle */}
                <View style={styles.eliteToggleRow}>
                  <View style={styles.eliteToggleInfo}>
                    <Text variant="labelMedium" style={styles.eliteToggleLabel}>
                      Elite Athletes Present
                    </Text>
                    <Text variant="bodySmall" style={styles.eliteToggleHint}>
                      Enable RX+ scaling options
                    </Text>
                  </View>
                  <Switch
                    value={hasEliteAthletes}
                    onValueChange={setHasEliteAthletes}
                    trackColor={{
                      false: brandColors.practicalGray.lighter,
                      true: brandColors.smartBlue.container,
                    }}
                    thumbColor={
                      hasEliteAthletes
                        ? brandColors.smartBlue.DEFAULT
                        : brandColors.practicalGray.light
                    }
                    disabled={isSubmitting}
                  />
                </View>

                {/* Time Constraints */}
                <Text
                  variant="labelMedium"
                  style={[styles.subsectionLabel, { marginTop: 16 }]}
                >
                  Time Constraints
                </Text>
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Class Duration (min)
                    </Text>
                    <TextInput
                      value={classDuration}
                      onChangeText={setClassDuration}
                      mode="outlined"
                      keyboardType="numeric"
                      placeholder="60"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text variant="labelSmall" style={styles.smallLabel}>
                      Warmup (min)
                    </Text>
                    <TextInput
                      value={warmupDuration}
                      onChangeText={setWarmupDuration}
                      mode="outlined"
                      keyboardType="numeric"
                      placeholder="15"
                      style={styles.smallInput}
                      outlineColor={brandColors.practicalGray.lighter}
                      activeOutlineColor={brandColors.smartBlue.DEFAULT}
                      disabled={isSubmitting}
                    />
                  </View>
                </View>

                <View style={styles.workoutWindowInfo}>
                  <Text style={styles.workoutWindowText}>
                    Workout Window:{" "}
                    {(Number.parseInt(classDuration) || 60) -
                      (Number.parseInt(warmupDuration) || 15)}{" "}
                    minutes
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !name.trim()}
              style={styles.submitButton}
              buttonColor={brandColors.smartBlue.DEFAULT}
            >
              Create
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropPress: {
    flex: 1,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontWeight: "700",
    color: "#121212",
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 0,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#121212",
  },
  input: {
    backgroundColor: "#ffffff",
  },
  segmentedButtons: {
    marginTop: 4,
  },
  metricsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  metricsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#121212",
  },
  unitToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: brandColors.smartBlue.container,
    borderRadius: 8,
  },
  unitToggleText: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
    fontSize: 12,
  },
  subsectionLabel: {
    color: brandColors.practicalGray.DEFAULT,
    marginBottom: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
  },
  thirdField: {
    flex: 1,
  },
  smallLabel: {
    marginBottom: 4,
    color: brandColors.practicalGray.DEFAULT,
  },
  smallInput: {
    backgroundColor: "#ffffff",
    height: 44,
  },
  textArea: {
    backgroundColor: "#ffffff",
    minHeight: 80,
  },
  genderButtonGroup: {
    flexDirection: "row",
    gap: 6,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brandColors.practicalGray.lighter,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  genderButtonSelected: {
    borderColor: brandColors.smartBlue.DEFAULT,
    backgroundColor: brandColors.smartBlue.container,
  },
  genderButtonText: {
    fontSize: 12,
    color: brandColors.practicalGray.DEFAULT,
  },
  genderButtonTextSelected: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flex: 1,
    borderColor: brandColors.practicalGray.lighter,
  },
  submitButton: {
    flex: 1,
  },
  // Class metrics styles
  eliteToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
  },
  eliteToggleInfo: {
    flex: 1,
    gap: 2,
  },
  eliteToggleLabel: {
    fontWeight: "600",
    color: "#121212",
  },
  eliteToggleHint: {
    color: brandColors.practicalGray.DEFAULT,
    fontSize: 12,
  },
  workoutWindowInfo: {
    padding: 12,
    backgroundColor: brandColors.smartBlue.container,
    borderRadius: 8,
    marginTop: 4,
  },
  workoutWindowText: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },
});
