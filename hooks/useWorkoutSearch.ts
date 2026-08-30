import { useCallback, useState } from "react";
import { API_BASE } from "@/lib/api/getApiUrl";
import { getAuthToken } from "@/lib/auth/token";

export type SearchWorkout = {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  difficulty?: string;
  similarity?: number;
  source?: string;
};

type SearchParams = {
  searchQuery: string;
  goal?: string;
  difficulty?: string;
  focusArea?: string;
};

export function useWorkoutSearch() {
  const [results, setResults] = useState<SearchWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: SearchParams) => {
    const { searchQuery, goal, difficulty, focusArea } = params;

    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return { success: true, workouts: [] };
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_BASE}/api/search-workouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          searchQuery,
          goal,
          difficulty,
          focusArea,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || "Failed to search workouts",
        );
      }

      const data = await response.json();
      const workouts = (data.workouts || []) as SearchWorkout[];

      setResults(workouts);
      return { success: true, workouts };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setResults([]);
      return { success: false, error: errorMessage, workouts: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}
