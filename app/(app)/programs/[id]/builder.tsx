import {
  type ProgramFormData,
  useProgramGeneration,
} from "@/hooks/useProgramGeneration";
import { useProgramDataMobile } from "@/hooks/useProgramDataMobile";
import { useProgramWorkoutsMobile } from "@/hooks/useProgramWorkoutsMobile";
import {
  daysOfWeek,
  difficulties,
  equipmentList,
  focusAreas,
  goals,
  gymEquipmentPresets,
  gymTypes,
} from "@/lib/constants/programConfig";
import { supabase } from "@/lib/supabase/client";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  List,
  Modal,
  Portal,
  ProgressBar,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type TabValue = "config" | "generate";

export default function ProgramBuilderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { program, isLoading: programLoading } = useProgramDataMobile(id);
  const { workouts, refetch: refetchWorkouts } = useProgramWorkoutsMobile(id);
  const {
    isGenerating,
    stage,
    progress,
    streamingWorkouts,
    error: generationError,
    duration,
    generateProgram,
    cancel,
  } = useProgramGeneration(id);

  const [activeTab, setActiveTab] = useState<TabValue>("config");

  // Form state
  const [formData, setFormData] = useState<Partial<ProgramFormData>>({
    name: "",
    description: "",
    trainingMethodology: "",
    gymType: "",
    equipment: [],
    daysOfWeek: [],
    numberOfWeeks: 4,
    daysPerWeek: 3,
    goal: "",
    difficulty: "",
    focusArea: "",
    personalization: "",
    referenceInput: "",
    workoutFormats: [],
    programType: "",
    entityId: "",
  });

  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);

  // Load program data into form
  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name || "",
        description: program.description || "",
        trainingMethodology: program.training_methodology || "",
        gymType: program.gym_details?.gym_type || "",
        equipment: [], // Will populate from gym_details.equipment labels
        daysOfWeek: program.calendar_data?.days_of_week?.map(String) || [],
        numberOfWeeks: program.duration_weeks || 4,
        daysPerWeek: program.calendar_data?.days_per_week || 3,
        goal: program.goal || "",
        difficulty: program.difficulty || "",
        focusArea: program.focus_area || "",
        personalization: program.personalization || "",
        referenceInput: program.reference_input || "",
        workoutFormats: program.workout_format || [],
        programType: program.periodization?.program_type || "",
        entityId: program.entity_id || "",
        startDate: program.calendar_data?.start_date || undefined,
        endDate: program.calendar_data?.end_date || undefined,
        sessionDetails: program.session_details || undefined,
        programOverview: program.program_overview || undefined,
        gymDetails: program.gym_details || undefined,
      });

      // Convert equipment labels to IDs
      if (program.gym_details?.equipment) {
        const equipmentIds = program.gym_details.equipment
          .map((label: string) => {
            const item = equipmentList.find((eq) => eq.label === label);
            return item?.value;
          })
          .filter((id): id is number => id !== undefined);
        setSelectedEquipment(equipmentIds);
      }
    }
  }, [program]);

  const updateFormData = (field: keyof ProgramFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    const current = formData.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    updateFormData("daysOfWeek", updated);
  };

  const toggleEquipment = (id: number) => {
    const updated = selectedEquipment.includes(id)
      ? selectedEquipment.filter((eq) => eq !== id)
      : [...selectedEquipment, id];
    setSelectedEquipment(updated);
  };

  const applyGymPreset = () => {
    if (formData.gymType && gymEquipmentPresets[formData.gymType]) {
      setSelectedEquipment(gymEquipmentPresets[formData.gymType]);
    }
  };

  const saveConfiguration = async () => {
    try {
      // Convert equipment IDs to labels
      const equipmentLabels = selectedEquipment
        .map((id) => {
          const item = equipmentList.find((eq) => eq.value === id);
          return item?.label;
        })
        .filter((label): label is string => label !== undefined);

      const updates = {
        name: formData.name,
        description: formData.description,
        training_methodology: formData.trainingMethodology,
        gym_details: {
          ...formData.gymDetails,
          gym_type: formData.gymType,
          equipment: equipmentLabels,
        },
        calendar_data: {
          ...formData,
          days_of_week: formData.daysOfWeek?.map(Number),
          days_per_week: formData.daysPerWeek,
          start_date: formData.startDate,
          end_date: formData.endDate,
        },
        duration_weeks: formData.numberOfWeeks,
        goal: formData.goal,
        difficulty: formData.difficulty,
        focus_area: formData.focusArea,
        personalization: formData.personalization,
        reference_input: formData.referenceInput,
        workout_format: formData.workoutFormats,
        periodization: {
          program_type: formData.programType,
        },
        session_details: formData.sessionDetails,
        program_overview: formData.programOverview,
      };

      const { error } = await supabase
        .from("programs")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Success", "Configuration saved");
    } catch (error) {
      console.error("Error saving configuration:", error);
      Alert.alert("Error", "Failed to save configuration");
    }
  };

  const validateForm = (): string | null => {
    if (!formData.trainingMethodology)
      return "Training Methodology is required";
    if (!formData.description) return "Description is required";
    if (!formData.daysOfWeek || formData.daysOfWeek.length === 0)
      return "Select at least one day of the week";
    if (!formData.gymType) return "Gym Type is required";
    return null;
  };

  const handleGenerate = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    const isRegeneration = workouts && workouts.length > 0;

    if (isRegeneration) {
      Alert.alert(
        "Regenerate Program",
        "This will replace all existing workouts. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: async () => {
              updateFormData("equipment", selectedEquipment);
              const result = await generateProgram(
                formData as ProgramFormData,
                true,
              );
              if (result.success) {
                await refetchWorkouts();
                Alert.alert(
                  "Success",
                  `Generated ${result.workoutsCreated} workouts`,
                );
                router.back();
              }
            },
          },
        ],
      );
    } else {
      updateFormData("equipment", selectedEquipment);
      const result = await generateProgram(formData as ProgramFormData, false);
      if (result.success) {
        await refetchWorkouts();
        Alert.alert("Success", `Generated ${result.workoutsCreated} workouts`);
        router.back();
      }
    }
  };

  if (programLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Program Builder",
          headerBackTitle: "Back",
        }}
      />

      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        buttons={[
          { value: "config", label: "Configuration" },
          { value: "generate", label: "Generate" },
        ]}
        style={styles.tabs}
      />

      {activeTab === "config" ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.card}>
            <Card.Title title="Required Fields" />
            <Card.Content>
              <TextInput
                label="Program Name *"
                value={formData.name}
                onChangeText={(text) => updateFormData("name", text)}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Description *"
                value={formData.description}
                onChangeText={(text) => updateFormData("description", text)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <TextInput
                label="Training Methodology *"
                value={formData.trainingMethodology}
                onChangeText={(text) =>
                  updateFormData("trainingMethodology", text)
                }
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Describe your training approach, principles, and philosophy..."
                style={styles.input}
              />

              <Text variant="labelLarge" style={styles.label}>
                Gym Type *
              </Text>
              <View style={styles.chipContainer}>
                {gymTypes.slice(0, 6).map((type) => (
                  <Chip
                    key={type.value}
                    selected={formData.gymType === type.value}
                    onPress={() => updateFormData("gymType", type.value)}
                    style={styles.chip}
                  >
                    {type.label}
                  </Chip>
                ))}
              </View>

              <Text variant="labelLarge" style={styles.label}>
                Days of Week * ({formData.daysOfWeek?.length || 0} selected)
              </Text>
              <View style={styles.chipContainer}>
                {daysOfWeek.map((day) => (
                  <Chip
                    key={day.value}
                    selected={formData.daysOfWeek?.includes(day.value)}
                    onPress={() => toggleDay(day.value)}
                    style={styles.chip}
                  >
                    {day.label}
                  </Chip>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    label="Weeks"
                    value={String(formData.numberOfWeeks)}
                    onChangeText={(text) =>
                      updateFormData("numberOfWeeks", parseInt(text, 10) || 4)
                    }
                    mode="outlined"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <TextInput
                    label="Days/Week"
                    value={String(formData.daysPerWeek)}
                    onChangeText={(text) =>
                      updateFormData("daysPerWeek", parseInt(text, 10) || 3)
                    }
                    mode="outlined"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Equipment" />
            <Card.Content>
              <Button
                mode="outlined"
                onPress={() => setEquipmentModalVisible(true)}
                style={styles.button}
              >
                Select Equipment ({selectedEquipment.length} selected)
              </Button>
              {formData.gymType && (
                <Button mode="text" onPress={applyGymPreset}>
                  Apply {formData.gymType} Preset
                </Button>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Optional Fields" />
            <Card.Content>
              <Text variant="labelLarge" style={styles.label}>
                Goal
              </Text>
              <View style={styles.chipContainer}>
                {goals.map((goal) => (
                  <Chip
                    key={goal.value}
                    selected={formData.goal === goal.value}
                    onPress={() => updateFormData("goal", goal.value)}
                    style={styles.chip}
                  >
                    {goal.label}
                  </Chip>
                ))}
              </View>

              <Text variant="labelLarge" style={styles.label}>
                Difficulty
              </Text>
              <SegmentedButtons
                value={formData.difficulty || ""}
                onValueChange={(value) => updateFormData("difficulty", value)}
                buttons={difficulties.map((d) => ({
                  value: d.value,
                  label: d.label,
                }))}
                style={styles.segmented}
              />

              <Text variant="labelLarge" style={styles.label}>
                Focus Area
              </Text>
              <View style={styles.chipContainer}>
                {focusAreas.map((area) => (
                  <Chip
                    key={area.value}
                    selected={formData.focusArea === area.value}
                    onPress={() => updateFormData("focusArea", area.value)}
                    style={styles.chip}
                  >
                    {area.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Personalization"
                value={formData.personalization}
                onChangeText={(text) => updateFormData("personalization", text)}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Any specific needs, injuries, or preferences..."
                style={styles.input}
              />

              <TextInput
                label="Reference Workouts"
                value={formData.referenceInput}
                onChangeText={(text) => updateFormData("referenceInput", text)}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Reference workouts to include..."
                style={styles.input}
              />
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={saveConfiguration}
            style={styles.saveButton}
          >
            Save Configuration
          </Button>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          <Card style={styles.card}>
            <Card.Title title="Configuration Summary" />
            <Card.Content>
              <Text variant="bodyMedium">
                Name: {formData.name || "Not set"}
              </Text>
              <Text variant="bodyMedium">
                Duration: {formData.numberOfWeeks} weeks, {formData.daysPerWeek}{" "}
                days/week
              </Text>
              <Text variant="bodyMedium">
                Days: {formData.daysOfWeek?.join(", ") || "Not set"}
              </Text>
              <Text variant="bodyMedium">
                Gym: {formData.gymType || "Not set"}
              </Text>
              <Text variant="bodyMedium">
                Equipment: {selectedEquipment.length} items
              </Text>

              {validateForm() && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {validateForm()}
                </Text>
              )}
            </Card.Content>
          </Card>

          {!isGenerating && (
            <Card style={styles.card}>
              <Card.Content>
                <Button
                  mode="contained"
                  onPress={handleGenerate}
                  disabled={!!validateForm()}
                  style={styles.button}
                >
                  {workouts && workouts.length > 0
                    ? "Regenerate Program"
                    : "Generate Program"}
                </Button>
              </Card.Content>
            </Card>
          )}

          {isGenerating && (
            <Card style={styles.card}>
              <Card.Title
                title={`Generating... (${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")})`}
              />
              <Card.Content>
                <Text variant="bodyMedium" style={styles.stageText}>
                  Stage: {stage}
                </Text>
                <ProgressBar
                  progress={
                    progress.total > 0 ? progress.current / progress.total : 0
                  }
                  style={styles.progressBar}
                />
                <Text variant="bodySmall">
                  {progress.current} / {progress.total} workouts
                </Text>

                {streamingWorkouts.length > 0 && (
                  <View style={styles.workoutsList}>
                    <Text variant="titleSmall" style={styles.workoutsTitle}>
                      Workouts Created:
                    </Text>
                    {streamingWorkouts.map((workout, index) => (
                      <Card key={workout.id} style={styles.workoutCard}>
                        <Card.Content>
                          <Text variant="bodyMedium" numberOfLines={1}>
                            {index + 1}. {workout.title}
                          </Text>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}

                <Button mode="outlined" onPress={cancel} style={styles.button}>
                  Cancel
                </Button>
              </Card.Content>
            </Card>
          )}

          {generationError && (
            <Card style={styles.card}>
              <Card.Title title="Error" />
              <Card.Content>
                <Text variant="bodyMedium" style={styles.errorText}>
                  {generationError}
                </Text>
                <Button
                  mode="contained"
                  onPress={handleGenerate}
                  style={styles.button}
                >
                  Retry
                </Button>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      )}

      <Portal>
        <Modal
          visible={equipmentModalVisible}
          onDismiss={() => setEquipmentModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Select Equipment
          </Text>
          <ScrollView style={styles.modalScroll}>
            {equipmentList.map((item) => (
              <List.Item
                key={item.value}
                title={item.label}
                onPress={() => toggleEquipment(item.value)}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={
                      selectedEquipment.includes(item.value)
                        ? "checkbox-marked"
                        : "checkbox-blank-outline"
                    }
                  />
                )}
              />
            ))}
          </ScrollView>
          <Button
            mode="contained"
            onPress={() => {
              updateFormData("equipment", selectedEquipment);
              setEquipmentModalVisible(false);
            }}
            style={styles.modalButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabs: {
    margin: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  button: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  segmented: {
    marginBottom: 12,
  },
  errorText: {
    color: "#d32f2f",
    marginTop: 8,
  },
  stageText: {
    marginBottom: 8,
  },
  progressBar: {
    marginVertical: 12,
  },
  workoutsList: {
    marginTop: 16,
  },
  workoutsTitle: {
    marginBottom: 8,
  },
  workoutCard: {
    marginBottom: 4,
    elevation: 1,
  },
  modal: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: "80%",
  },
  modalTitle: {
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalButton: {
    marginTop: 16,
  },
});
