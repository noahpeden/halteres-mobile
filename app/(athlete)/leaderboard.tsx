import { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Menu,
  Button,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, ChevronDown, Building2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";
import LeaderboardView from "@/components/athlete/LeaderboardView";

type Workout = {
  id: string;
  name: string;
  scheduled_date: string | null;
  resultCount: number;
};

export default function LeaderboardScreen() {
  const { user, currentGym } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchWorkoutsWithResults = useCallback(async () => {
    if (!currentGym?.id) {
      setLoading(false);
      return;
    }

    try {
      // Get workouts that have results in this gym
      const { data: results, error: resultsError } = await supabase
        .from("workout_results")
        .select(`
          workout_id,
          workout:program_workouts (id, name, scheduled_date)
        `)
        .eq("gym_id", currentGym.id)
        .eq("include_in_leaderboard", true)
        .is("deleted_at", null);

      if (resultsError) throw resultsError;

      // Aggregate and deduplicate workouts
      const workoutMap: Record<string, Workout> = {};
      (results || []).forEach((result) => {
        if (result.workout?.id) {
          const wId = result.workout.id;
          if (!workoutMap[wId]) {
            workoutMap[wId] = {
              id: result.workout.id,
              name: result.workout.name,
              scheduled_date: result.workout.scheduled_date,
              resultCount: 0,
            };
          }
          workoutMap[wId].resultCount += 1;
        }
      });

      // Sort by date (newest first) then by result count
      const sortedWorkouts = Object.values(workoutMap).sort((a, b) => {
        if (a.scheduled_date && b.scheduled_date) {
          return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime();
        }
        return b.resultCount - a.resultCount;
      });

      setWorkouts(sortedWorkouts);
      if (sortedWorkouts.length > 0) {
        setSelectedWorkout(sortedWorkouts[0]);
      }
    } catch (err) {
      console.error("Error fetching workouts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentGym?.id]);

  useEffect(() => {
    fetchWorkoutsWithResults();
  }, [fetchWorkoutsWithResults]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkoutsWithResults();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.smartBlue.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentGym) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Leaderboard
          </Text>
        </View>
        <Surface style={styles.emptyState} elevation={2}>
          <Building2 size={48} color={brandColors.practicalGray.light} />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Join a Gym First
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            You need to join a gym to see leaderboards.
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Leaderboards
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {currentGym.name}
        </Text>
      </View>

      {workouts.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Surface style={styles.emptyState} elevation={2}>
            <Trophy size={48} color={brandColors.practicalGray.light} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Results Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Complete a workout and log your results to appear on the leaderboard.
            </Text>
          </Surface>
        </ScrollView>
      ) : (
        <View style={styles.content}>
          {/* Workout Selector */}
          <View style={styles.selectorContainer}>
            <Text variant="labelLarge" style={styles.selectorLabel}>
              Select Workout
            </Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  contentStyle={styles.selectorButton}
                  icon={() => <ChevronDown size={18} color="#666" />}
                >
                  {selectedWorkout?.name || "Select workout"}
                  {selectedWorkout?.scheduled_date &&
                    ` - ${formatDate(selectedWorkout.scheduled_date)}`}
                </Button>
              }
              style={styles.menu}
            >
              {workouts.map((workout) => (
                <Menu.Item
                  key={workout.id}
                  onPress={() => {
                    setSelectedWorkout(workout);
                    setMenuVisible(false);
                  }}
                  title={`${workout.name} ${workout.scheduled_date ? `- ${formatDate(workout.scheduled_date)}` : ""}`}
                  leadingIcon={selectedWorkout?.id === workout.id ? "check" : undefined}
                />
              ))}
            </Menu>
          </View>

          {/* Leaderboard */}
          {selectedWorkout && (
            <View style={styles.leaderboardContainer}>
              <LeaderboardView
                workoutId={selectedWorkout.id}
                gymId={currentGym.id}
                workoutTitle={selectedWorkout.name}
              />
            </View>
          )}
        </View>
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
  emptyContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyTitle: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  selectorContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  selectorLabel: {
    fontWeight: "600",
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  menu: {
    marginTop: 48,
  },
  leaderboardContainer: {
    flex: 1,
  },
});
