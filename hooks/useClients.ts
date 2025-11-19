import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { ClientInput } from "@/lib/validations/program.schema";

export type Client = {
  id: string;
  name: string;
  email?: string;
  type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  program_count?: number;
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
    queryFn: () => apiClient.get(`/api/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientInput) => apiClient.post("/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ClientInput>) =>
      apiClient.put(`/api/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
