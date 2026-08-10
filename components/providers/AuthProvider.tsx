import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase/client";

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

type AuthContextType = {
  user: User | null;
  session: Session | null;
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
  session: null,
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile
  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `subscription_status, trial_end_date, generations_remaining, last_generation_date,
           role, display_name, full_name, profile_photo_url, notification_preferences,
           onboarding_completed, bench_1rm, squat_1rm, deadlift_1rm, weight_kg, height_cm, mile_time,
           gender, recovery_score, injury_history`
        )
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No profile found for user");
          setProfile(null);
        } else {
          console.error("Error fetching profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user?.id) {
        fetchProfile(session.user.id);
      } else {
        setLoadingProfile(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user?.id) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = "athlete"
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }, // Store role in user metadata for trigger
      },
    });
    if (error) throw error;

    if (data.user) {
      // Check if profile was created by trigger
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Profile wasn't created by trigger - create fallback profile
        console.log("Profile missing for user, creating fallback profile");
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Every self-coached athlete gets a trial with generation credits
        const profileData = {
          id: data.user.id,
          role,
          subscription_status: "trialing",
          trial_start_date: now.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          generations_remaining: 15,
          generations_today: 0,
          is_active: true,
          onboarding_completed: false,
        };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert([profileData]);

        if (insertError) {
          console.error("Error creating fallback profile:", insertError);
        } else {
          console.log("Fallback profile created for role:", role);
        }
      } else {
        // Profile exists, just update the role if needed
        await supabase
          .from("profiles")
          .update({ role })
          .eq("id", data.user.id);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Derived values
  const isAthlete = true;

  const contextValue = useMemo(
    () => ({
      user,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
      // Profile
      profile,
      loadingProfile,
      refetchProfile: () =>
        user?.id ? fetchProfile(user.id) : Promise.resolve(),
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
    [user, session, isLoading, profile, loadingProfile, fetchProfile, isAthlete]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
