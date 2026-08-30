import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api/client";
import type { ProgramInput } from "@/lib/validations/program.schema";
import { equipmentList } from "@/lib/constants/programConfig";

// JSON field types for program data
export type CalendarData = {
  start_date?: string;
  end_date?: string;
  duration_weeks?: number;
  days_per_week?: number;
  days_of_week?: number[];
  days_of_week_names?: string[];
};

export type GymDetails = {
  gym_type?: string;
  equipment?: (string | number)[];
};

export type Periodization = {
  program_type?: string;
};

export type SessionDetails = {
  duration?: number;
  duration_minutes?: number;
};

export type Program = {
  id: string;
  name: string;
  description?: string;
  duration_weeks: number;
  client_id?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
  workout_count?: number;
  goal?: string;
  difficulty?: string;
  entity_id?: string;
  training_methodology?: string;
  reference_input?: string;
  focus_area?: string;
  start_date?: string;
  end_date?: string;
  workout_format?: string[];
  calendar_data?: CalendarData;
  gym_details?: GymDetails;
  periodization?: Periodization;
  session_details?: SessionDetails;
};

export function usePrograms() {
  return useQuery<Program[]>({
    queryKey: ["programs"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // First get user's entities (clients/classes)
      const { data: entities, error: entitiesError } = await supabase
        .from("entities")
        .select("id")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (entitiesError) throw entitiesError;

      if (!entities || entities.length === 0) {
        return [];
      }

      const entityIds = entities.map((e) => e.id);

      // Then get programs for those entities (all owned by the current user)
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .in("entity_id", entityIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as Program[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProgram(id: string) {
  return useQuery<Program>({
    queryKey: ["program", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data as Program;
    },
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProgramInput | (ProgramInput & Record<string, any>)) => {
      console.log(
        "[useCreateProgram] Starting program creation with data:",
        data,
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("[useCreateProgram] User:", user?.id);

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Match web app validation: entity_id is required
      if (!data.client_id) {
        throw new Error("Please select a client or class");
      }

      // Get today's date in ISO format for start date
      const today = new Date().toISOString().split("T")[0];

      // Calculate end date
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + data.duration_weeks * 7 - 1);
      const endDateStr = endDate.toISOString().split("T")[0];

      // Derive calendar fields
      const durationWeeks = data.duration_weeks;
      const daysOfWeekNames: string[] =
        (data as any).days_of_week_names && Array.isArray((data as any).days_of_week_names)
          ? ((data as any).days_of_week_names as string[])
          : ["Monday", "Wednesday", "Friday"];
      const daysPerWeek = daysOfWeekNames.length;

      // Translate equipment ids to names for storage (hard constraint)
      const equipmentIds: number[] = Array.isArray((data as any).equipment)
        ? ((data as any).equipment as number[])
        : [];
      const equipmentNames = equipmentIds
        .map((id) => equipmentList.find((e) => e.value === id)?.label)
        .filter((x): x is string => !!x);

      const combinedReference: string | null = (() => {
        const influences = ((data as any).program_influences as string) || "";
        const recent = ((data as any).recent_training_history as string) || "";
        const parts = [];
        if (influences.trim()) parts.push(influences.trim());
        if (recent.trim()) parts.push(`Recent Training:\n${recent.trim()}`);
        return parts.length ? parts.join("\n\n---\n\n") : null;
      })();

      // Insert directly into Supabase
      const programData: Record<string, unknown> = {
        name: data.name,
        entity_id: data.client_id,
        duration_weeks: durationWeeks,
        description: data.description || null,
        training_methodology: (data as any).training_methodology || null,
        difficulty: (data as any).difficulty || null,
        goal: (data as any).goal || null,
        focus_area: (data as any).focus_area || null,
        reference_input: combinedReference,
        calendar_data: {
          start_date: today,
          end_date: endDateStr,
          duration_weeks: durationWeeks,
          days_per_week: daysPerWeek,
          days_of_week_names: daysOfWeekNames,
        },
        periodization: {
          program_type: "linear",
        },
        gym_details: {
          gym_type: (data as any).gym_type || "Other",
          equipment: equipmentNames,
        },
        session_details: {
          duration: (data as any).session_duration_minutes || 60,
        },
      };

      console.log(
        "[useCreateProgram] Inserting program into Supabase:",
        programData,
      );

      const { data: program, error } = await supabase
        .from("programs")
        .insert(programData)
        .select()
        .single();

      if (error) {
        console.error("[useCreateProgram] Supabase error:", error);
        throw error;
      }

      console.log("[useCreateProgram] Program created successfully:", program);

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

export function useUpdateProgram(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: program, error } = await supabase
        .from("programs")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["program", id] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
}

