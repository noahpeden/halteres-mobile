import { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Surface,
  Avatar,
  Button,
  Divider,
  List,
  Chip,
  SegmentedButtons,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Building2,
  LogOut,
  ChevronRight,
  Award,
  Dumbbell,
  Trophy,
} from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";

type Tab = "prs" | "metrics";

type PersonalRecord = {
  id: string;
  category: string;
  custom_name: string | null;
  result_type: string;
  time_seconds: number | null;
  weight_kg: number | null;
  reps: number | null;
  scale: string;
  achieved_at: string;
  displayValue: string;
};

type Stats = {
  totalWorkouts: number;
  memberSince: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    profile,
    currentGym,
    gymMemberships,
    athleteMetrics,
    signOut,
  } = useContext(AuthContext);

  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("prs");

  const displayName =
    profile?.display_name || profile?.full_name || user?.email || "Athlete";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch PRs
      const { data: prsData, error: prsError } = await supabase
        .from("personal_records")
        .select("*")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false });

      if (prsError) throw prsError;

      const formattedPrs = (prsData || []).map((pr) => ({
        ...pr,
        displayValue: formatPRValue(pr),
      }));
      setPrs(formattedPrs);

      // Fetch workout count
      const { count: totalWorkouts } = await supabase
        .from("workout_results")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("deleted_at", null);

      // Get first workout date
      const { data: firstWorkout } = await supabase
        .from("workout_results")
        .select("created_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const memberSince = firstWorkout
        ? new Date(firstWorkout.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : null;

      setStats({
        totalWorkouts: totalWorkouts || 0,
        memberSince,
      });
    } catch (err) {
      console.error("Error fetching profile data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const formatPRValue = (pr: any): string => {
    switch (pr.result_type) {
      case "time":
        if (!pr.time_seconds) return "-";
        const mins = Math.floor(pr.time_seconds / 60);
        const secs = pr.time_seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      case "weight":
        return `${pr.weight_kg || 0} kg`;
      case "reps":
        return `${pr.reps || 0} reps`;
      default:
        return pr.custom_name || pr.category;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Group PRs by category
  const prsByCategory = prs.reduce((acc: Record<string, PersonalRecord[]>, pr) => {
    const category = pr.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(pr);
    return acc;
  }, {});

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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Header */}
        <Surface style={styles.headerCard} elevation={2}>
          <View style={styles.headerContent}>
            {profile?.profile_photo_url ? (
              <Avatar.Image
                size={80}
                source={{ uri: profile.profile_photo_url }}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={initials}
                style={styles.avatar}
              />
            )}
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.name}>
                {displayName}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {user?.email}
              </Text>
              {currentGym && (
                <Chip
                  icon={() => <Building2 size={14} color={brandColors.smartBlue.DEFAULT} />}
                  style={styles.gymChip}
                  textStyle={styles.gymChipText}
                  compact
                >
                  {currentGym.name}
                </Chip>
              )}
            </View>
          </View>
        </Surface>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={1}>
            <Text variant="displaySmall" style={styles.statValue}>
              {stats?.totalWorkouts || 0}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              Workouts
            </Text>
          </Surface>
          <Surface style={[styles.statCard, styles.statCardMiddle]} elevation={1}>
            <Text variant="displaySmall" style={[styles.statValue, styles.prStatValue]}>
              {prs.length}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              PRs
            </Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text variant="titleMedium" style={[styles.statValue, styles.memberSinceValue]}>
              {stats?.memberSince || "-"}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              Member Since
            </Text>
          </Surface>
        </View>

        {/* Tabs */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as Tab)}
          buttons={[
            { value: "prs", label: "Personal Records" },
            { value: "metrics", label: "My Metrics" },
          ]}
          style={styles.tabs}
        />

        {/* PRs Tab */}
        {activeTab === "prs" && (
          <View style={styles.tabContent}>
            {prs.length === 0 ? (
              <Surface style={styles.emptyCard} elevation={1}>
                <Trophy size={48} color={brandColors.practicalGray.light} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No PRs recorded yet
                </Text>
                <Text variant="bodySmall" style={styles.emptyText}>
                  Log workouts to start tracking your personal records!
                </Text>
              </Surface>
            ) : (
              Object.entries(prsByCategory).map(([category, categoryPrs]) => (
                <View key={category} style={styles.prSection}>
                  <Text variant="titleMedium" style={styles.prCategoryTitle}>
                    {category}
                  </Text>
                  {categoryPrs.map((pr) => (
                    <Surface key={pr.id} style={styles.prCard} elevation={1}>
                      <View style={styles.prCardContent}>
                        <View style={styles.prInfo}>
                          <Text variant="bodyLarge" style={styles.prName}>
                            {pr.custom_name || pr.category}
                          </Text>
                          <Text variant="bodySmall" style={styles.prDate}>
                            {new Date(pr.achieved_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.prValue}>
                          <Text variant="titleLarge" style={styles.prValueText}>
                            {pr.displayValue}
                          </Text>
                          <Chip compact mode="flat" style={styles.prScaleChip}>
                            {pr.scale?.toUpperCase() || "RX"}
                          </Chip>
                        </View>
                      </View>
                    </Surface>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* Metrics Tab */}
        {activeTab === "metrics" && (
          <View style={styles.tabContent}>
            {/* Strength Metrics */}
            <Surface style={styles.metricsCard} elevation={1}>
              <View style={styles.metricsSectionHeader}>
                <Dumbbell size={18} color={brandColors.smartBlue.DEFAULT} />
                <Text variant="titleMedium" style={styles.metricsTitle}>
                  Strength Metrics
                </Text>
              </View>
              <View style={styles.metricsGrid}>
                <MetricItem label="Back Squat 1RM" value={athleteMetrics?.squat_1rm} unit="kg" />
                <MetricItem label="Deadlift 1RM" value={athleteMetrics?.deadlift_1rm} unit="kg" />
                <MetricItem label="Bench Press 1RM" value={athleteMetrics?.bench_1rm} unit="kg" />
                <MetricItem label="Mile Time" value={athleteMetrics?.mile_time} />
              </View>
            </Surface>

            {/* Body Metrics */}
            <Surface style={styles.metricsCard} elevation={1}>
              <Text variant="titleMedium" style={styles.metricsTitle}>
                Body Metrics
              </Text>
              <View style={styles.metricsGrid}>
                <MetricItem label="Weight" value={athleteMetrics?.weight_kg} unit="kg" />
                <MetricItem label="Height" value={athleteMetrics?.height_cm} unit="cm" />
              </View>
            </Surface>

            <Text variant="bodySmall" style={styles.metricsNote}>
              Contact your coach to update your metrics
            </Text>
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <List.Item
            title="Edit Profile"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={() => <ChevronRight size={20} color="#666" />}
            onPress={() => {}}
            style={styles.listItem}
          />
          {gymMemberships.length > 1 && (
            <List.Item
              title="Switch Gym"
              description={`${gymMemberships.length} gyms available`}
              left={(props) => <List.Icon {...props} icon="swap-horizontal" />}
              right={() => <ChevronRight size={20} color="#666" />}
              onPress={() => router.push("/(auth)/join-gym")}
              style={styles.listItem}
            />
          )}
        </View>

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor="#d32f2f"
          icon={() => <LogOut size={18} color="#d32f2f" />}
        >
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricItem({ label, value, unit }: { label: string; value: any; unit?: string }) {
  return (
    <View style={styles.metricItem}>
      <Text variant="bodySmall" style={styles.metricLabel}>
        {label}
      </Text>
      <Text variant="titleMedium" style={styles.metricValue}>
        {value ? `${value}${unit ? ` ${unit}` : ""}` : "-"}
      </Text>
    </View>
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
    paddingBottom: 32,
  },
  headerCard: {
    borderRadius: 16,
    backgroundColor: brandColors.smartBlue.DEFAULT,
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    backgroundColor: "#fff",
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    color: "#fff",
  },
  email: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  gymChip: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
  },
  gymChipText: {
    color: "#fff",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  statCardMiddle: {
    marginHorizontal: 8,
  },
  statValue: {
    fontWeight: "bold",
    color: brandColors.smartBlue.DEFAULT,
  },
  prStatValue: {
    color: brandColors.helpfulOrange.DEFAULT,
  },
  memberSinceValue: {
    color: brandColors.thrivingGreen.DEFAULT,
  },
  statLabel: {
    opacity: 0.6,
    marginTop: 4,
  },
  tabs: {
    marginBottom: 16,
  },
  tabContent: {
    marginBottom: 16,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  emptyTitle: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    opacity: 0.6,
    textAlign: "center",
  },
  prSection: {
    marginBottom: 16,
  },
  prCategoryTitle: {
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  prCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  prCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  prInfo: {
    flex: 1,
  },
  prName: {
    fontWeight: "500",
  },
  prDate: {
    opacity: 0.6,
    marginTop: 2,
  },
  prValue: {
    alignItems: "flex-end",
  },
  prValueText: {
    fontWeight: "bold",
  },
  prScaleChip: {
    height: 22,
    marginTop: 4,
    backgroundColor: "#f0f0f0",
  },
  metricsCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  metricsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  metricsTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricItem: {
    width: "50%",
    paddingVertical: 8,
  },
  metricLabel: {
    opacity: 0.6,
  },
  metricValue: {
    fontWeight: "bold",
    marginTop: 2,
  },
  metricsNote: {
    textAlign: "center",
    opacity: 0.6,
  },
  divider: {
    marginVertical: 16,
  },
  settingsSection: {
    marginBottom: 8,
  },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 4,
  },
  signOutButton: {
    marginTop: 16,
    borderColor: "#d32f2f",
  },
});
