import { useCallback, useRef, useState } from "react";
import { API_BASE } from "@/lib/api/getApiUrl";
import { createSSEClientWithPost } from "@/lib/api/sseClient";
import { dayNameToNumber, equipmentList } from "@/lib/constants/programConfig";
import { getAuthToken } from "@/lib/auth/token";
import type {
  EnhancementProgress,
  EnhancementSSEEvent,
  EnhanceWeekRequest,
  SkeletonGenerationRequest,
  SkeletonProgress,
  SkeletonSSEEvent,
  TwoPhaseStage,
  TwoPhaseWorkout,
} from "@/lib/types/twoPhaseGeneration";

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

export type ProgramFormData = {
  name: string;
  description: string;
  goal?: string;
  difficulty?: string;
  focusArea?: string;
  personalization?: string;
  referenceInput?: string;
  trainingMethodology: string;
  numberOfWeeks: number;
  daysPerWeek: number;
  daysOfWeek: string[];
  startDate?: string;
  endDate?: string;
  gymType: string;
  equipment: number[];
  workoutFormats?: string[];
  sessionDetails?: Record<string, unknown>;
  programType?: string;
  entityId: string;
  programOverview?: Record<string, unknown>;
  gymDetails?: Record<string, unknown>;
  forceRegenerate?: boolean;
};

export type TwoPhaseGenerationResult = {
  success: boolean;
  workoutsCreated: number;
  error?: string;
  stage?: TwoPhaseStage;
};

export function useTwoPhaseGeneration(programId: string) {
  // Stage and error state
  const [stage, setStage] = useState<TwoPhaseStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  // Skeleton phase state
  const [skeletonProgress, setSkeletonProgress] =
    useState<SkeletonProgress | null>(null);
  const [skeletonWorkouts, setSkeletonWorkouts] = useState<TwoPhaseWorkout[]>(
    [],
  );

  // Enhancement phase state
  const [enhancementProgress, setEnhancementProgress] =
    useState<EnhancementProgress | null>(null);
  const [enhancingWeek, setEnhancingWeek] = useState<number | null>(null);

  // Week notes (user adjustments per week)
  const [weekNotes, setWeekNotes] = useState<Record<number, string>>({});

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setError(null);
    setDuration(0);
    setSkeletonProgress(null);
    setSkeletonWorkouts([]);
    setEnhancementProgress(null);
    setEnhancingWeek(null);
  }, []);

  /**
   * Set a note for a specific week (used for user adjustments before enhancement)
   */
  const setWeekNote = useCallback((weekNumber: number, note: string) => {
    setWeekNotes((prev) => ({ ...prev, [weekNumber]: note }));
  }, []);

  /**
   * Generate skeleton program (Phase 1)
   */
  const generateSkeleton = useCallback(
    async (formData: ProgramFormData): Promise<TwoPhaseGenerationResult> => {
      resetState();
      setStage("preparing");
      startTimer();

      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount <= MAX_RETRIES) {
        try {
          if (retryCount > 0) {
            setStage("retrying");
            setSkeletonWorkouts([]);
            await delay(RETRY_DELAY);
          }

          // Get auth token
          const token = await getAuthToken();
          if (!token) {
            throw new Error("No authentication token");
          }

          // Convert equipment IDs to labels
          const selectedEquipmentNames = formData.equipment
            .map((id) => {
              const equipment = equipmentList.find((item) => item.value === id);
              return equipment ? equipment.label : "";
            })
            .filter(Boolean);

          // Convert day names to numbers
          const daysOfWeekNumbers = formData.daysOfWeek
            .map((day) => {
              if (typeof day === "number") return day;
              if (!day || typeof day !== "string") return null;
              if (dayNameToNumber[day] !== undefined) {
                return dayNameToNumber[day];
              }
              const capitalizedDay =
                day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
              if (dayNameToNumber[capitalizedDay] !== undefined) {
                return dayNameToNumber[capitalizedDay];
              }
              return null;
            })
            .filter((dayNum) => dayNum !== null) as number[];

          if (daysOfWeekNumbers.length === 0) {
            daysOfWeekNumbers.push(1, 3, 5); // Default Mon/Wed/Fri
          }

          const requestBody: SkeletonGenerationRequest = {
            ...(programId ? { programId } : {}),
            name: formData.name,
            description: formData.description,
            goal: formData.goal,
            difficulty: formData.difficulty,
            focus_area: formData.focusArea,
            ...(formData.personalization
              ? { personalization: formData.personalization }
              : {}),
            referenceInput: formData.referenceInput || "",
            trainingMethodology: formData.trainingMethodology,
            duration_weeks: formData.numberOfWeeks,
            days_per_week: formData.daysPerWeek,
            entityId: formData.entityId,
            gym_details: {
              equipment: selectedEquipmentNames,
              gym_type: formData.gymType,
            },
            periodization: {
              program_type: formData.programType,
            },
            calendar_data: {
              start_date: formData.startDate,
              end_date: formData.endDate,
              days_per_week: formData.daysPerWeek,
              days_of_week: daysOfWeekNumbers,
            },
            session_details: formData.sessionDetails,
            program_overview: formData.programOverview,
            workout_format: formData.workoutFormats || [],
            forceRegenerate: !!formData.forceRegenerate,
          };

          setStage("generating_skeleton");
          const expectedTotal = formData.numberOfWeeks * formData.daysPerWeek;
          setSkeletonProgress({
            currentWeek: 0,
            totalWeeks: formData.numberOfWeeks,
            workoutsSaved: 0,
            totalExpected: expectedTotal,
          });

          const controller = new AbortController();
          abortControllerRef.current = controller;

          const timeout = 15 * 60 * 1000; // 15 minutes for skeleton
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const collectedWorkouts: TwoPhaseWorkout[] = [];

          const apiUrl = `${API_BASE}/api/generate-program-skeleton`;
          console.log("[TwoPhase] Starting skeleton generation:", apiUrl);

          await createSSEClientWithPost(apiUrl, requestBody, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
            onOpen: () => {
              setStage("skeleton_streaming");
            },
            onMessage: (event) => {
              let data: SkeletonSSEEvent;
              try {
                data = JSON.parse(event.data) as SkeletonSSEEvent;
              } catch {
                return;
              }

              if (data.type === "status") {
                console.log("[TwoPhase]", data.message);
              } else if (data.type === "skeleton_chunk") {
                // Week's workouts received
                const weekWorkouts = data.workouts.map((w) => ({
                  id: w.id || `temp-${Date.now()}-${Math.random()}`,
                  program_id: programId,
                  title: w.title,
                  body: null,
                  body_skeleton: w.body,
                  generation_status: "skeleton" as const,
                  week_number: data.week,
                  scheduled_date: w.date,
                  is_reference: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }));

                collectedWorkouts.push(...weekWorkouts);
                setSkeletonWorkouts([...collectedWorkouts]);
                setSkeletonProgress((prev) =>
                  prev
                    ? {
                        ...prev,
                        currentWeek: data.week,
                        workoutsSaved: data.totalGenerated,
                      }
                    : null,
                );
              } else if (data.type === "skeleton_complete") {
                console.log("[TwoPhase] Skeleton complete:", data.message);
              } else if (data.type === "warning") {
                console.warn("[TwoPhase] Warning:", data.message);
              } else if (data.type === "error") {
                throw new Error(data.error || "Skeleton generation failed");
              }
            },
            onError: (err) => {
              clearTimeout(timeoutId);
              throw err;
            },
            onClose: () => {
              clearTimeout(timeoutId);
            },
          });

          // Success
          setStage("skeleton_complete");
          stopTimer();

          return {
            success: true,
            workoutsCreated: collectedWorkouts.length,
            stage: "skeleton_complete",
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Unknown error");

          if (
            lastError.message.includes("503") ||
            lastError.message.includes("504") ||
            lastError.message.includes("Network")
          ) {
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              continue;
            }
          }
          break;
        }
      }

      // Failed
      setStage("error");
      setError(lastError?.message || "Skeleton generation failed");
      stopTimer();

      return {
        success: false,
        workoutsCreated: 0,
        error: lastError?.message,
        stage: "error",
      };
    },
    [programId, resetState, startTimer, stopTimer],
  );

  /**
   * Enhance a single week (Phase 2)
   */
  const enhanceWeek = useCallback(
    async (
      weekNumber: number,
      workoutIds: string[],
      context: EnhanceWeekRequest["context"],
    ): Promise<TwoPhaseGenerationResult> => {
      setError(null);
      setStage("enhancing_week");
      setEnhancingWeek(weekNumber);
      startTimer();

      try {
        const token = await getAuthToken();
        if (!token) throw new Error("No authentication token");

        const requestBody: EnhanceWeekRequest = {
          programId,
          weekNumber,
          workoutIds,
          context,
          weekSpecificInput: weekNotes[weekNumber] || undefined,
        };

        setEnhancementProgress({
          weekNumber,
          currentWorkout: 0,
          totalWorkoutsInWeek: workoutIds.length,
          enhancedCount: 0,
        });

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timeout = 5 * 60 * 1000; // 5 minutes per week
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        let enhancedCount = 0;

        const apiUrl = `${API_BASE}/api/enhance-week-details`;
        console.log(
          "[TwoPhase] Starting week enhancement:",
          apiUrl,
          weekNumber,
        );

        await createSSEClientWithPost(apiUrl, requestBody, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          onOpen: () => {
            console.log("[TwoPhase] Enhancement stream opened");
          },
          onMessage: (event) => {
            let data: EnhancementSSEEvent;
            try {
              data = JSON.parse(event.data) as EnhancementSSEEvent;
            } catch {
              return;
            }

            if (data.type === "status") {
              console.log("[TwoPhase]", data.message);
            } else if (data.type === "enhanced_workout") {
              enhancedCount++;
              setEnhancementProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      currentWorkout: data.progress.current,
                      enhancedCount,
                    }
                  : null,
              );

              // Update the workout in skeletonWorkouts
              setSkeletonWorkouts((prev) =>
                prev.map((w) =>
                  w.id === data.workout.id
                    ? {
                        ...w,
                        body: data.workout.body,
                        generation_status: "detailed" as const,
                      }
                    : w,
                ),
              );
            } else if (data.type === "enhancement_complete") {
              console.log("[TwoPhase] Enhancement complete:", data.message);
            } else if (data.type === "error") {
              throw new Error(data.error || "Enhancement failed");
            }
          },
          onError: (err) => {
            clearTimeout(timeoutId);
            throw err;
          },
          onClose: () => {
            clearTimeout(timeoutId);
          },
        });

        setStage("skeleton_complete");
        setEnhancingWeek(null);
        setEnhancementProgress(null);
        stopTimer();

        return {
          success: true,
          workoutsCreated: enhancedCount,
          stage: "skeleton_complete",
        };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Enhancement failed";
        setStage("error");
        setError(errorMsg);
        setEnhancingWeek(null);
        stopTimer();

        return {
          success: false,
          workoutsCreated: 0,
          error: errorMsg,
          stage: "error",
        };
      }
    },
    [programId, weekNotes, startTimer, stopTimer],
  );

  /**
   * Enhance all remaining skeleton weeks
   * Options: { includeEnhanced: boolean } - if true, re-enhances already-enhanced weeks
   */
  const enhanceAllRemaining = useCallback(
    async (
      context: EnhanceWeekRequest["context"],
      options: { includeEnhanced?: boolean } = {},
    ): Promise<TwoPhaseGenerationResult> => {
      const { includeEnhanced = false } = options;
      setStage("enhancing_all");

      // Group workouts by week
      const { groupWorkoutsByWeek } = await import(
        "@/lib/types/twoPhaseGeneration"
      );
      const weeks = groupWorkoutsByWeek(skeletonWorkouts);

      // Filter based on options - either all weeks or just skeleton weeks
      const weeksToEnhance = includeEnhanced
        ? weeks
        : weeks.filter((w) => w.status === "skeleton");

      if (weeksToEnhance.length === 0) {
        setStage("complete");
        return { success: true, workoutsCreated: 0 };
      }

      let totalEnhanced = 0;

      for (const week of weeksToEnhance) {
        const workoutIds = week.workouts.map((w) => w.id);
        const result = await enhanceWeek(week.weekNumber, workoutIds, context);

        if (!result.success) {
          return result;
        }
        totalEnhanced += result.workoutsCreated;
      }

      setStage("complete");
      return {
        success: true,
        workoutsCreated: totalEnhanced,
        stage: "complete",
      };
    },
    [skeletonWorkouts, enhanceWeek],
  );

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopTimer();
    setStage("idle");
    setEnhancingWeek(null);
    setError("Operation cancelled");
  }, [stopTimer]);

  /**
   * Check if generation is in progress
   */
  const isGenerating =
    stage === "preparing" ||
    stage === "generating_skeleton" ||
    stage === "skeleton_streaming" ||
    stage === "enhancing_week" ||
    stage === "enhancing_all" ||
    stage === "retrying";

  /**
   * Check if skeleton is complete and ready for enhancement
   */
  const isSkeletonComplete =
    stage === "skeleton_complete" && skeletonWorkouts.length > 0;

  return {
    // State
    stage,
    error,
    duration,
    isGenerating,
    isSkeletonComplete,

    // Skeleton phase
    skeletonProgress,
    skeletonWorkouts,

    // Enhancement phase
    enhancementProgress,
    enhancingWeek,

    // Week notes
    weekNotes,
    setWeekNote,

    // Actions
    generateSkeleton,
    enhanceWeek,
    enhanceAllRemaining,
    cancel,
  };
}
