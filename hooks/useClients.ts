import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { ClientInput, EntityType } from "@/lib/validations/program.schema";

export type Client = {
  id: string;
  name: string;
  type: EntityType;
  description?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// Match web app: query entities directly from Supabase
export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
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

// Match web app: insert directly into Supabase entities table
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientInput): Promise<Client> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: entity, error } = await supabase
        .from("entities")
        .insert({
          name: data.name,
          type: data.type || "CLIENT",
          user_id: user.id,
        })
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

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ClientInput>): Promise<Client> => {
      const { data: entity, error } = await supabase
        .from("entities")
        .update({
          name: data.name,
          type: data.type,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return entity as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", id] });
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
