import { brandColors } from "@/app/_layout";
import type { Client, ClientMetrics, ClassMetrics } from "@/hooks/useClients";
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

type EditClientModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: EntityType;
    metrics?: ClientMetrics;
    classMetrics?: ClassMetrics;
  }) => Promise<void>;
  client: Client | null;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
};

export function EditClientModal({
  visible,
  onClose,
  onSubmit,
  client,
  isSubmitting = false,
  mode = "edit",
}: EditClientModalProps) {
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

  const isClientType = type === "CLIENT";
  const isClassType = type === "CLASS";

  // Initialize form when modal opens or client changes
  useEffect(() => {
    if (client && mode === "edit") {
      setName(client.name || "");
      setType(client.type || "CLIENT");

      if (client.type === "CLIENT") {
        // Convert to imperial by default
        setBench1rm(client.bench_1rm ? kgToLbs(client.bench_1rm).toString() : "");
        setSquat1rm(client.squat_1rm ? kgToLbs(client.squat_1rm).toString() : "");
        setDeadlift1rm(
          client.deadlift_1rm ? kgToLbs(client.deadlift_1rm).toString() : ""
        );
        setWeight(client.weight_kg ? kgToLbs(client.weight_kg).toString() : "");

        if (client.height_cm) {
          const { feet, inches } = cmToFeetInches(client.height_cm);
          setHeightFeet(feet.toString());
          setHeightInches(inches.toString());
          setHeightCm(client.height_cm.toString());
        } else {
          setHeightFeet("");
          setHeightInches("");
          setHeightCm("");
        }

        setMileTime(client.mile_time || "");
        setRecoveryScore(client.recovery_score?.toString() || "");
        setInjuryHistory(client.injury_history || "");
        setGender(client.gender || "");
        setUseImperial(true);
      }
    } else {
      // Reset for create mode
      resetForm();
    }
  }, [client, visible, mode]);

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

    try {
      await onSubmit({ name, type, metrics });
      resetForm();
    } catch (error) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const title = mode === "edit" ? "Edit Client/Class" : "Create Client/Class";

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
              {title}
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
                  { value: "CLIENT", label: "Client (Individual)", disabled: isSubmitting || mode === "edit" },
                  { value: "CLASS", label: "Class (Group)", disabled: isSubmitting || mode === "edit" },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Client Metrics (only for CLIENT type) */}
            {isClientType && (
              <View style={styles.metricsSection}>
                <View style={styles.metricsSectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Client Metrics
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

            {/* Class Info (only for CLASS type in edit mode) */}
            {isClassType && mode === "edit" && (
              <View style={styles.metricsSection}>
                <View style={styles.metricsSectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Class Information
                  </Text>
                </View>
                <View style={styles.classInfoBox}>
                  <Text style={styles.classInfoText}>
                    Class Size: {client?.class_size || "Not set"}
                  </Text>
                  <Text style={styles.classInfoText}>
                    Average Age: {client?.average_age || "Not set"}
                  </Text>
                  <Text style={styles.classInfoText}>
                    Elite Athletes: {client?.has_elite_athletes ? "Yes" : "No"}
                  </Text>
                  <Text style={styles.classInfoHint}>
                    Use Class Metrics tab for detailed editing
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
              {mode === "edit" ? "Update" : "Create"}
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
  // Class info styles
  classInfoBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  classInfoText: {
    fontSize: 14,
    color: "#121212",
  },
  classInfoHint: {
    fontSize: 12,
    color: brandColors.smartBlue.DEFAULT,
    marginTop: 8,
    fontStyle: "italic",
  },
});
