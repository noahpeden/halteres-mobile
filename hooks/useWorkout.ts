import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Workout } from "./useProgramWorkoutsMobile";

type EnhancedWorkout = {
  title: string;
  description: string;
  notes?: string;
};

type EnhancePayload = {
  workout: { title: string; description: string };
  instructions: string;
  methodology: string;
  gymEquipment: string[];
  injuries?: string[];
};

export function useWorkout(workoutId: string) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workout
  const fetchWorkout = useCallback(async () => {
    if (!workoutId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("program_workouts")
        .select("*")
        .eq("id", workoutId)
        .single();

      if (fetchError) throw fetchError;
      setWorkout(data as Workout);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch workout";
      console.error("Error fetching workout:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  // Real-time subscription
  useEffect(() => {
    if (!workoutId) return;

    fetchWorkout();

    const subscription = supabase
      .channel(`workout:${workoutId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "program_workouts",
          filter: `id=eq.${workoutId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setWorkout(payload.new as Workout);
          } else if (payload.eventType === "DELETE") {
            setWorkout(null);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [workoutId, fetchWorkout]);

  // Update workout
  const updateWorkout = async (
    updates: Partial<Pick<Workout, "title" | "body" | "tags">>,
  ) => {
    if (!workoutId) return { success: false, error: "No workout ID" };

    // Store previous state for rollback
    const previousWorkout = workout;

    // Optimistically update local state
    if (workout) {
      setWorkout({
        ...workout,
        ...updates,
        updated_at: new Date().toISOString(),
      });
    }

    try {
      const { error: updateError } = await supabase
        .from("program_workouts")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workoutId);

      if (updateError) throw updateError;
      return { success: true };
    } catch (err: unknown) {
      // Rollback on error
      if (previousWorkout) {
        setWorkout(previousWorkout);
      }
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update workout";
      console.error("Error updating workout:", err);
      return { success: false, error: errorMessage };
    }
  };

  // Toggle completion status
  const toggleComplete = async () => {
    if (!workout) return { success: false, error: "No workout loaded" };

    const newCompleted = !workout.completed;
    const newCompletedAt = newCompleted ? new Date().toISOString() : undefined;

    // Store previous state for rollback
    const previousWorkout = workout;

    // Optimistically update local state
    setWorkout({
      ...workout,
      completed: newCompleted,
      completed_at: newCompletedAt,
      updated_at: new Date().toISOString(),
    });

    try {
      const { error: updateError } = await supabase
        .from("program_workouts")
        .update({
          completed: newCompleted,
          completed_at: newCompletedAt || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workoutId);

      if (updateError) throw updateError;
      return { success: true, completed: newCompleted };
    } catch (err: unknown) {
      // Rollback on error
      setWorkout(previousWorkout);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update workout";
      console.error("Error toggling completion:", err);
      return { success: false, error: errorMessage };
    }
  };

  // Delete workout
  const deleteWorkout = async () => {
    if (!workoutId) return { success: false, error: "No workout ID" };

    try {
      const { error: deleteError } = await supabase
        .from("program_workouts")
        .delete()
        .eq("id", workoutId);

      if (deleteError) throw deleteError;
      return { success: true };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete workout";
      console.error("Error deleting workout:", err);
      return { success: false, error: errorMessage };
    }
  };

  // Enhance workout with AI
  const enhanceWorkout = async (
    payload: EnhancePayload,
  ): Promise<{
    success: boolean;
    enhanced?: EnhancedWorkout;
    error?: string;
  }> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: "Not authenticated" };
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        return { success: false, error: "API URL not configured" };
      }

      const response = await fetch(`${apiUrl}/api/enhance-workout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Failed to enhance workout",
        };
      }

      const data = await response.json();
      return { success: true, enhanced: data.enhancedWorkout };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to enhance workout";
      console.error("Error enhancing workout:", err);
      return { success: false, error: errorMessage };
    }
  };

  // Save enhanced workout
  const saveEnhancement = async (enhanced: EnhancedWorkout) => {
    return updateWorkout({
      title: enhanced.title,
      body: enhanced.description,
    });
  };

  return {
    workout,
    loading,
    error,
    refetch: fetchWorkout,
    updateWorkout,
    toggleComplete,
    deleteWorkout,
    enhanceWorkout,
    saveEnhancement,
  };
}
