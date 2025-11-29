import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { createSSEClientWithPost } from "@/lib/api/sseClient";
import { equipmentList, dayNameToNumber } from "@/lib/constants/programConfig";

// Debug: Log what Expo sees for the env var
console.log(
  "[Generation] EXPO_PUBLIC_API_URL from env:",
  process.env.EXPO_PUBLIC_API_URL,
);

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "https://halteres.ai";
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

export type GenerationStage =
  | "idle"
  | "preparing"
  | "generating"
  | "streaming"
  | "complete"
  | "error"
  | "retrying";

export type StreamingWorkout = {
  id: string;
  title: string;
  body: string;
  scheduled_date?: string;
  tags?: string[];
};

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
};

export type GenerationResult = {
  success: boolean;
  workoutsCreated: number;
  error?: string;
};

export function useProgramGeneration(programId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stage, setStage] = useState<GenerationStage>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [streamingWorkouts, setStreamingWorkouts] = useState<
    StreamingWorkout[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearStreamingWorkouts = useCallback(() => {
    setStreamingWorkouts([]);
  }, []);

  const addStreamingWorkout = useCallback((workout: StreamingWorkout) => {
    setStreamingWorkouts((prev) => [...prev, workout]);
  }, []);

  const getTimeout = (weeks: number): number => {
    if (weeks < 5) return 5 * 60 * 1000; // 5 minutes
    if (weeks < 8) return 7.5 * 60 * 1000; // 7.5 minutes
    return 30 * 60 * 1000; // 30 minutes
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const generateProgram = useCallback(
    async (
      formData: ProgramFormData,
      isRegeneration: boolean = false,
    ): Promise<GenerationResult> => {
      // Reset state
      setIsGenerating(true);
      setError(null);
      setStage("preparing");
      setProgress({ current: 0, total: 0 });
      clearStreamingWorkouts();

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount <= MAX_RETRIES) {
        try {
          if (retryCount > 0) {
            setStage("retrying");
            clearStreamingWorkouts();
            await delay(RETRY_DELAY);
          }

          // Get auth token
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session?.access_token) {
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

              // Try exact match
              if (dayNameToNumber[day] !== undefined) {
                return dayNameToNumber[day];
              }

              // Try capitalized
              const capitalizedDay =
                day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
              if (dayNameToNumber[capitalizedDay] !== undefined) {
                return dayNameToNumber[capitalizedDay];
              }

              return null;
            })
            .filter((dayNum) => dayNum !== null);

          // Fallback to Mon/Wed/Fri if no valid days
          if (daysOfWeekNumbers.length === 0) {
            daysOfWeekNumbers.push(1, 3, 5);
          }

          // Prepare gym details
          const gymDetails = {
            ...formData.gymDetails,
            equipment: selectedEquipmentNames,
            gym_type: formData.gymType,
          };

          // Prepare periodization
          const periodizationData = {
            program_type: formData.programType,
          };

          // Build request body matching web app
          const requestBody = {
            ...(programId ? { programId } : {}),
            name: formData.name,
            description: formData.description,
            goal: formData.goal,
            difficulty: formData.difficulty,
            focus_area: formData.focusArea,
            personalization: formData.personalization,
            referenceInput: formData.referenceInput || "",
            trainingMethodology: formData.trainingMethodology,
            duration_weeks: parseInt(String(formData.numberOfWeeks), 10),
            days_per_week: parseInt(String(formData.daysPerWeek), 10),
            entityId: formData.entityId,
            gym_details: gymDetails,
            periodization: periodizationData,
            calendar_data: {
              start_date: formData.startDate,
              end_date: formData.endDate,
              days_per_week: parseInt(String(formData.daysPerWeek), 10),
              days_of_week: daysOfWeekNumbers,
            },
            session_details: formData.sessionDetails,
            program_overview: formData.programOverview,
            workout_format: formData.workoutFormats || [],
            forceRegenerate: isRegeneration,
          };

          setStage("generating");

          // Calculate expected total
          const expectedTotal = formData.numberOfWeeks * formData.daysPerWeek;
          setProgress({ current: 0, total: expectedTotal });

          // Create abort controller with timeout
          const controller = new AbortController();
          abortControllerRef.current = controller;

          const timeout = getTimeout(formData.numberOfWeeks);
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          // Track processed workouts
          const processedWorkouts = new Set<string>();

          const apiUrl = `${API_BASE}/api/generate-program-anthropic`;
          console.log("[Generation] Starting API call to:", apiUrl);
          console.log(
            "[Generation] Request body:",
            JSON.stringify(requestBody, null, 2).slice(0, 500),
          );

          // Start SSE stream
          await createSSEClientWithPost(apiUrl, requestBody, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            signal: controller.signal,
            onOpen: () => {
              setStage("streaming");
            },
            onMessage: (event) => {
              // Parse data as JSON
              let data;
              try {
                data = JSON.parse(event.data);
              } catch {
                // Not JSON, ignore
                return;
              }

              // Handle different event types
              if (data.type === "status") {
                // Status update
                console.log("[Generation]", data.message);
              } else if (data.type === "workout_chunk") {
                // New workout streamed
                const workout = data.workout;
                if (workout && !processedWorkouts.has(workout.id)) {
                  processedWorkouts.add(workout.id);
                  addStreamingWorkout(workout);
                  setProgress((prev) => ({
                    ...prev,
                    current: processedWorkouts.size,
                  }));
                }
              } else if (data.type === "program_metadata") {
                // Program metadata update
                console.log("[Generation] Program metadata received");
              } else if (data.type === "warning") {
                console.warn("[Generation]", data.message);
              } else if (data.type === "error") {
                throw new Error(data.message || "Generation failed");
              } else if (data.type === "complete") {
                console.log("[Generation] Complete");
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

          // Success!
          setStage("complete");
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setIsGenerating(false);

          return {
            success: true,
            workoutsCreated: processedWorkouts.size,
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Unknown error");

          // Check if it's a retryable error
          if (
            lastError.message.includes("503") ||
            lastError.message.includes("504") ||
            lastError.message.includes("Network")
          ) {
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              continue; // Retry
            }
          }

          // Non-retryable error or max retries exceeded
          break;
        }
      }

      // Failed after retries
      setStage("error");
      setError(lastError?.message || "Generation failed");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsGenerating(false);

      return {
        success: false,
        workoutsCreated: 0,
        error: lastError?.message,
      };
    },
    [programId, addStreamingWorkout, clearStreamingWorkouts],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsGenerating(false);
    setStage("idle");
    setError("Generation cancelled");
  }, []);

  return {
    isGenerating,
    stage,
    progress,
    streamingWorkouts,
    error,
    duration,
    generateProgram,
    cancel,
  };
}
