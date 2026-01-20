import { useState, useCallback, useContext } from "react";
import { apiClient } from "@/lib/api/client";
import { AuthContext } from "@/components/providers/AuthProvider";

type UpdateProfileData = {
  display_name?: string;
  squat_1rm?: number | string;
  deadlift_1rm?: number | string;
  bench_1rm?: number | string;
  mile_time?: string;
  weight_kg?: number | string;
  height_cm?: number | string;
  onboarding_completed?: boolean;
};

type UpdateProfileResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export function useAthleteProfile() {
  const { refetchProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (data: UpdateProfileData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<UpdateProfileResponse>(
          "/api/athlete/update-profile",
          data
        );

        if (response.success) {
          // Refresh the profile in AuthContext
          await refetchProfile();
          return { success: true, data: response.data };
        } else {
          setError(response.error || "Failed to update profile");
          return { success: false, error: response.error };
        }
      } catch (err) {
        console.error("Update profile error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [refetchProfile]
  );

  return {
    updateProfile,
    loading,
    error,
  };
}
