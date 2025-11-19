import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Program } from "./usePrograms";

export function useProgramDataMobile(programId: string) {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch program data
  const fetchProgram = async () => {
    if (!programId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();

      if (fetchError) throw fetchError;

      setProgram(data as Program);
    } catch (err: any) {
      console.error("Error fetching program:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!programId) return;

    // Initial fetch
    fetchProgram();

    // Subscribe to changes
    const subscription = supabase
      .channel(`program:${programId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "programs",
          filter: `id=eq.${programId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setProgram(payload.new as Program);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [programId]);

  return {
    program,
    loading,
    error,
    refetch: fetchProgram,
  };
}
