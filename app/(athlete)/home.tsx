import { useRouter } from "expo-router";
import { Check, PenLine } from "lucide-react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import AthleteOnboardingModal from "@/components/athlete/AthleteOnboardingModal";
import WeeklyTrendsCard from "@/components/athlete/WeeklyTrendsCard";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/AthleteTabBar";
import { AuthContext } from "@/components/providers/AuthProvider";
import { AppText } from "@/components/ui/AppText";
import { HButton } from "@/components/ui/HButton";
import { HCard } from "@/components/ui/HCard";
import { Screen } from "@/components/ui/Screen";
import { supabase } from "@/lib/supabase/client";
import { palette } from "@/lib/theme";

type Workout = {
  id: string;
  title: string;
  workout_type: string;
  body: string | null;
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
  workout: { title?: string; name?: string } | null;
  displayValue: string;
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

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

  const displayName = profile?.display_name || profile?.full_name || "friend";
  const firstName = displayName.split(" ")[0];

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
          for (const p of programs as {
            id: string;
            calendar_data?: { start_date?: string; end_date?: string };
          }[]) {
            const cal = p.calendar_data || {};
            const start = cal.start_date ? new Date(cal.start_date) : null;
            const end = cal.end_date ? new Date(cal.end_date) : null;
            if (start && end) {
              const startD = new Date(start.toISOString().split("T")[0]);
              const endD = new Date(end.toISOString().split("T")[0]);
              if (todayDate >= startD && todayDate <= endD) {
                activeProgramId = p.id;
                break;
              }
            }
          }
          if (!activeProgramId) {
            activeProgramId = (programs[0] as { id: string }).id;
          }
        }
      }

      let workouts: {
        id: string;
        title: string;
        workout_type: string;
        body: string | null;
      }[] = [];
      if (activeProgramId) {
        const { data: todays } = await supabase
          .from("program_workouts")
          .select("id, title, workout_type, body, scheduled_date")
          .eq("program_id", activeProgramId)
          .gte("scheduled_date", startOfDay)
          .lte("scheduled_date", endOfDay)
          .is("deleted_at", null);
        workouts = todays || [];
      }

      const workoutIds = workouts.map((w) => w.id);
      const { data: userResults } = await supabase
        .from("workout_results")
        .select("workout_id")
        .eq("user_id", user.id)
        .in(
          "workout_id",
          workoutIds.length
            ? workoutIds
            : ["00000000-0000-0000-0000-000000000000"],
        )
        .is("deleted_at", null);

      const loggedIds = new Set((userResults || []).map((r) => r.workout_id));
      setTodaysWorkouts(
        workouts.map((w) => ({
          ...w,
          hasLogged: loggedIds.has(w.id),
        })),
      );

      const { data: results } = await supabase
        .from("workout_results")
        .select(`
          id, workout_id, result_type, time_seconds, rounds, reps,
          weight_kg, count, scale, is_pr, created_at,
          workout:program_workouts (title)
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentResults(
        (results || []).map((r) => ({
          ...r,
          displayValue: formatResult(r),
        })),
      );

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

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hello = greetingForHour(new Date().getHours());

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={palette.blue} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AthleteOnboardingModal
        profile={profile}
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="eyebrow">{todayLabel}</AppText>
          <AppText variant="display" style={styles.hello}>
            {hello}, {firstName}.
          </AppText>
          <AppText variant="italic">
            What’s on the floor — write it, train it, log it.
          </AppText>
        </View>

        <View style={styles.stamps}>
          <Stamp
            value={stats.workoutsThisWeek}
            label="this week"
            color={palette.blue}
          />
          <Stamp
            value={stats.prsThisMonth}
            label="PRs this month"
            color={palette.orange}
          />
        </View>

        <WeeklyTrendsCard />

        <View style={styles.sectionHead}>
          <AppText variant="headline">Today</AppText>
          <AppText
            variant="label"
            color={palette.blue}
            onPress={() => router.push("/(athlete)/programs/create")}
          >
            New program
          </AppText>
        </View>

        {todaysWorkouts.length === 0 ? (
          <HCard accent="orange">
            <AppText variant="title">Nothing scheduled.</AppText>
            <AppText variant="body" style={styles.cardBody}>
              A blank page. Write a program and today’s session will land here.
            </AppText>
            <View style={styles.cardCta}>
              <HButton
                label="Write a program"
                tone="orange"
                icon={<PenLine size={16} color={palette.white} />}
                onPress={() => router.push("/(athlete)/programs/create")}
              />
            </View>
          </HCard>
        ) : (
          todaysWorkouts.map((workout) => (
            <HCard
              key={workout.id}
              accent={workout.hasLogged ? "green" : "blue"}
              onPress={() => router.push(`/(athlete)/workout/${workout.id}`)}
            >
              <AppText variant="eyebrow">
                {workout.workout_type || "Session"}
              </AppText>
              <AppText variant="headline" style={styles.workoutTitle}>
                {workout.title}
              </AppText>
              {workout.body ? (
                <AppText
                  variant="body"
                  numberOfLines={2}
                  style={styles.cardBody}
                >
                  {workout.body}
                </AppText>
              ) : null}
              <View style={styles.cardCta}>
                {workout.hasLogged ? (
                  <View style={styles.doneRow}>
                    <Check size={16} color={palette.green} />
                    <AppText variant="label" color={palette.green}>
                      Logged
                    </AppText>
                  </View>
                ) : (
                  <HButton
                    label="Log it"
                    tone="blue"
                    onPress={() =>
                      router.push(`/(athlete)/workout/${workout.id}`)
                    }
                  />
                )}
              </View>
            </HCard>
          ))
        )}

        <View style={[styles.sectionHead, { marginTop: 28 }]}>
          <AppText variant="headline">Recent ink</AppText>
          <AppText
            variant="label"
            color={palette.blue}
            onPress={() => router.push("/(athlete)/history")}
          >
            Full log
          </AppText>
        </View>

        {recentResults.length === 0 ? (
          <HCard>
            <AppText variant="title">The log is empty.</AppText>
            <AppText variant="body" style={styles.cardBody}>
              Finish a session and it shows up here — a quiet record, not a
              leaderboard.
            </AppText>
          </HCard>
        ) : (
          <HCard padded={false}>
            {recentResults.map((result, idx) => (
              <View
                key={result.id}
                style={[
                  styles.logRow,
                  idx < recentResults.length - 1 && styles.logBorder,
                ]}
              >
                <View style={styles.logLeft}>
                  <AppText
                    variant="title"
                    onPress={() =>
                      router.push(`/(athlete)/workout/${result.workout_id}`)
                    }
                  >
                    {result.workout?.title || "Workout"}
                    {result.is_pr ? "  ·  PR" : ""}
                  </AppText>
                  <AppText variant="bodySmall">
                    {new Date(result.created_at).toLocaleDateString()}
                  </AppText>
                </View>
                <View style={styles.logRight}>
                  <AppText variant="title">{result.displayValue}</AppText>
                  <AppText variant="eyebrow">{result.scale}</AppText>
                </View>
              </View>
            ))}
          </HCard>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stamp({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.stamp, { borderColor: color }]}>
      <AppText variant="stat" color={color}>
        {value}
      </AppText>
      <AppText variant="eyebrow" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

function formatResult(result: {
  result_type: string;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  weight_kg: number | null;
  count: number | null;
}) {
  switch (result.result_type) {
    case "time": {
      if (!result.time_seconds) return "—";
      const mins = Math.floor(result.time_seconds / 60);
      const secs = result.time_seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    case "rounds_reps":
      return `${result.rounds || 0} + ${result.reps || 0}`;
    case "weight":
      return `${result.weight_kg || 0} kg`;
    default:
      return `${result.count || 0}`;
  }
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: 12,
  },
  header: { marginBottom: 8 },
  hello: { marginTop: 6, marginBottom: 6 },
  stamps: { flexDirection: "row", gap: 10, marginBottom: 4 },
  stamp: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: palette.paperElevated,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
  },
  workoutTitle: { marginTop: 4 },
  cardBody: { marginTop: 8 },
  cardCta: { marginTop: 16 },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  logBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.rule,
  },
  logLeft: { flex: 1, paddingRight: 12 },
  logRight: { alignItems: "flex-end" },
});
