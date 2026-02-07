import { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Chip,
  ProgressBar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Dumbbell,
  Calendar,
  ChevronRight,
  Target,
  Clock,
} from "lucide-react-native";
import { AuthContext } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { brandColors } from "@/app/_layout";

type Program = {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  difficulty: string | null;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  workout_count: number;
  completed_workouts: number;
};

export default function AthleteProgramsScreen() {
  const router = useRouter();
  const { user, currentGym } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

  const fetchPrograms = useCallback(async () => {
    if (!currentGym?.id || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch programs assigned to this gym
      const { data: programsData, error: programsError } = await supabase
        .from("programs")
        .select(`
          id, name, description, duration_weeks, difficulty, goal,
          calendar_data,
          program_workouts (id)
        `)
        .eq("gym_id", currentGym.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (programsError) throw programsError;

      // Get workout counts and completed workouts for each program
      const programsWithProgress = await Promise.all(
        (programsData || []).map(async (program: any) => {
          const workoutIds = (program.program_workouts || []).map((w: any) => w.id);

          // Count completed workouts for this user
          const { count: completedCount } = await supabase
            .from("workout_results")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .in("workout_id", workoutIds)
            .is("deleted_at", null);

          return {
            id: program.id,
            name: program.name,
            description: program.description,
            duration_weeks: program.duration_weeks,
            difficulty: program.difficulty,
            goal: program.goal,
            start_date: program.calendar_data?.start_date || null,
            end_date: program.calendar_data?.end_date || null,
            workout_count: workoutIds.length,
            completed_workouts: completedCount || 0,
          };
        })
      );

      setPrograms(programsWithProgress);
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentGym?.id, user?.id]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return brandColors.thrivingGreen.DEFAULT;
      case "intermediate":
        return brandColors.smartBlue.DEFAULT;
      case "advanced":
        return brandColors.helpfulOrange.DEFAULT;
      default:
        return brandColors.practicalGray.medium;
    }
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return null;
    const startDate = new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!end) return startDate;
    const endDate = new Date(end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${startDate} - ${endDate}`;
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            My Programs
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Your assigned training programs
          </Text>
        </View>

        {!currentGym ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Dumbbell size={48} color={brandColors.practicalGray.light} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Gym Connected
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Join a gym to see your assigned programs
            </Text>
          </Surface>
        ) : programs.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Dumbbell size={48} color={brandColors.practicalGray.light} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Programs Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Your coach hasn't assigned any programs yet. Check back later!
            </Text>
          </Surface>
        ) : (
          <View style={styles.programsList}>
            {programs.map((program) => {
              const progress =
                program.workout_count > 0
                  ? program.completed_workouts / program.workout_count
                  : 0;
              const dateRange = formatDateRange(program.start_date, program.end_date);

              return (
                <TouchableOpacity
                  key={program.id}
                  onPress={() => {
                    // Navigate to program detail (could be athlete-specific view)
                    // For now, we can view but not edit
                  }}
                  activeOpacity={0.7}
                >
                  <Surface style={styles.programCard} elevation={2}>
                    <View style={styles.programHeader}>
                      <View style={styles.programIcon}>
                        <Dumbbell
                          size={24}
                          color={brandColors.smartBlue.DEFAULT}
                        />
                      </View>
                      <View style={styles.programInfo}>
                        <Text variant="titleMedium" style={styles.programName}>
                          {program.name}
                        </Text>
                        {program.difficulty && (
                          <Chip
                            compact
                            style={[
                              styles.difficultyChip,
                              {
                                backgroundColor: `${getDifficultyColor(program.difficulty)}20`,
                              },
                            ]}
                            textStyle={{
                              color: getDifficultyColor(program.difficulty),
                              fontSize: 10,
                            }}
                          >
                            {program.difficulty}
                          </Chip>
                        )}
                      </View>
                      <ChevronRight
                        size={20}
                        color={brandColors.practicalGray.light}
                      />
                    </View>

                    {program.description && (
                      <Text
                        variant="bodySmall"
                        style={styles.programDescription}
                        numberOfLines={2}
                      >
                        {program.description}
                      </Text>
                    )}

                    <View style={styles.programMeta}>
                      {dateRange && (
                        <View style={styles.metaItem}>
                          <Calendar
                            size={14}
                            color={brandColors.practicalGray.medium}
                          />
                          <Text variant="labelSmall" style={styles.metaText}>
                            {dateRange}
                          </Text>
                        </View>
                      )}
                      <View style={styles.metaItem}>
                        <Clock
                          size={14}
                          color={brandColors.practicalGray.medium}
                        />
                        <Text variant="labelSmall" style={styles.metaText}>
                          {program.duration_weeks} weeks
                        </Text>
                      </View>
                      {program.goal && (
                        <View style={styles.metaItem}>
                          <Target
                            size={14}
                            color={brandColors.practicalGray.medium}
                          />
                          <Text variant="labelSmall" style={styles.metaText}>
                            {program.goal}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressHeader}>
                        <Text variant="labelSmall" style={styles.progressLabel}>
                          Progress
                        </Text>
                        <Text variant="labelSmall" style={styles.progressValue}>
                          {program.completed_workouts} / {program.workout_count} workouts
                        </Text>
                      </View>
                      <ProgressBar
                        progress={progress}
                        color={brandColors.thrivingGreen.DEFAULT}
                        style={styles.progressBar}
                      />
                    </View>
                  </Surface>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: "700",
  },
  headerSubtitle: {
    color: brandColors.practicalGray.medium,
    marginTop: 4,
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: brandColors.practicalGray.medium,
  },
  programsList: {
    gap: 12,
  },
  programCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: brandColors.smartBlue.container,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  difficultyChip: {
    alignSelf: "flex-start",
    height: 22,
  },
  programDescription: {
    color: brandColors.practicalGray.medium,
    marginTop: 12,
    lineHeight: 20,
  },
  programMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: brandColors.practicalGray.medium,
  },
  progressContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    color: brandColors.practicalGray.medium,
    fontWeight: "500",
  },
  progressValue: {
    color: brandColors.practicalGray.medium,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f0f0f0",
  },
});
