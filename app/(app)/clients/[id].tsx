import { brandColors } from "@/app/_layout";
import {
  useClient,
  useDeleteClient,
  useUpdateClient,
  type ClientMetrics,
} from "@/hooks/useClients";
import type { EntityType } from "@/lib/validations/program.schema";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  Edit2,
  Save,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

// Unit conversion helpers
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

// Format helpers for display
const formatWeight = (kg: number | null | undefined, imperial: boolean): string => {
  if (!kg) return "—";
  if (imperial) {
    return `${Math.round(kgToLbs(kg))} lbs`;
  }
  return `${Math.round(kg)} kg`;
};

const formatHeight = (cm: number | null | undefined, imperial: boolean): string => {
  if (!cm) return "—";
  if (imperial) {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${cm} cm`;
};

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const { data: client, isLoading, refetch } = useClient(id);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isEditing, setIsEditing] = useState(false);
  const [useImperial, setUseImperial] = useState(true);

  // Editable fields
  const [name, setName] = useState("");
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

  const isClient = client?.type === "CLIENT";

  // Initialize form when client data loads
  useEffect(() => {
    if (client) {
      setName(client.name || "");
      if (client.type === "CLIENT") {
        setBench1rm(client.bench_1rm ? kgToLbs(client.bench_1rm).toString() : "");
        setSquat1rm(client.squat_1rm ? kgToLbs(client.squat_1rm).toString() : "");
        setDeadlift1rm(client.deadlift_1rm ? kgToLbs(client.deadlift_1rm).toString() : "");
        setWeight(client.weight_kg ? kgToLbs(client.weight_kg).toString() : "");
        if (client.height_cm) {
          const { feet, inches } = cmToFeetInches(client.height_cm);
          setHeightFeet(feet.toString());
          setHeightInches(inches.toString());
          setHeightCm(client.height_cm.toString());
        }
        setMileTime(client.mile_time || "");
        setRecoveryScore(client.recovery_score?.toString() || "");
        setInjuryHistory(client.injury_history || "");
        setGender(client.gender || "");
      }
    }
  }, [client]);

  const toggleUnitSystem = () => {
    const newImperial = !useImperial;
    setUseImperial(newImperial);

    if (isEditing) {
      if (newImperial) {
        setBench1rm((prev) => (prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""));
        setSquat1rm((prev) => (prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""));
        setDeadlift1rm((prev) => (prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""));
        setWeight((prev) => (prev ? kgToLbs(Number.parseFloat(prev)).toString() : ""));
        if (heightCm) {
          const { feet, inches } = cmToFeetInches(Number.parseFloat(heightCm));
          setHeightFeet(feet.toString());
          setHeightInches(inches.toString());
        }
      } else {
        setBench1rm((prev) => (prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""));
        setSquat1rm((prev) => (prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""));
        setDeadlift1rm((prev) => (prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""));
        setWeight((prev) => (prev ? lbsToKg(Number.parseFloat(prev)).toString() : ""));
        const cm = feetInchesToCm(
          Number.parseFloat(heightFeet) || 0,
          Number.parseFloat(heightInches) || 0
        );
        setHeightCm(cm > 0 ? cm.toString() : "");
      }
    }
  };

  const handleSave = async () => {
    if (!client || !name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    let metrics: ClientMetrics | undefined;

    if (isClient) {
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
        recovery_score: recoveryScore ? Number.parseInt(recoveryScore, 10) : null,
        injury_history: injuryHistory || null,
        gender: gender || null,
      };
    }

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: { name, type: client.type, metrics },
      });
      setIsEditing(false);
      refetch();
      Alert.alert("Success", "Client updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update client");
    }
  };

  const handleDelete = () => {
    if (!client) return;

    Alert.alert(
      `Delete ${client.type === "CLIENT" ? "Client" : "Class"}?`,
      `Are you sure you want to delete "${client.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClient.mutateAsync(client.id);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete");
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    // Reset to original values
    if (client) {
      setName(client.name || "");
      if (client.type === "CLIENT") {
        setBench1rm(client.bench_1rm ? kgToLbs(client.bench_1rm).toString() : "");
        setSquat1rm(client.squat_1rm ? kgToLbs(client.squat_1rm).toString() : "");
        setDeadlift1rm(client.deadlift_1rm ? kgToLbs(client.deadlift_1rm).toString() : "");
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
      }
    }
    setUseImperial(true);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Client not found</Text>
          <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const accentColor = isClient ? brandColors.smartBlue : brandColors.thrivingGreen;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.header, { backgroundColor: theme.colors.surface }]}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={brandColors.practicalGray.DEFAULT} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <View style={[styles.headerIcon, { backgroundColor: accentColor.container }]}>
              {isClient ? (
                <User size={20} color={accentColor.DEFAULT} />
              ) : (
                <Users size={20} color={accentColor.DEFAULT} />
              )}
            </View>
            <View>
              <Text variant="titleLarge" style={styles.headerTitle}>
                {client.name}
              </Text>
              <Text variant="bodySmall" style={{ color: accentColor.DEFAULT }}>
                {isClient ? "Client" : "Class"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <Pressable onPress={handleCancel} style={styles.headerActionButton}>
                  <X size={20} color={brandColors.practicalGray.DEFAULT} />
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.headerActionButton, { backgroundColor: brandColors.smartBlue.container }]}
                >
                  <Save size={20} color={brandColors.smartBlue.DEFAULT} />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={() => setIsEditing(true)} style={styles.headerActionButton}>
                  <Edit2 size={20} color={brandColors.smartBlue.DEFAULT} />
                </Pressable>
                <Pressable onPress={handleDelete} style={styles.headerActionButton}>
                  <Trash2 size={20} color="#dc2626" />
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name Section */}
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Basic Info
            </Text>
            <View style={styles.card}>
              {isEditing ? (
                <View style={styles.field}>
                  <Text variant="labelMedium" style={styles.fieldLabel}>
                    Name
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={brandColors.practicalGray.lighter}
                    activeOutlineColor={brandColors.smartBlue.DEFAULT}
                  />
                </View>
              ) : (
                <View style={styles.displayField}>
                  <Text variant="labelMedium" style={styles.displayLabel}>
                    Name
                  </Text>
                  <Text variant="bodyLarge" style={styles.displayValue}>
                    {client.name}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Metrics Section (only for CLIENT type) */}
          {isClient && (
            <>
              {/* Unit Toggle */}
              <Animated.View entering={FadeInDown.duration(300).delay(150)} style={styles.unitToggleContainer}>
                <Pressable onPress={toggleUnitSystem} style={styles.unitToggle}>
                  <Text style={styles.unitToggleText}>
                    {useImperial ? "Imperial (lbs/ft)" : "Metric (kg/cm)"}
                  </Text>
                </Pressable>
              </Animated.View>

              {/* 1RM Lifts */}
              <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  1RM Lifts ({useImperial ? "lbs" : "kg"})
                </Text>
                <View style={styles.card}>
                  {isEditing ? (
                    <>
                      <View style={styles.row}>
                        <View style={styles.halfField}>
                          <Text variant="labelSmall" style={styles.fieldLabel}>
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
                          />
                        </View>
                        <View style={styles.halfField}>
                          <Text variant="labelSmall" style={styles.fieldLabel}>
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
                          />
                        </View>
                      </View>
                      <View style={styles.row}>
                        <View style={styles.halfField}>
                          <Text variant="labelSmall" style={styles.fieldLabel}>
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
                          />
                        </View>
                        <View style={styles.halfField} />
                      </View>
                    </>
                  ) : (
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text variant="labelSmall" style={styles.statLabel}>
                          Bench Press
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {formatWeight(client.bench_1rm, useImperial)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text variant="labelSmall" style={styles.statLabel}>
                          Squat
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {formatWeight(client.squat_1rm, useImperial)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text variant="labelSmall" style={styles.statLabel}>
                          Deadlift
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {formatWeight(client.deadlift_1rm, useImperial)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Physical Stats */}
              <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Physical Stats
                </Text>
                <View style={styles.card}>
                  {isEditing ? (
                    <>
                      <View style={styles.row}>
                        {useImperial ? (
                          <>
                            <View style={styles.thirdField}>
                              <Text variant="labelSmall" style={styles.fieldLabel}>
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
                              />
                            </View>
                            <View style={styles.thirdField}>
                              <Text variant="labelSmall" style={styles.fieldLabel}>
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
                              />
                            </View>
                          </>
                        ) : (
                          <View style={styles.halfField}>
                            <Text variant="labelSmall" style={styles.fieldLabel}>
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
                            />
                          </View>
                        )}
                        <View style={styles.thirdField}>
                          <Text variant="labelSmall" style={styles.fieldLabel}>
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
                          />
                        </View>
                      </View>
                      <View style={styles.row}>
                        <View style={styles.halfField}>
                          <Text variant="labelSmall" style={styles.fieldLabel}>
                            Mile Time
                          </Text>
                          <TextInput
                            value={mileTime}
                            onChangeText={setMileTime}
                            mode="outlined"
                            placeholder="e.g. 7:30"
                            style={styles.smallInput}
                            outlineColor={brandColors.practicalGray.lighter}
                            activeOutlineColor={brandColors.smartBlue.DEFAULT}
                          />
                        </View>
                        <View style={styles.halfField}>
                          <Text variant="labelSmall" style={styles.fieldLabel}>
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
                    </>
                  ) : (
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text variant="labelSmall" style={styles.statLabel}>
                          Height
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {formatHeight(client.height_cm, useImperial)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text variant="labelSmall" style={styles.statLabel}>
                          Weight
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {formatWeight(client.weight_kg, useImperial)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text variant="labelSmall" style={styles.statLabel}>
                          Mile Time
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {client.mile_time || "—"}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text variant="labelSmall" style={styles.statLabel}>
                          Gender
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {client.gender || "—"}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Recovery & Injuries */}
              <Animated.View entering={FadeInDown.duration(300).delay(400)} style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Recovery & Injuries
                </Text>
                <View style={styles.card}>
                  {isEditing ? (
                    <>
                      <View style={styles.field}>
                        <Text variant="labelSmall" style={styles.fieldLabel}>
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
                        />
                      </View>
                      <View style={styles.field}>
                        <Text variant="labelSmall" style={styles.fieldLabel}>
                          Injury History
                        </Text>
                        <TextInput
                          value={injuryHistory}
                          onChangeText={setInjuryHistory}
                          mode="outlined"
                          multiline
                          numberOfLines={4}
                          placeholder="List any relevant injuries"
                          style={styles.textArea}
                          outlineColor={brandColors.practicalGray.lighter}
                          activeOutlineColor={brandColors.smartBlue.DEFAULT}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.displayField}>
                        <Text variant="labelSmall" style={styles.displayLabel}>
                          Recovery Score
                        </Text>
                        <Text variant="headlineSmall" style={[styles.statValue, { color: accentColor.DEFAULT }]}>
                          {client.recovery_score ? `${client.recovery_score}/10` : "—"}
                        </Text>
                      </View>
                      <View style={[styles.displayField, { marginTop: 16 }]}>
                        <Text variant="labelSmall" style={styles.displayLabel}>
                          Injury History
                        </Text>
                        <Text variant="bodyMedium" style={styles.displayValue}>
                          {client.injury_history || "None reported"}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </Animated.View>
            </>
          )}

          {/* Save Button when editing */}
          {isEditing && (
            <Animated.View entering={FadeInDown.duration(300).delay(500)} style={styles.saveButtonContainer}>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={updateClient.isPending}
                disabled={updateClient.isPending || !name.trim()}
                style={styles.saveButton}
                buttonColor={brandColors.smartBlue.DEFAULT}
              >
                Save Changes
              </Button>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontWeight: "700",
    color: "#121212",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f7f9",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#121212",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 4,
    color: brandColors.practicalGray.DEFAULT,
  },
  input: {
    backgroundColor: "#ffffff",
  },
  smallInput: {
    backgroundColor: "#ffffff",
    height: 44,
  },
  textArea: {
    backgroundColor: "#ffffff",
    minHeight: 100,
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
  displayField: {
    marginBottom: 4,
  },
  displayLabel: {
    color: brandColors.practicalGray.DEFAULT,
    marginBottom: 4,
  },
  displayValue: {
    color: "#121212",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    minWidth: "30%",
    flex: 1,
  },
  statLabel: {
    color: brandColors.practicalGray.DEFAULT,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "700",
  },
  unitToggleContainer: {
    alignItems: "flex-end",
    marginBottom: 8,
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
  genderButtonGroup: {
    flexDirection: "row",
    gap: 6,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
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
    fontSize: 11,
    color: brandColors.practicalGray.DEFAULT,
  },
  genderButtonTextSelected: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
  },
  saveButtonContainer: {
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 12,
  },
});
