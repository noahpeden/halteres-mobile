import type { Session, User } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type Gym = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  invite_code: string | null;
  owner_id: string;
};

type GymMembership = {
  id: string;
  role: "owner" | "coach" | "athlete";
  status: "pending" | "active" | "suspended" | "left";
  joined_at: string | null;
  nickname: string | null;
  class_id: string | null;
  gym: Gym;
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
  isCoach: boolean;
  isAthlete: boolean;
  // Gym
  gymMemberships: GymMembership[];
  currentGym: Gym | null;
  switchGym: (gym: Gym) => void;
  isGymOwner: boolean;
  loadingGym: boolean;
  refetchGymMemberships: () => Promise<void>;
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
  role: "coach",
  isCoach: true,
  isAthlete: false,
  gymMemberships: [],
  currentGym: null,
  switchGym: () => {},
  isGymOwner: false,
  loadingGym: true,
  refetchGymMemberships: async () => {},
  athleteMetrics: null,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [gymMemberships, setGymMemberships] = useState<GymMembership[]>([]);
  const [currentGym, setCurrentGym] = useState<Gym | null>(null);
  const [loadingGym, setLoadingGym] = useState(true);

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

  // Fetch gym memberships
  const fetchGymMemberships = useCallback(async (userId: string) => {
    if (!userId) {
      setGymMemberships([]);
      setCurrentGym(null);
      setLoadingGym(false);
      return;
    }
    setLoadingGym(true);
    try {
      const { data, error } = await supabase
        .from("gym_memberships")
        .select(
          `
          id, role, status, joined_at, nickname, class_id,
          gym:gyms (
            id, name, description, logo_url, invite_code, owner_id
          )
        `
        )
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching gym memberships:", error);
        setGymMemberships([]);
      } else {
        const memberships = (data || []) as GymMembership[];
        setGymMemberships(memberships);

        // Restore current gym from storage or use first membership
        const storedGymId = await AsyncStorage.getItem("currentGymId");
        const storedGym = memberships.find((m) => m.gym?.id === storedGymId);
        if (storedGym?.gym) {
          setCurrentGym(storedGym.gym);
        } else if (memberships.length > 0 && memberships[0]?.gym) {
          setCurrentGym(memberships[0].gym);
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching gym memberships:", error);
      setGymMemberships([]);
    } finally {
      setLoadingGym(false);
    }
  }, []);

  // Switch gym
  const switchGym = useCallback((gym: Gym) => {
    setCurrentGym(gym);
    AsyncStorage.setItem("currentGymId", gym.id);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user?.id) {
        fetchProfile(session.user.id);
        fetchGymMemberships(session.user.id);
      } else {
        setLoadingProfile(false);
        setLoadingGym(false);
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
        fetchGymMemberships(session.user.id);
      } else {
        setProfile(null);
        setLoadingProfile(false);
        setGymMemberships([]);
        setCurrentGym(null);
        setLoadingGym(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchGymMemberships]);

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
    role: UserRole = "coach"
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;

    // Update role in profile after signup
    if (data.user && role === "athlete") {
      await supabase.from("profiles").update({ role }).eq("id", data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await AsyncStorage.removeItem("currentGymId");
  };

  // Derived values
  const isCoach = profile?.role === "coach" || !profile?.role;
  const isAthlete = profile?.role === "athlete";
  const isGymOwner = gymMemberships.some((m) => m.role === "owner");

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
      role: (profile?.role || "coach") as UserRole,
      isCoach,
      isAthlete,
      // Gym
      gymMemberships,
      currentGym,
      switchGym,
      isGymOwner,
      loadingGym,
      refetchGymMemberships: () =>
        user?.id ? fetchGymMemberships(user.id) : Promise.resolve(),
      // Athlete metrics
      athleteMetrics: isAthlete
        ? {
            bench_1rm: profile?.bench_1rm ?? null,
            squat_1rm: profile?.squat_1rm ?? null,
            deadlift_1rm: profile?.deadlift_1rm ?? null,
            weight_kg: profile?.weight_kg ?? null,
            height_cm: profile?.height_cm ?? null,
            mile_time: profile?.mile_time ?? null,
            gender: profile?.gender ?? null,
            recovery_score: profile?.recovery_score ?? null,
            injury_history: profile?.injury_history ?? null,
          }
        : null,
    }),
    [
      user,
      session,
      isLoading,
      profile,
      loadingProfile,
      fetchProfile,
      isCoach,
      isAthlete,
      gymMemberships,
      currentGym,
      switchGym,
      isGymOwner,
      loadingGym,
      fetchGymMemberships,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
