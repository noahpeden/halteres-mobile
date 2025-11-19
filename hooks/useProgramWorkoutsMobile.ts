import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Workout = {
  id: string;
  program_id: string;
  title: string;
  body: string;
  tags?: string[];
  scheduled_date?: string;
  is_reference: boolean;
  completed?: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export function useProgramWorkoutsMobile(programId: string) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [referenceWorkouts, setReferenceWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all workouts for a program
  const fetchWorkouts = async () => {
    if (!programId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch regular workouts
      const { data: regularWorkouts, error: workoutsError } = await supabase
        .from("program_workouts")
        .select("*")
        .eq("program_id", programId)
        .eq("is_reference", false)
        .order("scheduled_date", { ascending: true });

      if (workoutsError) throw workoutsError;

      // Fetch reference workouts
      const { data: refWorkouts, error: refError } = await supabase
        .from("program_workouts")
        .select("*")
        .eq("program_id", programId)
        .eq("is_reference", true)
        .order("created_at", { ascending: false });

      if (refError) throw refError;

      setWorkouts((regularWorkouts || []) as Workout[]);
      setReferenceWorkouts((refWorkouts || []) as Workout[]);
    } catch (err: any) {
      console.error("Error fetching workouts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!programId) return;

    // Initial fetch
    fetchWorkouts();

    // Subscribe to changes
    const subscription = supabase
      .channel(`program_workouts:${programId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "program_workouts",
          filter: `program_id=eq.${programId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newWorkout = payload.new as Workout;
            if (newWorkout.is_reference) {
              setReferenceWorkouts((prev) => {
                if (prev.some((w) => w.id === newWorkout.id)) {
                  return prev;
                }
                return [...prev, newWorkout];
              });
            } else {
              setWorkouts((prev) => {
                if (prev.some((w) => w.id === newWorkout.id)) {
                  return prev;
                }
                return [...prev, newWorkout].sort((a, b) => {
                  if (!a.scheduled_date && !b.scheduled_date) return 0;
                  if (!a.scheduled_date) return 1;
                  if (!b.scheduled_date) return -1;
                  return (
                    new Date(a.scheduled_date).getTime() -
                    new Date(b.scheduled_date).getTime()
                  );
                });
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedWorkout = payload.new as Workout;
            if (updatedWorkout.is_reference) {
              setReferenceWorkouts((prev) =>
                prev.map((w) =>
                  w.id === updatedWorkout.id ? updatedWorkout : w,
                ),
              );
            } else {
              setWorkouts((prev) =>
                prev
                  .map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w))
                  .sort((a, b) => {
                    if (!a.scheduled_date && !b.scheduled_date) return 0;
                    if (!a.scheduled_date) return 1;
                    if (!b.scheduled_date) return -1;
                    return (
                      new Date(a.scheduled_date).getTime() -
                      new Date(b.scheduled_date).getTime()
                    );
                  }),
              );
            }
          } else if (payload.eventType === "DELETE") {
            setWorkouts((prev) => prev.filter((w) => w.id !== payload.old.id));
            setReferenceWorkouts((prev) =>
              prev.filter((w) => w.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [programId]);

  return {
    workouts,
    referenceWorkouts,
    loading,
    error,
    refetch: fetchWorkouts,
  };
}
