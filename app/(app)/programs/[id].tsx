import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  Target,
  TrendingUp,
} from "lucide-react-native";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Card,
  Chip,
  Text,
  useTheme,
} from "react-native-paper";
import { useProgramDataMobile } from "@/hooks/useProgramDataMobile";
import { useProgramWorkoutsMobile } from "@/hooks/useProgramWorkoutsMobile";
import { useState } from "react";

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const {
    program,
    loading: programLoading,
    refetch: refetchProgram,
  } = useProgramDataMobile(id as string);
  const {
    workouts,
    loading: workoutsLoading,
    refetch: refetchWorkouts,
  } = useProgramWorkoutsMobile(id as string);

  const loading = programLoading || workoutsLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProgram(), refetchWorkouts()]);
    setRefreshing(false);
  };

  // Group workouts by week
  const groupWorkoutsByWeek = () => {
    const grouped: { [key: string]: typeof workouts } = {};

    workouts.forEach((workout) => {
      if (workout.scheduled_date) {
        const date = new Date(workout.scheduled_date);
        const weekNum = Math.ceil(
          (date.getTime() - new Date(program?.created_at || 0).getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        );
        const weekKey = `Week ${Math.max(1, weekNum)}`;
        if (!grouped[weekKey]) {
          grouped[weekKey] = [];
        }
        grouped[weekKey].push(workout);
      } else {
        const unscheduledKey = "Unscheduled";
        if (!grouped[unscheduledKey]) {
          grouped[unscheduledKey] = [];
        }
        grouped[unscheduledKey].push(workout);
      }
    });

    return grouped;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !program) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge">Program not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedWorkouts = groupWorkoutsByWeek();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderColor: theme.colors.outlineVariant }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Program Details
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Program Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.programName}>
              {program.name}
            </Text>
            {program.description && (
              <Text variant="bodyMedium" style={styles.description}>
                {program.description}
              </Text>
            )}

            <View style={styles.metadataContainer}>
              <View style={styles.metadataRow}>
                <Calendar size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.metadataText}>
                  {program.duration_weeks}{" "}
                  {program.duration_weeks === 1 ? "week" : "weeks"}
                </Text>
              </View>

              {program.goal && (
                <View style={styles.metadataRow}>
                  <Target size={16} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.metadataText}>
                    {program.goal}
                  </Text>
                </View>
              )}

              {program.difficulty && (
                <View style={styles.metadataRow}>
                  <TrendingUp size={16} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.metadataText}>
                    {program.difficulty}
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Workouts Section */}
        <View style={styles.workoutsSection}>
          <View style={styles.sectionHeader}>
            <Dumbbell size={20} color={theme.colors.primary} />
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Workouts
            </Text>
            <Chip>{workouts.length}</Chip>
          </View>

          {workouts.length === 0 ? (
            <Card style={styles.card}>
              <Card.Content>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.emptyText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  No workouts yet. Generate workouts for this program.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            Object.keys(groupedWorkouts)
              .sort((a, b) => {
                if (a === "Unscheduled") return 1;
                if (b === "Unscheduled") return -1;
                return a.localeCompare(b);
              })
              .map((week) => (
                <View key={week} style={styles.weekSection}>
                  <Text variant="titleMedium" style={styles.weekTitle}>
                    {week}
                  </Text>
                  {groupedWorkouts[week].map((workout) => (
                    <Card key={workout.id} style={styles.workoutCard}>
                      <Card.Content>
                        <View style={styles.workoutHeader}>
                          <Text
                            variant="titleMedium"
                            style={styles.workoutTitle}
                          >
                            {workout.title}
                          </Text>
                          {workout.scheduled_date && (
                            <Chip compact>
                              {formatDate(workout.scheduled_date)}
                            </Chip>
                          )}
                        </View>
                        {workout.body && (
                          <Text
                            variant="bodySmall"
                            style={styles.workoutBody}
                            numberOfLines={3}
                          >
                            {workout.body}
                          </Text>
                        )}
                        {workout.tags && workout.tags.length > 0 && (
                          <View style={styles.tagsContainer}>
                            {workout.tags.slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                compact
                                mode="outlined"
                                style={styles.tag}
                              >
                                {tag}
                              </Chip>
                            ))}
                          </View>
                        )}
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  programName: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    opacity: 0.7,
  },
  metadataContainer: {
    gap: 8,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metadataText: {
    textTransform: "capitalize",
  },
  workoutsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    fontStyle: "italic",
  },
  weekSection: {
    marginBottom: 24,
  },
  weekTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  workoutCard: {
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  workoutTitle: {
    fontWeight: "600",
    flex: 1,
  },
  workoutBody: {
    opacity: 0.7,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    height: 24,
  },
});
