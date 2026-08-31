import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/AthleteTabBar";
import { AuthContext } from "@/components/providers/AuthProvider";
import { AppText } from "@/components/ui/AppText";
import { HCard } from "@/components/ui/HCard";
import { Pill } from "@/components/ui/Pill";
import { Screen } from "@/components/ui/Screen";
import { supabase } from "@/lib/supabase/client";
import { palette } from "@/lib/theme";

type Filter = "all" | "prs" | "time" | "rounds_reps" | "weight";

type Result = {
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
  notes: string | null;
  created_at: string;
  workout: { title: string } | null;
  displayValue: string;
};

type MonthGroup = {
  monthKey: string;
  label: string;
  results: Result[];
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "prs", label: "PRs" },
  { value: "time", label: "Time" },
  { value: "rounds_reps", label: "AMRAP" },
  { value: "weight", label: "Weight" },
];

export default function HistoryScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchHistory = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("workout_results")
        .select(`
          id, workout_id, result_type, time_seconds, rounds, reps,
          weight_kg, count, scale, is_pr, notes, created_at,
          workout:program_workouts (title)
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(
        (data || []).map((result) => ({
          ...result,
          displayValue: formatResult(result),
        })),
      );
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredResults = results.filter((r) => {
    if (filter === "all") return true;
    if (filter === "prs") return r.is_pr;
    return r.result_type === filter;
  });

  const groupedResults: MonthGroup[] = Object.values(
    filteredResults.reduce((acc: Record<string, MonthGroup>, result) => {
      const date = new Date(result.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!acc[monthKey]) {
        acc[monthKey] = { monthKey, label: monthLabel, results: [] };
      }
      acc[monthKey].results.push(result);
      return acc;
    }, {}),
  ).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

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
      <View style={styles.header}>
        <AppText variant="eyebrow">The book</AppText>
        <AppText variant="display" style={styles.title}>
          History
        </AppText>
        <AppText variant="italic">
          {results.length
            ? `${results.length} session${results.length === 1 ? "" : "s"} logged.`
            : "Nothing in ink yet."}
        </AppText>
      </View>

      <View style={styles.filters}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item.value}
          renderItem={({ item: f }) => (
            <Pill
              label={f.label}
              selected={filter === f.value}
              onPress={() => setFilter(f.value)}
              tone={f.value === "prs" ? "peach" : "blue"}
            />
          )}
        />
      </View>

      {filteredResults.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="headline">
            {filter === "all" ? "A quiet log." : "Nothing in this drawer."}
          </AppText>
          <AppText variant="body" style={styles.emptyText}>
            {filter === "all"
              ? "Train a day, log it, and it lives here."
              : `No ${filter === "prs" ? "PRs" : filter} yet.`}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={groupedResults}
          keyExtractor={(item) => item.monthKey}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchHistory();
              }}
              tintColor={palette.blue}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.month}>
              <AppText variant="headline" style={styles.monthLabel}>
                {item.label}
              </AppText>
              {item.results.map((result) => (
                <HCard
                  key={result.id}
                  accent={result.is_pr ? "peach" : "blue"}
                  onPress={() =>
                    router.push(`/(athlete)/workout/${result.workout_id}`)
                  }
                >
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <AppText variant="title" numberOfLines={1}>
                        {result.workout?.title || "Workout"}
                      </AppText>
                      <AppText variant="bodySmall">
                        {new Date(result.created_at).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                        {result.is_pr ? "  ·  PR" : ""}
                      </AppText>
                      {result.notes ? (
                        <AppText
                          variant="italic"
                          numberOfLines={1}
                          style={styles.notes}
                        >
                          {result.notes}
                        </AppText>
                      ) : null}
                    </View>
                    <View style={styles.rowRight}>
                      <AppText variant="title">{result.displayValue}</AppText>
                      <AppText variant="eyebrow">{result.scale}</AppText>
                    </View>
                    <ChevronRight size={16} color={palette.inkFaint} />
                  </View>
                </HCard>
              ))}
            </View>
          )}
        />
      )}
    </Screen>
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
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8 },
  title: { marginTop: 6, marginBottom: 6 },
  filters: { marginBottom: 4 },
  filterList: { paddingHorizontal: 22, gap: 8, paddingBottom: 8 },
  list: { paddingHorizontal: 22, paddingBottom: TAB_BAR_CLEARANCE, gap: 8 },
  month: { marginBottom: 10, gap: 10 },
  monthLabel: { marginBottom: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: "flex-end" },
  notes: { marginTop: 4, fontSize: 14 },
  empty: {
    flex: 1,
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { textAlign: "center", marginTop: 8 },
});
