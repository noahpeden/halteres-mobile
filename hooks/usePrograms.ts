import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api/client";
import type { ProgramInput } from "@/lib/validations/program.schema";

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

      // Then get programs for those entities
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
    mutationFn: async (data: ProgramInput) => {
      console.log("[useCreateProgram] Starting program creation with data:", data);
      
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

      // Insert directly into Supabase (matching web app /api/CreateProgram logic)
      const programData = {
        name: data.name,
        entity_id: data.client_id,
        duration_weeks: data.duration_weeks,
        description: data.description || null,
        training_methodology: null,
        difficulty: "intermediate",
        focus_area: null,
        reference_input: null,
        calendar_data: {
          start_date: today,
          end_date: endDateStr,
          days_of_week: ["Monday", "Wednesday", "Friday"],
        },
        periodization: {
          program_type: "linear",
        },
        gym_details: {
          gym_type: "crossfit_box",
          equipment: [],
        },
        workout_format: {
          formats: [],
        },
        session_details: {
          duration_minutes: 60,
        },
      };

      console.log("[useCreateProgram] Inserting program into Supabase:", programData);

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
    mutationFn: async (data: Partial<ProgramInput>) => {
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
