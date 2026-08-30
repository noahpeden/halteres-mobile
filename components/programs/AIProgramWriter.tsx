import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TwoPhaseWorkout } from "@/lib/types/twoPhaseGeneration";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Divider,
  FAB,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useProgramDataMobile } from "@/hooks/useProgramDataMobile";
import { useProgramWorkoutsMobile } from "@/hooks/useProgramWorkoutsMobile";
import { useTwoPhaseGeneration } from "@/hooks/useTwoPhaseGeneration";
import type { SearchWorkout } from "@/hooks/useWorkoutSearch";
import {
  equipmentList,
  gymEquipmentPresets,
} from "@/lib/constants/programConfig";
import { supabase } from "@/lib/supabase/client";
import { GenerationConfirmModal } from "./GenerationConfirmModal";
import { ProgramDetailsSection } from "./ProgramDetailsSection";
import { ProgramEssentials } from "./ProgramEssentials";
import { ProgramScheduling } from "./ProgramScheduling";
import { ReferenceWorkoutSearchModal } from "./ReferenceWorkoutSearchModal";
import { SkeletonPreview } from "./SkeletonPreview";
import { TwoPhaseProgress } from "./TwoPhaseProgress";
import { WorkoutList } from "./WorkoutList";

type AIProgramWriterProps = {
  programId: string;
};

type FormState = {
  name: string;
  description: string;
  trainingMethodology: string;
  programType: string;
  referenceInput: string;
  daysOfWeek: string[];
  numberOfWeeks: number;
  startDate: string;
  endDate: string;
  gymType: string;
  difficulty: string;
  equipment: number[];
  focusArea: string;
  sessionDuration: number;
  workoutFormats: string[];
  goal: string;
  entityId: string;
};

const defaultFormState: FormState = {
  name: "",
  description: "",
  trainingMethodology: "",
  programType: "linear",
  referenceInput: "",
  daysOfWeek: ["Monday", "Wednesday", "Friday"],
  numberOfWeeks: 8,
  startDate: "",
  endDate: "",
  gymType: "Other",
  difficulty: "intermediate",
  equipment: [],
  focusArea: "full_body",
  sessionDuration: 60,
  workoutFormats: ["standard"],
  goal: "strength",
  entityId: "",
};

export function AIProgramWriter({ programId }: AIProgramWriterProps) {
  const theme = useTheme();
  const router = useRouter();

  // Data hooks
  const {
    program,
    loading: programLoading,
    error: programError,
  } = useProgramDataMobile(programId);
  const {
    workouts,
    loading: workoutsLoading,
    refetch: refetchWorkouts,
    updateWorkoutDate,
    toggleWorkoutComplete,
    deleteWorkout,
  } = useProgramWorkoutsMobile(programId);
  // Two-phase generation hook
  const {
    stage,
    error: generationError,
    duration,
    isGenerating,
    isSkeletonComplete,
    skeletonProgress,
    skeletonWorkouts,
    enhancementProgress,
    enhancingWeek,
    weekNotes,
    setWeekNote,
    generateSkeleton,
    enhanceWeek,
    enhanceAllRemaining,
    cancel: cancelGeneration,
  } = useTwoPhaseGeneration(programId);

  // Self-coached: generation always available (no payments/subscription gating)
  const isEligibleToGenerate = true;

  // State for showing skeleton preview vs workout list
  const [showSkeletonPreview, setShowSkeletonPreview] = useState(false);

  // Check for existing skeleton workouts and auto-show enhance UI
  const existingSkeletonWorkouts = useMemo(() => {
    return workouts.filter((w) => w.generation_status === "skeleton");
  }, [workouts]);

  const hasSkeletonWorkouts = existingSkeletonWorkouts.length > 0;

  // Convert existing workouts to TwoPhaseWorkout format for SkeletonPreview
  const workoutsForPreview = useMemo((): TwoPhaseWorkout[] => {
    if (skeletonWorkouts.length > 0) {
      return skeletonWorkouts;
    }

    // Get start date from formState or program
    const startDateStr = formState?.startDate || program?.calendar_data?.start_date || program?.start_date;

    // Calculate week number from scheduled_date if not set
    const calculateWeekNumber = (scheduledDate?: string): number => {
      if (!scheduledDate || !startDateStr) return 1;
      const start = new Date(startDateStr);
      const workoutDate = new Date(scheduledDate);
      const diffTime = workoutDate.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.floor(diffDays / 7) + 1);
    };

    // Convert existing workouts to TwoPhaseWorkout format
    return workouts.map((w) => ({
      id: w.id,
      program_id: programId,
      title: w.title,
      body: w.body || null,
      body_skeleton: w.body_skeleton || w.body || null,
      generation_status: (w.generation_status || "detailed") as "skeleton" | "detailed",
      week_number: w.week_number || calculateWeekNumber(w.scheduled_date),
      scheduled_date: w.scheduled_date,
      is_reference: false,
      created_at: w.created_at || new Date().toISOString(),
      updated_at: w.updated_at || new Date().toISOString(),
    }));
  }, [workouts, skeletonWorkouts, programId, formState?.startDate, program]);

  // Form state
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReferenceSearchModal, setShowReferenceSearchModal] =
    useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Initialize form state from program data
  useEffect(() => {
    if (program) {
      const calendarData = program.calendar_data || {};
      const gymDetails = program.gym_details || {};
      const periodization = program.periodization || {};
      const sessionDetails = program.session_details || {};

      // Convert equipment names back to IDs if needed
      let equipmentIds: number[] = [];
      if (gymDetails.equipment && Array.isArray(gymDetails.equipment)) {
        const firstItem = gymDetails.equipment[0];
        if (typeof firstItem === "number") {
          equipmentIds = gymDetails.equipment.filter(
            (item): item is number => typeof item === "number",
          );
        } else {
          // Convert names to IDs
          equipmentIds = gymDetails.equipment
            .filter((item): item is string => typeof item === "string")
            .map((name) => equipmentList.find((e) => e.label === name)?.value)
            .filter((id): id is number => id !== undefined);
        }
      }

      // Apply gym preset if no equipment selected
      if (equipmentIds.length === 0 && gymDetails.gym_type) {
        equipmentIds = gymEquipmentPresets[gymDetails.gym_type] || [];
      }

      // Handle workout_format - might be {formats: [...]} object or direct array
      let workoutFormatsArray: string[] = ["standard"];
      if (program.workout_format) {
        if (Array.isArray(program.workout_format)) {
          workoutFormatsArray = program.workout_format;
        } else if (
          typeof program.workout_format === "object" &&
          "formats" in program.workout_format &&
          Array.isArray(
            (program.workout_format as { formats: string[] }).formats,
          )
        ) {
          workoutFormatsArray = (
            program.workout_format as { formats: string[] }
          ).formats;
        }
      }
      // Ensure we always have at least one format
      if (workoutFormatsArray.length === 0) {
        workoutFormatsArray = ["standard"];
      }

      setFormState({
        name: program.name || "",
        description: program.description || "",
        trainingMethodology: program.training_methodology || "",
        programType: periodization?.program_type || "linear",
        referenceInput: program.reference_input || "",
        daysOfWeek: calendarData.days_of_week_names || [
          "Monday",
          "Wednesday",
          "Friday",
        ],
        numberOfWeeks:
          calendarData.duration_weeks || program.duration_weeks || 4,
        startDate: calendarData.start_date || program.start_date || "",
        endDate: calendarData.end_date || program.end_date || "",
        gymType: gymDetails.gym_type || "Other",
        difficulty: program.difficulty || "intermediate",
        equipment: equipmentIds,
        focusArea: program.focus_area || "full_body",
        sessionDuration:
          (sessionDetails as any)?.duration_minutes ??
          (sessionDetails as any)?.duration ??
          60,
        workoutFormats: workoutFormatsArray,
        goal: program.goal || "strength",
        entityId: program.entity_id || "",
      });
    }
  }, [program]);

  // Calculate end date when start date or weeks change
  useEffect(() => {
    if (formState.startDate && formState.numberOfWeeks) {
      const start = new Date(formState.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + formState.numberOfWeeks * 7 - 1);
      const endDateStr = end.toISOString().split("T")[0];
      if (endDateStr !== formState.endDate) {
        setFormState((prev) => ({ ...prev, endDate: endDateStr }));
      }
    }
  }, [formState.startDate, formState.numberOfWeeks, formState.endDate]);

  // Update handlers
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    [],
  );

  const handleDayToggle = useCallback((day: string) => {
    setFormState((prev) => {
      const newDays = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: newDays };
    });
    setIsDirty(true);
  }, []);

  // Save to database
  const saveProgram = useCallback(async () => {
    if (!programId || !isDirty) return;

    setIsSaving(true);
    try {
      const equipmentNames = formState.equipment
        .map((id) => equipmentList.find((e) => e.value === id)?.label)
        .filter(Boolean);

      // Note: start_date and end_date are stored in calendar_data, not as top-level columns
      const updateData = {
        name: formState.name,
        description: formState.description,
        training_methodology: formState.trainingMethodology,
        reference_input: formState.referenceInput,
        duration_weeks: formState.numberOfWeeks,
        difficulty: formState.difficulty,
        focus_area: formState.focusArea,
        goal: formState.goal,
        workout_format: formState.workoutFormats,
        calendar_data: {
          start_date: formState.startDate,
          end_date: formState.endDate,
          duration_weeks: formState.numberOfWeeks,
          days_per_week: formState.daysOfWeek.length,
          days_of_week_names: formState.daysOfWeek,
        },
        gym_details: {
          gym_type: formState.gymType,
          equipment: equipmentNames,
        },
        periodization: {
          program_type: formState.programType,
        },
        session_details: {
          duration_minutes: formState.sessionDuration,
        },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("programs")
        .update(updateData)
        .eq("id", programId);

      if (error) throw error;

      setIsDirty(false);
      setSnackbarMessage("Program saved");
    } catch (err) {
      console.error("Error saving program:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setSnackbarMessage(`Error saving: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }, [programId, isDirty, formState]);

  // Auto-save on field blur
  const handleFieldBlur = useCallback(
    (_field: string) => {
      if (isDirty) {
        saveProgram();
      }
    },
    [isDirty, saveProgram],
  );

  // Validation items for confirm modal
  const validationItems = useMemo(() => {
    return [
      {
        label: "Training Methodology",
        value: formState.trainingMethodology || "Not selected",
        isValid: !!formState.trainingMethodology,
        errorMessage: "Select a training methodology",
      },
      {
        label: "Days of Week",
        value: `${formState.daysOfWeek.length} days selected`,
        isValid: formState.daysOfWeek.length > 0,
        errorMessage: "Select at least one day",
      },
      {
        label: "Number of Weeks",
        value: `${formState.numberOfWeeks} weeks`,
        isValid: formState.numberOfWeeks >= 1 && formState.numberOfWeeks <= 52,
        errorMessage: "Select 1–52 weeks",
      },
      {
        label: "Start Date",
        value: formState.startDate || "Not set",
        isValid: !!formState.startDate,
        errorMessage: "Set a start date",
      },
      {
        label: "Gym Type",
        value: formState.gymType || "Not selected",
        isValid: !!formState.gymType,
        errorMessage: "Select a gym type",
      },
      {
        label: "Equipment",
        value: `${formState.equipment.length} items`,
        isValid: formState.equipment.length > 0,
        errorMessage: "Select at least one equipment item",
      },
    ];
  }, [formState]);

  // Handle generation
  const handleGenerateClick = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmGeneration = useCallback(async () => {
    setShowConfirmModal(false);

    // If regenerating, delete existing non-reference workouts before generating
    if (workouts.length > 0) {
      try {
        await supabase
          .from("program_workouts")
          .delete()
          .eq("program_id", programId)
          .eq("is_reference", false);
        await refetchWorkouts();
      } catch (e) {
        // Proceed even if cleanup fails; server may handle forceRegenerate
      }
    }

    const formData = {
      name: formState.name,
      description: formState.description,
      goal: formState.goal,
      difficulty: formState.difficulty,
      focusArea: formState.focusArea,
      // Do not send empty personalization if referenceInput provided
      personalization:
        formState.referenceInput && formState.referenceInput.trim().length > 0
          ? undefined
          : "",
      referenceInput: formState.referenceInput,
      trainingMethodology: formState.trainingMethodology,
      numberOfWeeks: formState.numberOfWeeks,
      daysPerWeek: formState.daysOfWeek.length,
      daysOfWeek: formState.daysOfWeek,
      startDate: formState.startDate,
      endDate: formState.endDate,
      gymType: formState.gymType,
      equipment: formState.equipment,
      workoutFormats: formState.workoutFormats,
      sessionDetails: { duration_minutes: formState.sessionDuration },
      programType: formState.programType,
      entityId: formState.entityId,
      forceRegenerate: workouts.length > 0,
    };

    // Use two-phase skeleton generation
    const result = await generateSkeleton(formData);

    if (result.success) {
      setSnackbarMessage(`Created ${result.workoutsCreated} workout skeletons`);
      setShowSkeletonPreview(true);
      refetchWorkouts();
    }
  }, [formState, generateSkeleton, refetchWorkouts]);

  // Handle week enhancement
  const handleEnhanceWeek = useCallback(
    async (weekNumber: number, workoutIds: string[]) => {
      const equipmentNames = formState.equipment
        .map((id) => equipmentList.find((e) => e.value === id)?.label)
        .filter((label): label is string => !!label);

      const result = await enhanceWeek(weekNumber, workoutIds, {
        goal: formState.goal,
        difficulty: formState.difficulty,
        equipment: equipmentNames,
        trainingMethodology: formState.trainingMethodology,
        numberOfWeeks: formState.numberOfWeeks,
        session_details: { duration_minutes: formState.sessionDuration },
        workout_format: formState.workoutFormats,
        focus_area: formState.focusArea,
        referenceInput: formState.referenceInput,
        useImperial: true,
      });

      if (result.success) {
        setSnackbarMessage(
          `Enhanced Week ${weekNumber} (${result.workoutsCreated} workouts)`,
        );
        refetchWorkouts();
      } else {
        setSnackbarMessage(`Enhancement failed: ${result.error}`);
      }
    },
    [formState, enhanceWeek, refetchWorkouts],
  );

  // Handle enhance all remaining weeks
  // Options: { includeEnhanced: boolean } - if true, re-enhances already-enhanced weeks
  const handleEnhanceAll = useCallback(
    async (options?: { includeEnhanced?: boolean }) => {
      const { includeEnhanced = false } = options || {};

      // Import groupWorkoutsByWeek dynamically to group workouts
      const { groupWorkoutsByWeek } = await import("@/lib/types/twoPhaseGeneration");
      const weeks = groupWorkoutsByWeek(workoutsForPreview);

      // Filter based on options - either all weeks or just skeleton weeks
      const weeksToEnhance = includeEnhanced
        ? weeks
        : weeks.filter((w) => w.status === "skeleton");

      if (weeksToEnhance.length === 0) {
        setSnackbarMessage("All weeks are already enhanced!");
        return;
      }

      let totalEnhanced = 0;

      // Enhance each week sequentially
      for (const week of weeksToEnhance) {
        const workoutIds = week.workouts.map((w) => w.id);

        const equipmentNames = formState.equipment
          .map((id) => equipmentList.find((e) => e.value === id)?.label)
          .filter((label): label is string => !!label);

        const result = await enhanceWeek(week.weekNumber, workoutIds, {
          goal: formState.goal,
          difficulty: formState.difficulty,
          equipment: equipmentNames,
          trainingMethodology: formState.trainingMethodology,
          numberOfWeeks: formState.numberOfWeeks,
          session_details: { duration_minutes: formState.sessionDuration },
          workout_format: formState.workoutFormats,
          focus_area: formState.focusArea,
          referenceInput: formState.referenceInput,
          useImperial: true,
        });

        if (!result.success) {
          setSnackbarMessage(`Enhancement failed on Week ${week.weekNumber}: ${result.error}`);
          refetchWorkouts();
          return;
        }
        totalEnhanced += result.workoutsCreated;
      }

      setSnackbarMessage(`Enhanced all weeks (${totalEnhanced} workouts)`);
      setShowSkeletonPreview(false);
      refetchWorkouts();
    },
    [formState, workoutsForPreview, enhanceWeek, refetchWorkouts],
  );

  // Handle skeleton preview complete (view program)
  const _handleSkeletonComplete = useCallback(() => {
    setShowSkeletonPreview(false);
  }, []);

  // Handle workout actions
  const handleDeleteWorkout = useCallback(
    async (workoutId: string) => {
      Alert.alert(
        "Delete Workout",
        "Are you sure you want to delete this workout?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const result = await deleteWorkout(workoutId);
              if (result.success) {
                setSnackbarMessage("Workout deleted");
              } else {
                setSnackbarMessage(`Error: ${result.error}`);
              }
            },
          },
        ],
      );
    },
    [deleteWorkout],
  );

  const handleToggleComplete = useCallback(
    async (workoutId: string, completed: boolean) => {
      const result = await toggleWorkoutComplete(workoutId, completed);
      if (!result.success) {
        setSnackbarMessage(`Error: ${result.error}`);
      }
    },
    [toggleWorkoutComplete],
  );

  const handleChangeDateWorkout = useCallback(
    async (workoutId: string, newDate: string) => {
      const result = await updateWorkoutDate(workoutId, newDate);
      if (result.success) {
        setSnackbarMessage("Workout date updated");
      }
      return result;
    },
    [updateWorkoutDate],
  );

  // Handle reference workout selection from search modal
  const handleSelectReferenceWorkouts = useCallback(
    (selectedWorkouts: SearchWorkout[]) => {
      if (selectedWorkouts.length === 0) return;

      // Format selected workouts as reference text
      const referenceText = selectedWorkouts
        .map(
          (workout) =>
            `## ${workout.title}\n${workout.body || "No details available"}`,
        )
        .join("\n\n---\n\n");

      // Append to existing reference input or replace
      const existingInput = formState.referenceInput;
      const newInput = existingInput
        ? `${existingInput}\n\n---\n\n${referenceText}`
        : referenceText;

      updateField("referenceInput", newInput);
      setSnackbarMessage(
        `Added ${selectedWorkouts.length} reference workout(s)`,
      );
    },
    [formState.referenceInput, updateField],
  );

  if (programLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading program...</Text>
      </View>
    );
  }

  if (programError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {programError}
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Program Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.programName}>
            {formState.name || "Untitled Program"}
          </Text>
          {isSaving && (
            <Text variant="bodySmall" style={styles.savingText}>
              Saving...
            </Text>
          )}
        </View>

        {/* Two-Phase Generation Progress */}
        <TwoPhaseProgress
          visible={isGenerating}
          stage={stage}
          skeletonProgress={skeletonProgress}
          enhancementProgress={enhancementProgress}
          duration={duration}
          error={generationError}
          onCancel={cancelGeneration}
          onComplete={() => setShowSkeletonPreview(true)}
        />

        {/* Skeleton Preview (shown after skeleton generation OR when existing skeleton workouts exist) */}
        {(showSkeletonPreview && isSkeletonComplete) || (hasSkeletonWorkouts && !isGenerating) ? (
          <SkeletonPreview
            workouts={workoutsForPreview}
            weekNotes={weekNotes}
            onWeekNoteChange={setWeekNote}
            onEnhanceWeek={handleEnhanceWeek}
            onEnhanceAll={handleEnhanceAll}
            isEnhancing={
              stage === "enhancing_week" || stage === "enhancing_all"
            }
            enhancingWeek={enhancingWeek}
            // Action props for detailed workouts
            programId={programId}
            onDeleteWorkout={handleDeleteWorkout}
            onToggleComplete={handleToggleComplete}
            onChangeDateWorkout={(workoutId, currentDate) => {
              // For now, this triggers console log. Date picker would be implemented
              // as a separate modal. The WorkoutCard already has date change capability.
              console.log("Change date for workout:", workoutId, currentDate);
            }}
          />
        ) : null}

        {/* Form Sections */}
        <ProgramEssentials
          name={formState.name}
          trainingMethodology={formState.trainingMethodology}
          programType={formState.programType}
          description={formState.description}
          referenceInput={formState.referenceInput}
          onNameChange={(v) => updateField("name", v)}
          onTrainingMethodologyChange={(v) =>
            updateField("trainingMethodology", v)
          }
          onProgramTypeChange={(v) => updateField("programType", v)}
          onDescriptionChange={(v) => updateField("description", v)}
          onReferenceInputChange={(v) => updateField("referenceInput", v)}
          onFieldBlur={handleFieldBlur}
          onSearchWorkouts={() => setShowReferenceSearchModal(true)}
        />

        <ProgramScheduling
          selectedDays={formState.daysOfWeek}
          numberOfWeeks={formState.numberOfWeeks}
          startDate={formState.startDate}
          endDate={formState.endDate}
          onDayToggle={handleDayToggle}
          onWeeksChange={(v) => updateField("numberOfWeeks", v)}
          onStartDateChange={(v) => updateField("startDate", v)}
          onFieldBlur={handleFieldBlur}
        />

        <ProgramDetailsSection
          gymType={formState.gymType}
          difficulty={formState.difficulty}
          goal={formState.goal}
          selectedEquipment={formState.equipment}
          focusArea={formState.focusArea}
          sessionDuration={formState.sessionDuration}
          selectedFormats={formState.workoutFormats}
          onGymTypeChange={(v) => updateField("gymType", v)}
          onDifficultyChange={(v) => updateField("difficulty", v)}
          onGoalChange={(v) => updateField("goal", v)}
          onEquipmentChange={(v) => updateField("equipment", v)}
          onFocusAreaChange={(v) => updateField("focusArea", v)}
          onDurationChange={(v) => updateField("sessionDuration", v)}
          onFormatsChange={(v) => updateField("workoutFormats", v)}
          onFieldBlur={handleFieldBlur}
        />

        <Divider style={styles.divider} />

        {/* Workouts Section */}
        <View style={styles.workoutsSection}>
          <View style={styles.workoutsSectionHeader}>
            <Text variant="titleLarge" style={styles.workoutsSectionTitle}>
              Workouts
            </Text>
            <Text variant="bodySmall" style={styles.workoutCount}>
              {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <WorkoutList
            workouts={workouts}
            loading={workoutsLoading}
            numberOfWeeks={formState.numberOfWeeks}
            startDate={formState.startDate}
            programId={programId}
            onDeleteWorkout={handleDeleteWorkout}
            onToggleComplete={handleToggleComplete}
            onChangeDateWorkout={handleChangeDateWorkout}
          />
        </View>
      </ScrollView>

      {/* FAB Group */}
      <View style={styles.fabGroup}>
        {/* Generate FAB */}
        <FAB
          icon={workouts.length > 0 ? "refresh" : "play"}
          label={workouts.length > 0 ? "Regenerate" : "Generate"}
          onPress={handleGenerateClick}
          disabled={isGenerating}
          style={[
            styles.fab,
            workouts.length > 0 && {
              backgroundColor: theme.colors.errorContainer,
            },
          ]}
          color={workouts.length > 0 ? theme.colors.error : undefined}
        />
      </View>

      {/* Generation Confirm Modal */}
      <GenerationConfirmModal
        visible={showConfirmModal}
        isRegeneration={workouts.length > 0}
        validationItems={validationItems}
        existingWorkoutCount={workouts.length}
        onConfirm={handleConfirmGeneration}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Reference Workout Search Modal */}
      <ReferenceWorkoutSearchModal
        visible={showReferenceSearchModal}
        onDismiss={() => setShowReferenceSearchModal(false)}
        onSelect={handleSelectReferenceWorkouts}
      />

      {/* Snackbar */}
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage("")}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
  },
  header: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  programName: {
    fontWeight: "bold",
    flex: 1,
  },
  savingText: {
    opacity: 0.6,
  },
  divider: {
    marginVertical: 24,
  },
  workoutsSection: {
    marginTop: 8,
  },
  workoutsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  workoutsSectionTitle: {
    fontWeight: "bold",
  },
  workoutCount: {
    opacity: 0.7,
  },
  fabGroup: {
    position: "absolute",
    right: 16,
    bottom: 16,
    gap: 12,
    alignItems: "flex-end",
  },
  fab: {},
});
