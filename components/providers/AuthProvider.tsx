import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth as useClerkAuth, useSignIn, useSignUp, useUser } from "@clerk/expo";

// Types
type UserRole = "coach" | "athlete";

type Profile = {
  subscription_status: string | null;
  trial_end_date: string | null;
  generations_remaining: number | null;
  last_generation_date: string | null;
  role: UserRole;
  display_name: string | null;
  full_name: string | null;
  profile_photo_url: string | null;
  notification_preferences: Record<string, boolean> | null;
  onboarding_completed: boolean;
  // Athlete metrics
  bench_1rm: number | null;
  squat_1rm: number | null;
  deadlift_1rm: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  mile_time: string | null;
  gender: string | null;
  recovery_score: number | null;
  injury_history: string | null;
};

type AthleteMetrics = {
  bench_1rm: number | null;
  squat_1rm: number | null;
  deadlift_1rm: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  mile_time: string | null;
  gender: string | null;
  recovery_score: number | null;
  injury_history: string | null;
};

type AppUser = {
  id: string;
  email: string | null;
};

type AuthContextType = {
  user: AppUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  // Profile
  profile: Profile | null;
  loadingProfile: boolean;
  refetchProfile: () => Promise<void>;
  // Role
  role: UserRole;
  isAthlete: boolean;
  // Athlete metrics
  athleteMetrics: AthleteMetrics | null;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  profile: null,
  loadingProfile: true,
  refetchProfile: async () => {},
  role: "athlete",
  isAthlete: true,
  athleteMetrics: null,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const { isLoaded: authLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { isLoaded: userLoaded, user: clerkUser } = useUser();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();

  const [user, setUser] = useState<AppUser | null>(null);
  const isLoading = !authLoaded || !userLoaded;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile by id, falling back to email match for legacy users
  const fetchProfile = useCallback(async (userId: string, email?: string | null) => {
    if (!userId && !email) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      // Try by id first
      let { data, error } = await supabase
        .from("profiles")
        .select(
          `subscription_status, trial_end_date, generations_remaining, last_generation_date,
           role, display_name, full_name, profile_photo_url, notification_preferences,
           onboarding_completed, bench_1rm, squat_1rm, deadlift_1rm, weight_kg, height_cm, mile_time,
           gender, recovery_score, injury_history, email`
        )
        .eq("id", userId)
        .maybeSingle();

      if (!data && email) {
        // Fallback by email for legacy Supabase users
        const byEmail = await supabase
          .from("profiles")
          .select(
            `subscription_status, trial_end_date, generations_remaining, last_generation_date,
             role, display_name, full_name, profile_photo_url, notification_preferences,
             onboarding_completed, bench_1rm, squat_1rm, deadlift_1rm, weight_kg, height_cm, mile_time,
             gender, recovery_score, injury_history, email, id`
          )
          .eq("email", email)
          .maybeSingle();
        data = byEmail.data as any;
        error = byEmail.error as any;
      }

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } else if (data) {
        setProfile(data as Profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Build app user and fetch profile when Clerk user changes
  useEffect(() => {
    if (!clerkUser) {
      setUser(null);
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    const appUser: AppUser = {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
    };
    setUser(appUser);
    fetchProfile(appUser.id, appUser.email);
  }, [clerkUser, fetchProfile]);

  // Create fallback profile for newly registered users if none exists
  useEffect(() => {
    const maybeCreateProfile = async () => {
      if (!user || loadingProfile) return;
      if (profile) return;
      // Create minimal active profile to match web behavior
      try {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const profileData = {
          id: user.id,
          email: user.email,
          role: "athlete" as UserRole,
          subscription_status: "trialing",
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          generations_remaining: 15,
          generations_today: 0,
          is_active: true,
          onboarding_completed: false,
        };
        await supabase.from("profiles").insert([profileData as any]);
        await fetchProfile(user.id, user.email);
      } catch (e) {
        // Non-fatal
        // console.warn("Failed to create fallback profile:", e);
      }
    };
    void maybeCreateProfile();
  }, [user, profile, loadingProfile, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    if (!signIn) throw new Error("Auth not ready");
    const res = await signIn.create({
      identifier: email,
      password,
    });
    // Complete the password factor
    const attempt = await signIn.attemptFirstFactor({
      strategy: "password",
      password,
    });
    if (attempt.status === "complete") {
      await setActiveSignIn!({ session: attempt.createdSessionId });
      return;
    }
    throw new Error("Failed to sign in");
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = "athlete"
  ) => {
    if (!signUp) throw new Error("Auth not ready");
    // Create Clerk user; email verification is handled by Clerk
    await signUp.create({
      emailAddress: email,
      password,
    });
    // Don't set active session here; prompt user to verify email like current UX
    // Create fallback profile immediately with Clerk user id once available
    // We can optimistically try to fetch Clerk user via useUser on next load
  };

  const signOut = async () => {
    await clerkSignOut();
    setProfile(null);
    setUser(null);
  };

  // Derived values
  const isAthlete = true;

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      // Profile
      profile,
      loadingProfile,
      refetchProfile: () =>
        user?.id ? fetchProfile(user.id, user.email) : Promise.resolve(),
      // Role
      role: (profile?.role || "athlete") as UserRole,
      isAthlete,
      // Athlete metrics
      athleteMetrics: {
        bench_1rm: profile?.bench_1rm ?? null,
        squat_1rm: profile?.squat_1rm ?? null,
        deadlift_1rm: profile?.deadlift_1rm ?? null,
        weight_kg: profile?.weight_kg ?? null,
        height_cm: profile?.height_cm ?? null,
        mile_time: profile?.mile_time ?? null,
        gender: profile?.gender ?? null,
        recovery_score: profile?.recovery_score ?? null,
        injury_history: profile?.injury_history ?? null,
      },
    }),
    [user, isLoading, profile, loadingProfile, fetchProfile, isAthlete]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
