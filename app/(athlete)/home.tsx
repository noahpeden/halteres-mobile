import { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Text, Surface, Button, Card, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, Dumbbell, Clock, TrendingUp } from "lucide-react-native";
import { AuthContext } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { brandColors } from "@/app/_layout";
import WeeklyTrendsCard from "@/components/athlete/WeeklyTrendsCard";
import AthleteOnboardingModal from "@/components/athlete/AthleteOnboardingModal";

type Workout = {
  id: string;
  name: string;
  workout_type: string;
  description: string | null;
  hasLogged: boolean;
};

type RecentResult = {
  id: string;
  workout_id: string;
  result_type: string;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  weight_kg: number | null;
  count: number | null;
  scale: string;
  is_pr: boolean;
  created_at: string;
  workout: { name: string } | null;
  displayValue: string;
};

export default function AthleteHomeScreen() {
  const router = useRouter();
  const { user, profile, refetchProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaysWorkouts, setTodaysWorkouts] = useState<Workout[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState({
    workoutsThisWeek: 0,
    prsThisMonth: 0,
    currentStreak: 0,
  });

  const displayName = profile?.display_name || profile?.full_name || "Athlete";
  // Check if onboarding is needed
  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    if (refetchProfile) {
      await refetchProfile();
    }
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      // Determine the user's active program (today within calendar range)
      const { data: entities } = await supabase
        .from("entities")
        .select("id")
        .eq("user_id", user.id)
        .is("deleted_at", null);
      const entityIds = (entities || []).map((e) => e.id);

      let activeProgramId: string | null = null;
      if (entityIds.length > 0) {
        const { data: programs } = await supabase
          .from("programs")
          .select("id, calendar_data, created_at")
          .in("entity_id", entityIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (programs && programs.length > 0) {
          const todayDate = new Date(today);
          for (const p of programs as any[]) {
            const cal = p.calendar_data || {};
            const start = cal.start_date ? new Date(cal.start_date) : null;
            const end = cal.end_date ? new Date(cal.end_date) : null;
            if (start && end) {
              const startD = new Date(start.toISOString().split("T")[0]);
              const endD = new Date(end.toISOString().split("T")[0]);
              if (todayDate >= startD && todayDate <= endD) {
                activeProgramId = p.id as string;
                break;
              }
            }
          }
          // Fallback to most recent program if none active
          if (!activeProgramId) {
            activeProgramId = (programs[0] as any).id as string;
          }
        }
      }

      let workouts: any[] = [];
      if (activeProgramId) {
        const { data: todays } = await supabase
          .from("program_workouts")
          .select("id, name, workout_type, description, scheduled_date")
          .eq("program_id", activeProgramId)
          .gte("scheduled_date", startOfDay)
          .lte("scheduled_date", endOfDay)
          .is("deleted_at", null);
        workouts = todays || [];
      }

      // Check which workouts user has logged
      const workoutIds = workouts.map((w) => w.id);
      const { data: userResults } = await supabase
        .from("workout_results")
        .select("workout_id")
        .eq("user_id", user.id)
        .in("workout_id", workoutIds)
        .is("deleted_at", null);

      const loggedIds = new Set((userResults || []).map((r) => r.workout_id));
      setTodaysWorkouts(
        workouts.map((w) => ({
          ...w,
          hasLogged: loggedIds.has(w.id),
        }))
      );

      // Fetch recent results
      const { data: results } = await supabase
        .from("workout_results")
        .select(`
          id, workout_id, result_type, time_seconds, rounds, reps,
          weight_kg, count, scale, is_pr, created_at,
          workout:program_workouts (name)
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentResults(
        (results || []).map((r) => ({
          ...r,
          displayValue: formatResult(r),
        }))
      );

      // Fetch stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { count: workoutsThisWeek } = await supabase
        .from("workout_results")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString())
        .is("deleted_at", null);

      const { count: prsThisMonth } = await supabase
        .from("personal_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("achieved_at", monthAgo.toISOString());

      setStats({
        workoutsThisWeek: workoutsThisWeek || 0,
        prsThisMonth: prsThisMonth || 0,
        currentStreak: 0,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Onboarding Modal */}
      <AthleteOnboardingModal
        profile={profile}
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={styles.greeting}>
              Welcome back,
            </Text>
            <Text variant="headlineMedium" style={styles.name}>
              {displayName}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={1}>
            <Text variant="headlineMedium" style={styles.statValue}>
              {stats.workoutsThisWeek}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              This Week
            </Text>
          </Surface>
          <Surface style={[styles.statCard, styles.statCardWarning]} elevation={1}>
            <Text variant="headlineMedium" style={styles.statValueWarning}>
              {stats.prsThisMonth}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              PRs This Month
            </Text>
          </Surface>
          <Surface style={[styles.statCard, styles.statCardSuccess]} elevation={1}>
            <Text variant="headlineMedium" style={styles.statValueSuccess}>
              {stats.currentStreak}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              Day Streak
            </Text>
          </Surface>
        </View>

        {/* Weekly AI Trends */}
        <WeeklyTrendsCard />

        {/* Today's Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={brandColors.smartBlue.DEFAULT} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Today's Workouts
            </Text>
          </View>

          {todaysWorkouts.length === 0 ? (
            <Card style={styles.workoutCard} mode="elevated">
              <Card.Content>
                <View style={styles.workoutPlaceholder}>
                  <Dumbbell size={32} color={brandColors.practicalGray.light} />
                  <Text variant="bodyMedium" style={styles.workoutPlaceholderText}>
                    No workout scheduled for today
                  </Text>
                  <Text variant="bodySmall" style={styles.workoutSubtext}>
                    {`Create your 8-week program to get started.`}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => router.push("/(athlete)/programs/create")}
                    style={{ marginTop: 12 }}
                  >
                    Create Program
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ) : (
            todaysWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                onPress={() => router.push(`/(athlete)/workout/${workout.id}`)}
              >
                <Card style={styles.workoutCard} mode="elevated">
                  <Card.Content>
                    <View style={styles.workoutRow}>
                      <View style={styles.workoutInfo}>
                        <Text variant="titleMedium" style={styles.workoutName}>
                          {workout.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.workoutType}>
                          {workout.workout_type}
                        </Text>
                      </View>
                      {workout.hasLogged ? (
                        <Surface style={styles.completedBadge} elevation={0}>
                          <Text style={styles.completedText}>Completed</Text>
                        </Surface>
                      ) : (
                        <Button mode="contained" compact>
                          Log Result
                        </Button>
                      )}
                    </View>
                    {workout.description && (
                      <Text
                        variant="bodySmall"
                        style={styles.workoutDescription}
                        numberOfLines={2}
                      >
                        {workout.description}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={brandColors.smartBlue.DEFAULT} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => router.push("/(athlete)/history")}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentResults.length === 0 ? (
            <Surface style={styles.emptyState} elevation={1}>
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                No recent activity yet
              </Text>
              <Text variant="bodySmall" style={styles.emptyStateSubtext}>
                Complete a workout to see your history here
              </Text>
            </Surface>
          ) : (
            <Surface style={styles.activityList} elevation={1}>
              {recentResults.map((result, idx) => (
                <TouchableOpacity
                  key={result.id}
                  onPress={() => router.push(`/(athlete)/workout/${result.workout_id}`)}
                >
                  <View
                    style={[
                      styles.activityItem,
                      idx < recentResults.length - 1 && styles.activityItemBorder,
                    ]}
                  >
                    <View style={styles.activityInfo}>
                      <Text variant="bodyMedium" style={styles.activityName}>
                        {result.workout?.name || "Workout"}
                        {result.is_pr && " 🏆"}
                      </Text>
                      <Text variant="bodySmall" style={styles.activityDate}>
                        {new Date(result.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.activityResult}>
                      <Text variant="titleMedium" style={styles.activityValue}>
                        {result.displayValue}
                      </Text>
                      <Text variant="labelSmall" style={styles.activityScale}>
                        {result.scale.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Surface>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push("/(athlete)/profile")}
          >
            <Surface style={styles.quickLinkCard} elevation={1}>
              <TrendingUp size={28} color={brandColors.thrivingGreen.DEFAULT} />
              <Text variant="labelMedium" style={styles.quickLinkText}>
                My PRs
              </Text>
            </Surface>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatResult(result: any) {
  switch (result.result_type) {
    case "time":
      if (!result.time_seconds) return "-";
      const mins = Math.floor(result.time_seconds / 60);
      const secs = result.time_seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    case "rounds_reps":
      return `${result.rounds || 0} + ${result.reps || 0}`;
    case "weight":
      return `${result.weight_kg || 0} kg`;
    default:
      return `${result.count || 0}`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    opacity: 0.6,
  },
  name: {
    fontWeight: "bold",
  },
  gymBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: brandColors.smartBlue.container,
  },
  gymBadgeText: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
  },
  noGymCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  noGymIcon: {
    marginBottom: 16,
  },
  noGymTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  noGymText: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  joinButton: {
    minWidth: 200,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  statCardWarning: {
    backgroundColor: "#fffbeb",
  },
  statCardSuccess: {
    backgroundColor: "#f0fdf4",
  },
  statValue: {
    fontWeight: "bold",
    color: brandColors.smartBlue.DEFAULT,
  },
  statValueWarning: {
    fontWeight: "bold",
    color: brandColors.helpfulOrange.DEFAULT,
  },
  statValueSuccess: {
    fontWeight: "bold",
    color: brandColors.thrivingGreen.DEFAULT,
  },
  statLabel: {
    marginTop: 2,
    opacity: 0.6,
    textAlign: "center",
    fontSize: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    flex: 1,
  },
  viewAll: {
    color: brandColors.smartBlue.DEFAULT,
    fontSize: 14,
  },
  workoutCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  workoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontWeight: "600",
  },
  workoutType: {
    opacity: 0.6,
  },
  workoutDescription: {
    marginTop: 8,
    opacity: 0.7,
  },
  completedBadge: {
    backgroundColor: brandColors.thrivingGreen.container,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    color: brandColors.thrivingGreen.DEFAULT,
    fontSize: 12,
    fontWeight: "600",
  },
  workoutPlaceholder: {
    alignItems: "center",
    paddingVertical: 24,
  },
  workoutPlaceholderText: {
    marginTop: 12,
    opacity: 0.7,
  },
  workoutSubtext: {
    marginTop: 4,
    opacity: 0.5,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyStateText: {
    opacity: 0.7,
  },
  emptyStateSubtext: {
    marginTop: 4,
    opacity: 0.5,
  },
  activityList: {
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontWeight: "500",
  },
  activityDate: {
    opacity: 0.6,
  },
  activityResult: {
    alignItems: "flex-end",
  },
  activityValue: {
    fontWeight: "bold",
  },
  activityScale: {
    opacity: 0.6,
  },
  quickLinks: {
    flexDirection: "row",
    gap: 12,
  },
  quickLink: {
    flex: 1,
  },
  quickLinkCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  quickLinkText: {
    marginTop: 8,
    fontWeight: "500",
  },
});
