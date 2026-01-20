import { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Image } from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Menu,
  Button,
  SegmentedButtons,
  Avatar,
  Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, ChevronDown, Building2, Award, Flame, Zap, Medal } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";
import LeaderboardView from "@/components/athlete/LeaderboardView";
import { useAggregateLeaderboard, type AggregateLeaderboardEntry } from "@/hooks/useAggregateLeaderboard";

type Workout = {
  id: string;
  name: string;
  scheduled_date: string | null;
  resultCount: number;
};

type Tab = "workout" | "weekly" | "monthly";

export default function LeaderboardScreen() {
  const { user, currentGym } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<Tab>("workout");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const {
    leaderboard: aggregateLeaderboard,
    loading: aggregateLoading,
    fetchLeaderboard,
    periodLabel,
  } = useAggregateLeaderboard();

  const fetchWorkoutsWithResults = useCallback(async () => {
    if (!currentGym?.id) {
      setLoading(false);
      return;
    }

    try {
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

  useEffect(() => {
    if (currentGym?.id && (activeTab === "weekly" || activeTab === "monthly")) {
      fetchLeaderboard(currentGym.id, activeTab === "weekly" ? "week" : "month");
    }
  }, [activeTab, currentGym?.id, fetchLeaderboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (activeTab === "workout") {
      fetchWorkoutsWithResults();
    } else {
      fetchLeaderboard(currentGym?.id || "", activeTab === "weekly" ? "week" : "month");
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Text style={styles.rankEmoji}>🥇</Text>;
      case 2:
        return <Text style={styles.rankEmoji}>🥈</Text>;
      case 3:
        return <Text style={styles.rankEmoji}>🥉</Text>;
      default:
        return <Text style={styles.rankNumber}>{rank}</Text>;
    }
  };

  const getBadgeIcon = (badgeId: string) => {
    switch (badgeId) {
      case "consistency":
        return <Flame size={12} color={brandColors.helpfulOrange.DEFAULT} />;
      case "pr_machine":
        return <Award size={12} color={brandColors.smartBlue.DEFAULT} />;
      case "rx_warrior":
        return <Zap size={12} color={brandColors.thrivingGreen.DEFAULT} />;
      case "podium":
        return <Medal size={12} color={brandColors.helpfulOrange.DEFAULT} />;
      default:
        return null;
    }
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

      {/* Tab Navigation */}
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Tab)}
        buttons={[
          { value: "workout", label: "By Workout" },
          { value: "weekly", label: "This Week" },
          { value: "monthly", label: "This Month" },
        ]}
        style={styles.tabs}
      />

      {/* Workout Leaderboard Tab */}
      {activeTab === "workout" && (
        <>
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
        </>
      )}

      {/* Aggregate Leaderboard Tab (Weekly/Monthly) */}
      {(activeTab === "weekly" || activeTab === "monthly") && (
        <ScrollView
          contentContainerStyle={styles.aggregateContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {aggregateLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={brandColors.smartBlue.DEFAULT} />
            </View>
          ) : aggregateLeaderboard.length === 0 ? (
            <Surface style={styles.emptyState} elevation={2}>
              <Trophy size={48} color={brandColors.practicalGray.light} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Results Yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No results {activeTab === "weekly" ? "this week" : "this month"} yet.
              </Text>
            </Surface>
          ) : (
            <>
              {/* Points Legend */}
              <Surface style={styles.legendCard} elevation={1}>
                <Text variant="bodySmall" style={styles.legendText}>
                  Points: 1st +10, 2nd +7, 3rd +5, Logged +3, PR +2, RX +1
                </Text>
              </Surface>

              {/* Leaderboard Entries */}
              {aggregateLeaderboard.map((entry: AggregateLeaderboardEntry) => (
                <Surface
                  key={entry.userId}
                  style={[
                    styles.entryCard,
                    entry.isCurrentUser && styles.entryCardCurrentUser,
                  ]}
                  elevation={entry.isCurrentUser ? 3 : 1}
                >
                  <View style={styles.entryRow}>
                    {/* Rank */}
                    <View style={styles.rankContainer}>
                      {getRankBadge(entry.rank)}
                    </View>

                    {/* Avatar */}
                    {entry.user?.profile_photo_url ? (
                      <Avatar.Image
                        size={40}
                        source={{ uri: entry.user.profile_photo_url }}
                      />
                    ) : (
                      <Avatar.Text
                        size={40}
                        label={(entry.user?.display_name || entry.user?.full_name || "U")
                          .charAt(0)
                          .toUpperCase()}
                        style={styles.avatar}
                      />
                    )}

                    {/* Name and Stats */}
                    <View style={styles.entryInfo}>
                      <View style={styles.nameRow}>
                        <Text variant="bodyLarge" style={styles.entryName} numberOfLines={1}>
                          {entry.user?.display_name || entry.user?.full_name || "Anonymous"}
                        </Text>
                        {entry.isCurrentUser && (
                          <Chip compact mode="flat" style={styles.youChip}>
                            You
                          </Chip>
                        )}
                      </View>
                      <View style={styles.statsRow}>
                        <Text variant="bodySmall" style={styles.statText}>
                          {entry.workoutsLogged} workouts
                        </Text>
                        {entry.firstPlaces > 0 && (
                          <Text variant="bodySmall" style={styles.statText}>
                            • {entry.firstPlaces} wins
                          </Text>
                        )}
                        {entry.prs > 0 && (
                          <Text variant="bodySmall" style={styles.statText}>
                            • {entry.prs} PRs
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Points */}
                    <View style={styles.pointsContainer}>
                      <Text variant="headlineSmall" style={styles.pointsValue}>
                        {entry.points}
                      </Text>
                      <Text variant="labelSmall" style={styles.pointsLabel}>
                        pts
                      </Text>
                    </View>
                  </View>

                  {/* Badges */}
                  {entry.badges && entry.badges.length > 0 && (
                    <View style={styles.badgesRow}>
                      {entry.badges.map((badge) => (
                        <View key={badge.id} style={styles.badge}>
                          <Text style={styles.badgeIcon}>{badge.icon}</Text>
                          <Text variant="labelSmall" style={styles.badgeLabel}>
                            {badge.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Surface>
              ))}
            </>
          )}
        </ScrollView>
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
  tabs: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  aggregateContent: {
    padding: 16,
    paddingBottom: 100,
  },
  legendCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
  },
  legendText: {
    textAlign: "center",
    opacity: 0.7,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  entryCardCurrentUser: {
    backgroundColor: brandColors.smartBlue.container,
    borderWidth: 2,
    borderColor: brandColors.smartBlue.DEFAULT,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "bold",
    opacity: 0.5,
  },
  avatar: {
    backgroundColor: brandColors.practicalGray.light,
  },
  entryInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entryName: {
    fontWeight: "500",
    flexShrink: 1,
  },
  youChip: {
    height: 20,
    backgroundColor: brandColors.smartBlue.DEFAULT,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  statText: {
    opacity: 0.6,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsValue: {
    fontWeight: "bold",
    color: brandColors.smartBlue.DEFAULT,
  },
  pointsLabel: {
    opacity: 0.6,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeLabel: {
    opacity: 0.8,
  },
});
