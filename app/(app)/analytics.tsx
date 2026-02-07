import { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Avatar,
  Divider,
  SegmentedButtons,
  ProgressBar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";
import { API_BASE } from "@/lib/api/getApiUrl";

// Types
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

type Program = {
  id: string;
  name: string;
  entityName: string;
  entityType: string;
  workoutCount: number;
};

type ProgramAnalytics = {
  programName: string;
  entityName: string;
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  totalPRs: number;
  participationByAthlete: {
    userId: string;
    displayName: string;
    profilePhotoUrl: string | null;
    completedCount: number;
    prCount: number;
  }[];
  prsInProgram: {
    id: string;
    displayName: string;
    movement: string;
    value: string;
    date: string;
  }[];
};

type Athlete = {
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  workoutsThisWeek: number;
  prsThisWeek: number;
};

type AthleteAnalytics = {
  profile: {
    displayName: string;
    photoUrl: string | null;
    joinedAt: string | null;
  };
  overallStats: {
    totalWorkouts: number;
    totalPRs: number;
    avgEffort: number | null;
    currentStreak: number;
  };
  workoutHistory: {
    id: string;
    date: string;
    title: string;
    result: string;
    isPR: boolean;
  }[];
  prHistory: {
    id: string;
    movement: string;
    value: string;
    date: string;
    improvement: number | null;
  }[];
  participationByWeek: {
    week: string;
    count: number;
  }[];
  programParticipation: {
    programId: string;
    programName: string;
    completedWorkouts: number;
    totalWorkouts: number;
  }[];
};

export default function AnalyticsScreen() {
  const { currentGym } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("gym");

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Analytics
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {currentGym.name}
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: "gym", label: "Gym" },
            { value: "program", label: "Program" },
            { value: "athlete", label: "Athlete" },
          ]}
          style={styles.tabs}
        />
      </View>

      {/* Tab Content */}
      {activeTab === "gym" && <GymOverviewTab gymId={currentGym.id} />}
      {activeTab === "program" && <ProgramAnalyticsTab gymId={currentGym.id} />}
      {activeTab === "athlete" && <AthleteAnalyticsTab gymId={currentGym.id} />}
    </SafeAreaView>
  );
}

// ============================================
// GYM OVERVIEW TAB
// ============================================
function GymOverviewTab({ gymId }: { gymId: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recentPRs, setRecentPRs] = useState<PR[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, prsRes, partRes, perfRes] = await Promise.all([
        fetch(`${API_BASE}/api/analytics/overview?gymId=${gymId}`),
        fetch(`${API_BASE}/api/analytics/prs?gymId=${gymId}&limit=5`),
        fetch(`${API_BASE}/api/analytics/participation?gymId=${gymId}&days=7`),
        fetch(`${API_BASE}/api/analytics/top-performers?gymId=${gymId}&limit=5`),
      ]);

      const [overviewData, prsData, partData, perfData] = await Promise.all([
        overviewRes.json(),
        prsRes.json(),
        partRes.json(),
        perfRes.json(),
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (prsData.success) setRecentPRs(prsData.data);
      if (partData.success) setParticipation(partData.data);
      if (perfData.success) setTopPerformers(perfData.data);
    } catch (err) {
      console.error("Error fetching gym analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gymId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Overview Stats */}
      <View style={styles.statsGrid}>
        <StatCard title="Athletes" value={overview?.totalMembers || 0} icon="👥" color={brandColors.smartBlue.container} />
        <StatCard title="Today" value={overview?.resultsToday || 0} icon="📊" color={brandColors.thrivingGreen.container} />
        <StatCard title="PRs (7d)" value={overview?.prsThisWeek || 0} icon="🏆" color={brandColors.helpfulOrange.container} />
        <StatCard title="Workouts" value={overview?.resultsThisWeek || 0} icon="💪" color="#e0e7ff" />
      </View>

      {/* Participation */}
      {participation && (
        <Surface style={styles.card} elevation={2}>
          <Text variant="titleMedium" style={styles.cardTitle}>Weekly Participation</Text>
          <View style={styles.participationStats}>
            <View style={styles.participationStat}>
              <Text variant="headlineMedium" style={styles.statValue}>{participation.participationRate}%</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Participation</Text>
            </View>
            <View style={styles.participationStat}>
              <Text variant="headlineMedium" style={styles.statValue}>{participation.activeAthletes}/{participation.totalAthletes}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Active Athletes</Text>
            </View>
          </View>
          <View style={styles.chart}>
            {participation.participationByDay.map((day, i) => {
              const maxCount = Math.max(...participation.participationByDay.map((d) => d.count || 1));
              const height = Math.max(8, (day.count / maxCount) * 80);
              return (
                <View key={i} style={styles.chartBar}>
                  <View style={[styles.bar, { height, backgroundColor: brandColors.smartBlue.DEFAULT }]} />
                  <Text variant="labelSmall" style={styles.barLabel}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </Surface>
      )}

      {/* Top Performers */}
      <Surface style={styles.card} elevation={2}>
        <Text variant="titleMedium" style={styles.cardTitle}>Top Performers (7 days)</Text>
        {topPerformers.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyText}>No activity this week</Text>
        ) : (
          topPerformers.map((performer, i) => (
            <View key={performer.userId} style={styles.performerRow}>
              <Text variant="titleMedium" style={styles.rankNumber}>{i + 1}.</Text>
              {performer.profilePhotoUrl ? (
                <Avatar.Image size={36} source={{ uri: performer.profilePhotoUrl }} />
              ) : (
                <Avatar.Text size={36} label={performer.displayName.charAt(0).toUpperCase()} />
              )}
              <View style={styles.performerInfo}>
                <Text variant="bodyMedium" style={styles.performerName}>{performer.displayName}</Text>
                <Text variant="bodySmall" style={styles.performerStats}>
                  {performer.workoutCount} workouts{performer.prCount > 0 && ` • ${performer.prCount} PRs`}
                </Text>
              </View>
            </View>
          ))
        )}
      </Surface>

      {/* Recent PRs */}
      <Surface style={styles.card} elevation={2}>
        <Text variant="titleMedium" style={styles.cardTitle}>Recent PRs</Text>
        {recentPRs.length === 0 ? (
          <Text variant="bodyMedium" style={styles.emptyText}>No PRs recorded yet</Text>
        ) : (
          recentPRs.map((pr, i) => (
            <View key={pr.id}>
              <View style={styles.prRow}>
                <View style={styles.prInfo}>
                  <Text variant="bodyMedium" style={styles.prName}>{pr.displayName}</Text>
                  <Text variant="bodySmall" style={styles.prMovement}>{pr.custom_name || pr.category}</Text>
                </View>
                <View style={styles.prValue}>
                  <Text variant="titleSmall" style={styles.prResult}>{pr.displayValue}</Text>
                  <Text variant="labelSmall" style={styles.prDate}>{new Date(pr.achieved_at).toLocaleDateString()}</Text>
                </View>
              </View>
              {i < recentPRs.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))
        )}
      </Surface>
    </ScrollView>
  );
}

// ============================================
// PROGRAM ANALYTICS TAB
// ============================================
function ProgramAnalyticsTab({ gymId }: { gymId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ProgramAnalytics | null>(null);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, [gymId]);

  useEffect(() => {
    if (selectedProgramId) {
      fetchAnalytics();
    }
  }, [selectedProgramId]);

  const fetchPrograms = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/programs?gymId=${gymId}`);
      const data = await res.json();
      if (data.success) {
        setPrograms(data.data);
        if (data.data.length > 0) {
          setSelectedProgramId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedProgramId) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/program?programId=${selectedProgramId}&gymId=${gymId}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error("Error fetching program analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (loadingPrograms) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium" style={styles.emptyText}>No Programs Yet</Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>Create a program to see analytics here.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Program Selector */}
      <Surface style={styles.card} elevation={2}>
        <Text variant="titleMedium" style={styles.cardTitle}>Select Program</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.programSelector}>
            {programs.map((program) => (
              <Surface
                key={program.id}
                style={[
                  styles.programChip,
                  selectedProgramId === program.id && styles.programChipSelected,
                ]}
                elevation={1}
                onTouchEnd={() => setSelectedProgramId(program.id)}
              >
                <Text
                  variant="labelMedium"
                  style={[
                    styles.programChipText,
                    selectedProgramId === program.id && styles.programChipTextSelected,
                  ]}
                >
                  {program.name}
                </Text>
              </Surface>
            ))}
          </View>
        </ScrollView>
      </Surface>

      {loadingAnalytics ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : analytics ? (
        <>
          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard title="Workouts" value={analytics.totalWorkouts} icon="📋" color={brandColors.smartBlue.container} />
            <StatCard title="Completed" value={analytics.completedWorkouts} icon="✅" color={brandColors.thrivingGreen.container} />
            <StatCard title="Rate" value={`${analytics.completionRate}%`} icon="📈" color="#e0e7ff" />
            <StatCard title="PRs" value={analytics.totalPRs} icon="🏆" color={brandColors.helpfulOrange.container} />
          </View>

          {/* Athlete Participation */}
          <Surface style={styles.card} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>Athlete Participation</Text>
            {analytics.participationByAthlete.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>No athletes have completed workouts yet</Text>
            ) : (
              analytics.participationByAthlete.slice(0, 5).map((athlete) => (
                <View key={athlete.userId} style={styles.performerRow}>
                  {athlete.profilePhotoUrl ? (
                    <Avatar.Image size={36} source={{ uri: athlete.profilePhotoUrl }} />
                  ) : (
                    <Avatar.Text size={36} label={athlete.displayName.charAt(0).toUpperCase()} />
                  )}
                  <View style={styles.performerInfo}>
                    <Text variant="bodyMedium" style={styles.performerName}>{athlete.displayName}</Text>
                    <Text variant="bodySmall" style={styles.performerStats}>
                      {athlete.completedCount}/{analytics.totalWorkouts} workouts
                      {athlete.prCount > 0 && ` • ${athlete.prCount} PRs`}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Surface>

          {/* PRs in Program */}
          {analytics.prsInProgram.length > 0 && (
            <Surface style={styles.card} elevation={2}>
              <Text variant="titleMedium" style={styles.cardTitle}>PRs in This Program</Text>
              {analytics.prsInProgram.slice(0, 5).map((pr, i) => (
                <View key={pr.id}>
                  <View style={styles.prRow}>
                    <View style={styles.prInfo}>
                      <Text variant="bodyMedium" style={styles.prName}>{pr.displayName}</Text>
                      <Text variant="bodySmall" style={styles.prMovement}>{pr.movement}</Text>
                    </View>
                    <View style={styles.prValue}>
                      <Text variant="titleSmall" style={styles.prResult}>{pr.value}</Text>
                      <Text variant="labelSmall" style={styles.prDate}>{new Date(pr.date).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  {i < analytics.prsInProgram.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </Surface>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

// ============================================
// ATHLETE ANALYTICS TAB
// ============================================
function AthleteAnalyticsTab({ gymId }: { gymId: string }) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AthleteAnalytics | null>(null);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    fetchAthletes();
  }, [gymId]);

  useEffect(() => {
    if (selectedAthleteId) {
      fetchAnalytics();
    }
  }, [selectedAthleteId]);

  const fetchAthletes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/overview?gymId=${gymId}`);
      // Use top-performers endpoint to get athletes list
      const perfRes = await fetch(`${API_BASE}/api/analytics/top-performers?gymId=${gymId}&limit=50`);
      const perfData = await perfRes.json();
      if (perfData.success) {
        const athleteList = perfData.data.map((p: Performer) => ({
          userId: p.userId,
          displayName: p.displayName,
          profilePhotoUrl: p.profilePhotoUrl,
          workoutsThisWeek: p.workoutCount,
          prsThisWeek: p.prCount,
        }));
        setAthletes(athleteList);
        if (athleteList.length > 0) {
          setSelectedAthleteId(athleteList[0].userId);
        }
      }
    } catch (err) {
      console.error("Error fetching athletes:", err);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedAthleteId) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/athlete?athleteId=${selectedAthleteId}&gymId=${gymId}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error("Error fetching athlete analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (loadingAthletes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (athletes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium" style={styles.emptyText}>No Athletes Yet</Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>Invite athletes to your gym to see their analytics.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Athlete Selector */}
      <Surface style={styles.card} elevation={2}>
        <Text variant="titleMedium" style={styles.cardTitle}>Select Athlete</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.programSelector}>
            {athletes.map((athlete) => (
              <Surface
                key={athlete.userId}
                style={[
                  styles.programChip,
                  selectedAthleteId === athlete.userId && styles.programChipSelected,
                ]}
                elevation={1}
                onTouchEnd={() => setSelectedAthleteId(athlete.userId)}
              >
                <Text
                  variant="labelMedium"
                  style={[
                    styles.programChipText,
                    selectedAthleteId === athlete.userId && styles.programChipTextSelected,
                  ]}
                >
                  {athlete.displayName}
                </Text>
              </Surface>
            ))}
          </View>
        </ScrollView>
      </Surface>

      {loadingAnalytics ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : analytics ? (
        <>
          {/* Profile Header */}
          <Surface style={styles.card} elevation={2}>
            <View style={styles.profileHeader}>
              {analytics.profile.photoUrl ? (
                <Avatar.Image size={64} source={{ uri: analytics.profile.photoUrl }} />
              ) : (
                <Avatar.Text size={64} label={analytics.profile.displayName.charAt(0).toUpperCase()} />
              )}
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.profileName}>{analytics.profile.displayName}</Text>
                {analytics.profile.joinedAt && (
                  <Text variant="bodySmall" style={styles.profileJoined}>
                    Member since {new Date(analytics.profile.joinedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          </Surface>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <StatCard title="Workouts" value={analytics.overallStats.totalWorkouts} icon="💪" color={brandColors.smartBlue.container} />
            <StatCard title="PRs" value={analytics.overallStats.totalPRs} icon="🏆" color={brandColors.helpfulOrange.container} />
            <StatCard title="Effort" value={analytics.overallStats.avgEffort ? `${analytics.overallStats.avgEffort}/10` : "-"} icon="📊" color="#e0e7ff" />
            <StatCard title="Streak" value={`${analytics.overallStats.currentStreak}d`} icon="🔥" color={brandColors.thrivingGreen.container} />
          </View>

          {/* Weekly Activity */}
          {analytics.participationByWeek.length > 0 && (
            <Surface style={styles.card} elevation={2}>
              <Text variant="titleMedium" style={styles.cardTitle}>Weekly Activity</Text>
              <View style={styles.chart}>
                {analytics.participationByWeek.map((week, i) => {
                  const maxCount = Math.max(...analytics.participationByWeek.map((w) => w.count || 1));
                  const height = Math.max(8, (week.count / maxCount) * 80);
                  return (
                    <View key={i} style={styles.chartBar}>
                      <View style={[styles.bar, { height, backgroundColor: brandColors.smartBlue.DEFAULT }]} />
                      <Text variant="labelSmall" style={styles.barLabel}>{week.count}</Text>
                    </View>
                  );
                })}
              </View>
            </Surface>
          )}

          {/* PR History */}
          {analytics.prHistory.length > 0 && (
            <Surface style={styles.card} elevation={2}>
              <Text variant="titleMedium" style={styles.cardTitle}>PR History</Text>
              {analytics.prHistory.slice(0, 5).map((pr, i) => (
                <View key={pr.id}>
                  <View style={styles.prRow}>
                    <View style={styles.prInfo}>
                      <Text variant="bodyMedium" style={styles.prName}>{pr.movement}</Text>
                      <Text variant="bodySmall" style={styles.prMovement}>{new Date(pr.date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.prValue}>
                      <Text variant="titleSmall" style={styles.prResult}>{pr.value}</Text>
                      {pr.improvement && (
                        <Text variant="labelSmall" style={styles.improvement}>+{pr.improvement.toFixed(1)}%</Text>
                      )}
                    </View>
                  </View>
                  {i < analytics.prHistory.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </Surface>
          )}

          {/* Program Participation */}
          {analytics.programParticipation.length > 0 && (
            <Surface style={styles.card} elevation={2}>
              <Text variant="titleMedium" style={styles.cardTitle}>Program Participation</Text>
              {analytics.programParticipation.map((program) => {
                const percentage = program.totalWorkouts > 0
                  ? program.completedWorkouts / program.totalWorkouts
                  : 0;
                return (
                  <View key={program.programId} style={styles.programProgress}>
                    <View style={styles.programProgressHeader}>
                      <Text variant="bodyMedium" style={styles.programProgressName}>{program.programName}</Text>
                      <Text variant="labelSmall" style={styles.programProgressCount}>
                        {program.completedWorkouts}/{program.totalWorkouts}
                      </Text>
                    </View>
                    <ProgressBar progress={percentage} color={brandColors.smartBlue.DEFAULT} style={styles.progressBar} />
                  </View>
                );
              })}
            </Surface>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================
function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
  return (
    <Surface style={[styles.statCard, { backgroundColor: color }]} elevation={1}>
      <View style={styles.statCardContent}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text variant="headlineMedium" style={styles.statCardValue}>{value}</Text>
        <Text variant="labelSmall" style={styles.statCardTitle}>{title}</Text>
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
    minHeight: 200,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tabs: {
    backgroundColor: "#fff",
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
  emptySubtext: {
    opacity: 0.5,
    textAlign: "center",
    marginTop: 8,
  },
  programSelector: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  programChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  programChipSelected: {
    backgroundColor: brandColors.smartBlue.DEFAULT,
  },
  programChipText: {
    color: "#333",
  },
  programChipTextSelected: {
    color: "#fff",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: "bold",
  },
  profileJoined: {
    opacity: 0.6,
    marginTop: 4,
  },
  improvement: {
    color: brandColors.thrivingGreen.DEFAULT,
  },
  programProgress: {
    marginBottom: 12,
  },
  programProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  programProgressName: {
    fontWeight: "500",
  },
  programProgressCount: {
    opacity: 0.6,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});
