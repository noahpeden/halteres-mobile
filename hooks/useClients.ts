import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { ClientInput, EntityType } from "@/lib/validations/program.schema";
import { useAuth } from "@/hooks/useAuth";

// Client metrics matching web app's entity fields
export type ClientMetrics = {
  bench_1rm?: number | null;
  deadlift_1rm?: number | null;
  squat_1rm?: number | null;
  mile_time?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  recovery_score?: number | null;
  injury_history?: string | null;
};

// Skill distribution for class metrics
export type SkillDistribution = {
  beginner: number;
  intermediate: number;
  advanced: number;
};

// Class metrics for CLASS entity type
export type ClassMetrics = {
  class_size?: number | null;
  average_age?: number | null;
  has_elite_athletes?: boolean | null;
  average_experience_years?: number | null;
  skill_distribution?: SkillDistribution | null;
  class_duration_minutes?: number | null;
  warmup_duration_minutes?: number | null;
};

export type Client = {
  id: string;
  name: string;
  type: EntityType;
  description?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Metrics fields (only for CLIENT type)
  bench_1rm?: number | null;
  deadlift_1rm?: number | null;
  squat_1rm?: number | null;
  mile_time?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  recovery_score?: number | null;
  injury_history?: string | null;
  // Class metrics fields (only for CLASS type)
  class_size?: number | null;
  average_age?: number | null;
  has_elite_athletes?: boolean | null;
  average_experience_years?: number | null;
  skill_distribution?: SkillDistribution | null;
  class_duration_minutes?: number | null;
  warmup_duration_minutes?: number | null;
};

export type ClientUpdateInput = {
  name: string;
  type: EntityType;
  metrics?: ClientMetrics;
  classMetrics?: ClassMetrics;
};

// Match web app: query entities directly from Supabase
export function useClients() {
  const { user } = useAuth();
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("Not authenticated");
      }

      // Query entities table for user's clients and classes
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []) as Client[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

// Match web app: insert directly into Supabase entities table with metrics
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ClientUpdateInput): Promise<Client> => {
      if (!user?.id) {
        throw new Error("Not authenticated");
      }

      // Build insert data with optional metrics
      const insertData: Record<string, unknown> = {
        name: data.name,
        type: data.type || "CLIENT",
        user_id: user.id,
      };

      // Add metrics if provided and type is CLIENT
      if (data.type === "CLIENT" && data.metrics) {
        Object.assign(insertData, {
          bench_1rm: data.metrics.bench_1rm,
          deadlift_1rm: data.metrics.deadlift_1rm,
          squat_1rm: data.metrics.squat_1rm,
          mile_time: data.metrics.mile_time,
          gender: data.metrics.gender,
          height_cm: data.metrics.height_cm,
          weight_kg: data.metrics.weight_kg,
          recovery_score: data.metrics.recovery_score,
          injury_history: data.metrics.injury_history,
        });
      }

      // Add class metrics if provided and type is CLASS
      if (data.type === "CLASS" && data.classMetrics) {
        Object.assign(insertData, {
          class_size: data.classMetrics.class_size,
          average_age: data.classMetrics.average_age,
          has_elite_athletes: data.classMetrics.has_elite_athletes,
          average_experience_years: data.classMetrics.average_experience_years,
          skill_distribution: data.classMetrics.skill_distribution,
          class_duration_minutes: data.classMetrics.class_duration_minutes,
          warmup_duration_minutes: data.classMetrics.warmup_duration_minutes,
        });
      }

      const { data: entity, error } = await supabase
        .from("entities")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return entity as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ClientUpdateInput;
    }): Promise<Client> => {
      if (!user?.id) {
        throw new Error("Not authenticated");
      }

      // Build update data with optional metrics
      const updateData: Record<string, unknown> = {
        name: data.name,
        type: data.type,
      };

      // Add metrics if provided (only for CLIENT type)
      if (data.type === "CLIENT" && data.metrics) {
        Object.assign(updateData, {
          bench_1rm: data.metrics.bench_1rm,
          deadlift_1rm: data.metrics.deadlift_1rm,
          squat_1rm: data.metrics.squat_1rm,
          mile_time: data.metrics.mile_time,
          gender: data.metrics.gender,
          height_cm: data.metrics.height_cm,
          weight_kg: data.metrics.weight_kg,
          recovery_score: data.metrics.recovery_score,
          injury_history: data.metrics.injury_history,
        });
      }

      // Add class metrics if provided (only for CLASS type)
      if (data.type === "CLASS" && data.classMetrics) {
        Object.assign(updateData, {
          class_size: data.classMetrics.class_size,
          average_age: data.classMetrics.average_age,
          has_elite_athletes: data.classMetrics.has_elite_athletes,
          average_experience_years: data.classMetrics.average_experience_years,
          skill_distribution: data.classMetrics.skill_distribution,
          class_duration_minutes: data.classMetrics.class_duration_minutes,
          warmup_duration_minutes: data.classMetrics.warmup_duration_minutes,
        });
      }

      const { data: entity, error } = await supabase
        .from("entities")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id) // Ensure owner is updating
        .select()
        .single();

      if (error) throw error;
      return entity as Client;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Soft delete by setting deleted_at
      const { error } = await supabase
        .from("entities")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
