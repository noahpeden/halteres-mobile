import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";

type Badge = {
  id: string;
  label: string;
  icon: string;
};

type LeaderboardUser = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  profile_photo_url: string | null;
};

export type AggregateLeaderboardEntry = {
  userId: string;
  points: number;
  rank: number;
  user: LeaderboardUser | null;
  workoutsLogged: number;
  firstPlaces: number;
  secondPlaces: number;
  thirdPlaces: number;
  prs: number;
  rxWorkouts: number;
  isCurrentUser: boolean;
  badges: Badge[];
};

type AggregateLeaderboardResponse = {
  success: boolean;
  leaderboard: AggregateLeaderboardEntry[];
  period: "week" | "month" | "all";
  periodLabel: string;
  error?: string;
};

export function useAggregateLeaderboard() {
  const [data, setData] = useState<AggregateLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(
    async (gymId: string, period: "week" | "month" | "all" = "week") => {
      if (!gymId) {
        setError("Gym ID required");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<AggregateLeaderboardResponse>(
          `/api/athlete/aggregate-leaderboard?gymId=${gymId}&period=${period}`
        );

        if (response.success) {
          setData(response);
        } else {
          setError(response.error || "Failed to load leaderboard");
        }
      } catch (err) {
        console.error("Aggregate leaderboard error:", err);
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    fetchLeaderboard,
    leaderboard: data?.leaderboard || [],
    periodLabel: data?.periodLabel || "",
  };
}
