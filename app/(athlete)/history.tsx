import { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text, Surface, Chip, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Clock, ChevronRight } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";

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
  workout: {
    title: string;
  } | null;
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
  const { dbUserId } = useContext(AuthContext);
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchHistory = useCallback(async () => {
    if (!dbUserId) {
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
        .eq("user_id", dbUserId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedResults = (data || []).map((result) => ({
        ...result,
        displayValue: formatResult(result),
      }));

      setResults(formattedResults);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dbUserId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatResult = (result: any): string => {
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
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // Filter results
  const filteredResults = results.filter((r) => {
    if (filter === "all") return true;
    if (filter === "prs") return r.is_pr;
    return r.result_type === filter;
  });

  // Group by month
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
    }, {})
  ).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  const navigateToWorkout = (workoutId: string) => {
    router.push(`/(athlete)/workout/${workoutId}`);
  };

  const renderResultCard = ({ item }: { item: Result }) => (
    <TouchableOpacity
      onPress={() => navigateToWorkout(item.workout_id)}
      activeOpacity={0.7}
    >
      <Surface style={styles.resultCard} elevation={1}>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <View style={styles.workoutNameRow}>
              <Text variant="titleMedium" style={styles.workoutName} numberOfLines={1}>
                {item.workout?.title || "Workout"}
              </Text>
              {item.is_pr && <Text style={styles.prIcon}>🏆</Text>}
            </View>
            <Text variant="bodySmall" style={styles.date}>
              {new Date(item.created_at).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
            {item.notes && (
              <Text variant="bodySmall" style={styles.notes} numberOfLines={1}>
                {item.notes}
              </Text>
            )}
          </View>
          <View style={styles.cardRight}>
            <Text variant="titleLarge" style={styles.resultValue}>
              {item.displayValue}
            </Text>
            <Chip compact mode="outlined" style={styles.scaleChip}>
              {item.scale.toUpperCase()}
            </Chip>
          </View>
          <ChevronRight size={20} color="#ccc" />
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderMonthSection = ({ item }: { item: MonthGroup }) => (
    <View style={styles.monthSection}>
      <Text variant="titleMedium" style={styles.monthLabel}>
        {item.label}
      </Text>
      {item.results.map((result) => (
        <View key={result.id}>{renderResultCard({ item: result })}</View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.smartBlue.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Workout History
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {results.length} total workouts logged
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item.value}
          renderItem={({ item: f }) => (
            <Chip
              selected={filter === f.value}
              onPress={() => setFilter(f.value)}
              mode={filter === f.value ? "flat" : "outlined"}
              style={[
                styles.filterChip,
                filter === f.value && styles.activeFilterChip,
              ]}
              textStyle={filter === f.value ? styles.activeFilterText : undefined}
            >
              {f.value === "prs" ? "🏆 " : ""}
              {f.label}
            </Chip>
          )}
        />
      </View>

      {/* Results */}
      {filteredResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock
            size={48}
            color={brandColors.practicalGray.light}
            style={styles.emptyIcon}
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            {filter === "all" ? "No History Yet" : "No Results Found"}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {filter === "all"
              ? "Your completed workouts will appear here."
              : `No ${filter === "prs" ? "PRs" : filter} results found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedResults}
          renderItem={renderMonthSection}
          keyExtractor={(item) => item.monthKey}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    marginRight: 4,
  },
  activeFilterChip: {
    backgroundColor: brandColors.smartBlue.DEFAULT,
  },
  activeFilterText: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  monthSection: {
    marginBottom: 16,
  },
  monthLabel: {
    fontWeight: "600",
    opacity: 0.7,
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  cardLeft: {
    flex: 1,
  },
  workoutNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  workoutName: {
    fontWeight: "600",
    flex: 1,
  },
  prIcon: {
    fontSize: 14,
  },
  date: {
    opacity: 0.6,
    marginTop: 2,
  },
  notes: {
    opacity: 0.5,
    fontStyle: "italic",
    marginTop: 4,
  },
  cardRight: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  resultValue: {
    fontWeight: "bold",
  },
  scaleChip: {
    height: 24,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
  },
});
