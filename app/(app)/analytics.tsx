import { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Avatar,
  Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://halteres.ai";

type Overview = {
  totalMembers: number;
  resultsToday: number;
  prsThisWeek: number;
  resultsThisWeek: number;
};

type PR = {
  id: string;
  category: string;
  custom_name: string | null;
  displayValue: string;
  displayName: string;
  achieved_at: string;
  user?: {
    profile_photo_url: string | null;
  };
};

type Performer = {
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  workoutCount: number;
  prCount: number;
};

type Participation = {
  participationByDay: { label: string; count: number }[];
  activeAthletes: number;
  totalAthletes: number;
  participationRate: number;
};

export default function AnalyticsScreen() {
  const { currentGym } = useContext(AuthContext);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recentPRs, setRecentPRs] = useState<PR[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentGym?.id) return;

    try {
      // Fetch overview
      const overviewRes = await fetch(
        `${API_BASE_URL}/api/analytics/overview?gymId=${currentGym.id}`
      );
      const overviewData = await overviewRes.json();
      if (overviewData.success) setOverview(overviewData.data);

      // Fetch PRs
      const prsRes = await fetch(
        `${API_BASE_URL}/api/analytics/prs?gymId=${currentGym.id}&limit=5`
      );
      const prsData = await prsRes.json();
      if (prsData.success) setRecentPRs(prsData.data);

      // Fetch participation
      const partRes = await fetch(
        `${API_BASE_URL}/api/analytics/participation?gymId=${currentGym.id}&days=7`
      );
      const partData = await partRes.json();
      if (partData.success) setParticipation(partData.data);

      // Fetch top performers
      const perfRes = await fetch(
        `${API_BASE_URL}/api/analytics/top-performers?gymId=${currentGym.id}&limit=5`
      );
      const perfData = await perfRes.json();
      if (perfData.success) setTopPerformers(perfData.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentGym?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (!currentGym) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Please create or select a gym to view analytics.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Analytics
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {currentGym.name}
          </Text>
        </View>

        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Athletes"
            value={overview?.totalMembers || 0}
            icon="👥"
            color={brandColors.smartBlue.container}
          />
          <StatCard
            title="Today"
            value={overview?.resultsToday || 0}
            icon="📊"
            color={brandColors.thrivingGreen.container}
          />
          <StatCard
            title="PRs (7d)"
            value={overview?.prsThisWeek || 0}
            icon="🏆"
            color={brandColors.helpfulOrange.container}
          />
          <StatCard
            title="Workouts"
            value={overview?.resultsThisWeek || 0}
            icon="💪"
            color="#e0e7ff"
          />
        </View>

        {/* Participation */}
        {participation && (
          <Surface style={styles.card} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Weekly Participation
            </Text>
            <View style={styles.participationStats}>
              <View style={styles.participationStat}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {participation.participationRate}%
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Participation
                </Text>
              </View>
              <View style={styles.participationStat}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {participation.activeAthletes}/{participation.totalAthletes}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Active Athletes
                </Text>
              </View>
            </View>
            {/* Simple bar chart */}
            <View style={styles.chart}>
              {participation.participationByDay.map((day, i) => {
                const maxCount = Math.max(
                  ...participation.participationByDay.map((d) => d.count || 1)
                );
                const height = Math.max(8, (day.count / maxCount) * 80);
                return (
                  <View key={i} style={styles.chartBar}>
                    <View
                      style={[
                        styles.bar,
                        { height, backgroundColor: brandColors.smartBlue.DEFAULT },
                      ]}
                    />
                    <Text variant="labelSmall" style={styles.barLabel}>
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Surface>
        )}

        {/* Top Performers */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Top Performers (7 days)
          </Text>
          {topPerformers.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No activity this week
            </Text>
          ) : (
            topPerformers.map((performer, i) => (
              <View key={performer.userId} style={styles.performerRow}>
                <Text variant="titleMedium" style={styles.rankNumber}>
                  {i + 1}.
                </Text>
                {performer.profilePhotoUrl ? (
                  <Avatar.Image size={36} source={{ uri: performer.profilePhotoUrl }} />
                ) : (
                  <Avatar.Text
                    size={36}
                    label={performer.displayName.charAt(0).toUpperCase()}
                  />
                )}
                <View style={styles.performerInfo}>
                  <Text variant="bodyMedium" style={styles.performerName}>
                    {performer.displayName}
                  </Text>
                  <Text variant="bodySmall" style={styles.performerStats}>
                    {performer.workoutCount} workouts
                    {performer.prCount > 0 && ` • ${performer.prCount} PRs`}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Surface>

        {/* Recent PRs */}
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Recent PRs
          </Text>
          {recentPRs.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              No PRs recorded yet
            </Text>
          ) : (
            recentPRs.map((pr, i) => (
              <View key={pr.id}>
                <View style={styles.prRow}>
                  <View style={styles.prInfo}>
                    <Text variant="bodyMedium" style={styles.prName}>
                      {pr.displayName}
                    </Text>
                    <Text variant="bodySmall" style={styles.prMovement}>
                      {pr.custom_name || pr.category}
                    </Text>
                  </View>
                  <View style={styles.prValue}>
                    <Text variant="titleSmall" style={styles.prResult}>
                      {pr.displayValue}
                    </Text>
                    <Text variant="labelSmall" style={styles.prDate}>
                      {new Date(pr.achieved_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {i < recentPRs.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <Surface style={[styles.statCard, { backgroundColor: color }]} elevation={1}>
      <View style={styles.statCardContent}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text variant="headlineMedium" style={styles.statCardValue}>
          {value}
        </Text>
        <Text variant="labelSmall" style={styles.statCardTitle}>
          {title}
        </Text>
      </View>
    </Surface>
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 12,
  },
  statCardContent: {
    alignItems: "center",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statCardValue: {
    fontWeight: "bold",
  },
  statCardTitle: {
    opacity: 0.7,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  participationStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  participationStat: {
    alignItems: "center",
  },
  statValue: {
    fontWeight: "bold",
    color: brandColors.smartBlue.DEFAULT,
  },
  statLabel: {
    opacity: 0.6,
    marginTop: 2,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
  },
  bar: {
    width: "60%",
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 4,
    opacity: 0.6,
  },
  performerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  rankNumber: {
    fontWeight: "bold",
    width: 24,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontWeight: "500",
  },
  performerStats: {
    opacity: 0.6,
  },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontWeight: "500",
  },
  prMovement: {
    opacity: 0.6,
  },
  prValue: {
    alignItems: "flex-end",
  },
  prResult: {
    fontWeight: "bold",
    color: brandColors.thrivingGreen.DEFAULT,
  },
  prDate: {
    opacity: 0.5,
  },
  divider: {
    marginVertical: 4,
  },
  emptyText: {
    opacity: 0.6,
    textAlign: "center",
  },
});
