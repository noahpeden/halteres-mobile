import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { API_BASE } from "@/lib/api/getApiUrl";
import { getAuthToken } from "@/lib/auth/token";

export type EnhancedWorkout = {
  id: string;
  title: string;
  body: string;
};

export type EnhancePayload = {
  workouts: { id: string; title: string; body: string }[];
  instructions: string;
  programName: string;
  methodology: string;
  gymEquipment: string[];
  injuries?: string;
  focusArea?: string;
  workoutFormats?: string[];
};

export type EnhanceResult = {
  enhancedWorkouts: EnhancedWorkout[];
  notes: string;
};

export function useEnhanceProgram() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhanceProgram = useCallback(
    async (payload: EnhancePayload): Promise<EnhanceResult | null> => {
      setIsEnhancing(true);
      setError(null);

      try {
        const token = await getAuthToken();
        if (!token) throw new Error("Not authenticated");

        console.log("[Enhance] Starting enhancement with", payload.workouts.length, "workouts");

        const response = await fetch(`${API_BASE}/api/enhance-program`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to enhance program");
        }

        const data = await response.json();
        console.log("[Enhance] Enhancement complete");

        return {
          enhancedWorkouts: data.enhancedProgram.enhancedWorkouts,
          notes: data.enhancedProgram.notes || "",
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Enhance] Error:", message);
        setError(message);
        return null;
      } finally {
        setIsEnhancing(false);
      }
    },
    [],
  );

  const saveEnhancedWorkouts = useCallback(
    async (enhancedWorkouts: EnhancedWorkout[]): Promise<boolean> => {
      try {
        console.log("[Enhance] Saving", enhancedWorkouts.length, "enhanced workouts");

        // Update each workout in the database
        for (const workout of enhancedWorkouts) {
          const { error: updateError } = await supabase
            .from("program_workouts")
            .update({
              title: workout.title,
              body: workout.body,
              updated_at: new Date().toISOString(),
            })
            .eq("id", workout.id);

          if (updateError) {
            console.error("[Enhance] Error updating workout:", workout.id, updateError);
            throw updateError;
          }
        }

        console.log("[Enhance] All workouts saved successfully");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Enhance] Save error:", message);
        setError(message);
        return false;
      }
    },
    [],
  );

  return {
    isEnhancing,
    error,
    enhanceProgram,
    saveEnhancedWorkouts,
  };
}
