import { useRouter } from "expo-router";
import {
  ChevronRight,
  Dumbbell,
  Edit3,
  LogOut,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "@/components/providers/AuthProvider";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";
import { apiClient } from "@/lib/api/client";
import { supabase } from "@/lib/supabase/client";
import { palette, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/theme";

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
  const { user, profile, athleteMetrics, signOut, refetchProfile } =
    useContext(AuthContext);

  const { updateProfile, loading: savingProfile } = useAthleteProfile();

  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("prs");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    display_name: "",
    squat_1rm: "",
    deadlift_1rm: "",
    bench_1rm: "",
    mile_time: "",
    weight_kg: "",
    height_cm: "",
  });

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

  // Populate edit data when profile changes
  useEffect(() => {
    if (profile || athleteMetrics) {
      setEditData({
        display_name: profile?.display_name || profile?.full_name || "",
        squat_1rm: athleteMetrics?.squat_1rm?.toString() || "",
        deadlift_1rm: athleteMetrics?.deadlift_1rm?.toString() || "",
        bench_1rm: athleteMetrics?.bench_1rm?.toString() || "",
        mile_time: athleteMetrics?.mile_time || "",
        weight_kg: athleteMetrics?.weight_kg?.toString() || "",
        height_cm: athleteMetrics?.height_cm?.toString() || "",
      });
    }
  }, [profile, athleteMetrics]);

  const formatPRValue = (pr: any): string => {
    switch (pr.result_type) {
      case "time": {
        if (!pr.time_seconds) return "-";
        const mins = Math.floor(pr.time_seconds / 60);
        const secs = pr.time_seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      }
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

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const canDelete = deleteConfirmText.trim().toUpperCase() === "DELETE";

  const openDeleteModal = () => {
    setDeleteConfirmText("");
    setDeleteError(null);
    setDeleteModalVisible(true);
  };

  const handleDeleteAccount = async () => {
    if (!canDelete || deleteSubmitting) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      // Try primary delete endpoint
      try {
        await apiClient.post("/api/delete-account");
      } catch (primaryErr) {
        // Try fallback deactivate endpoint
        try {
          await apiClient.post("/api/deactivate-account");
        } catch (fallbackErr) {
          // Try HTTP DELETE as a last resort
          try {
            await apiClient.delete("/api/delete-account");
          } catch (finalErr) {
            throw primaryErr;
          }
        }
      }

      setDeleteModalVisible(false);
      Alert.alert("Account Deleted", "Your account has been deleted.", [
        {
          text: "OK",
          onPress: async () => {
            try {
              await signOut();
            } finally {
              router.replace("/(auth)/login");
            }
          },
        },
      ]);
    } catch (e: any) {
      const message =
        (e && e.message) ||
        "We couldn't delete your account. Please try again.";
      setDeleteError(message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    const result = await updateProfile(editData);
    if (result.success) {
      setEditModalVisible(false);
    }
  };

  // Group PRs by category
  const prsByCategory = prs.reduce(
    (acc: Record<string, PersonalRecord[]>, pr) => {
      const category = pr.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(pr);
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.blue} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.blue}
          />
        }
      >
        <AppText variant="eyebrow">You</AppText>
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            {profile?.profile_photo_url ? (
              <Avatar.Image
                size={80}
                source={{ uri: profile.profile_photo_url }}
              />
            ) : (
              <Avatar.Text size={80} label={initials} style={styles.avatar} />
            )}
            <View style={styles.headerText}>
              <AppText variant="headline">{displayName}</AppText>
              <AppText variant="body">{user?.email}</AppText>
            </View>
          </View>
        </View>

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
          <Surface
            style={[styles.statCard, styles.statCardMiddle]}
            elevation={1}
          >
            <Text
              variant="displaySmall"
              style={[styles.statValue, styles.prStatValue]}
            >
              {prs.length}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              PRs
            </Text>
          </Surface>
          <Surface style={styles.statCard} elevation={1}>
            <Text
              variant="titleMedium"
              style={[styles.statValue, styles.memberSinceValue]}
            >
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
                <Trophy size={48} color={palette.inkFaint} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No marks in the book yet
                </Text>
                <Text variant="bodySmall" style={styles.emptyText}>
                  Log a result and we'll keep the best.
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
                <View style={styles.metricsTitleRow}>
                  <Dumbbell size={18} color={palette.blue} />
                  <Text variant="titleMedium" style={styles.metricsTitle}>
                    Strength Metrics
                  </Text>
                </View>
                <IconButton
                  icon={() => <Edit3 size={18} color={palette.blue} />}
                  onPress={handleEditProfile}
                  size={20}
                />
              </View>
              <View style={styles.metricsGrid}>
                <MetricItem
                  label="Back Squat 1RM"
                  value={athleteMetrics?.squat_1rm}
                  unit="kg"
                />
                <MetricItem
                  label="Deadlift 1RM"
                  value={athleteMetrics?.deadlift_1rm}
                  unit="kg"
                />
                <MetricItem
                  label="Bench Press 1RM"
                  value={athleteMetrics?.bench_1rm}
                  unit="kg"
                />
                <MetricItem
                  label="Mile Time"
                  value={athleteMetrics?.mile_time}
                />
              </View>
            </Surface>

            {/* Body Metrics */}
            <Surface style={styles.metricsCard} elevation={1}>
              <View style={styles.metricsTitleRow}>
                <Text variant="titleMedium" style={styles.metricsTitle}>
                  Body Metrics
                </Text>
              </View>
              <View style={styles.metricsGrid}>
                <MetricItem
                  label="Weight"
                  value={athleteMetrics?.weight_kg}
                  unit="kg"
                />
                <MetricItem
                  label="Height"
                  value={athleteMetrics?.height_cm}
                  unit="cm"
                />
              </View>
            </Surface>

            <Button
              mode="outlined"
              icon={() => <Edit3 size={16} color={palette.blue} />}
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              Edit My Metrics
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        {/* AI Insights Quick Link */}
        <Surface style={styles.insightsCard} elevation={1}>
          <List.Item
            title="Notes from the writer"
            description="How the last sessions actually felt"
            left={() => (
              <View style={styles.insightsIcon}>
                <Sparkles size={24} color={palette.orange} />
              </View>
            )}
            right={() => <ChevronRight size={20} color="#666" />}
            onPress={() => router.push("/(athlete)/feedback")}
            style={styles.insightsListItem}
          />
        </Surface>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <List.Item
            title="Edit Profile"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={() => <ChevronRight size={20} color="#666" />}
            onPress={handleEditProfile}
            style={styles.listItem}
          />
          {/* Switch Gym removed - gym membership UI not available in B2C */}
        </View>

        {/* Danger Zone - Delete Account */}
        <Surface style={styles.dangerCard} elevation={1}>
          <Text variant="titleMedium" style={styles.dangerTitle}>
            Delete Account
          </Text>
          <Text variant="bodySmall" style={styles.dangerText}>
            Permanently delete your account and data. This action cannot be
            undone.
          </Text>
          <Button
            mode="contained"
            onPress={openDeleteModal}
            style={styles.deleteButton}
            buttonColor="#d32f2f"
            textColor="#fff"
            icon={() => <Trash2 size={18} color="#fff" />}
          >
            Delete Account
          </Button>
        </Surface>

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor={palette.error}
          icon={() => <LogOut size={18} color={palette.error} />}
        >
          Sign out
        </Button>

        <AppText
          variant="bodySmall"
          style={styles.contact}
          onPress={() => Linking.openURL(SUPPORT_MAILTO)}
        >
          Questions? {SUPPORT_EMAIL}
        </AppText>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Edit Profile
              </Text>
              <IconButton
                icon={() => <X size={24} color="#666" />}
                onPress={() => setEditModalVisible(false)}
              />
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                label="Display Name"
                value={editData.display_name}
                onChangeText={(text) =>
                  setEditData({ ...editData, display_name: text })
                }
                mode="outlined"
                style={styles.modalInput}
              />

              <Text variant="titleSmall" style={styles.modalSectionTitle}>
                Strength Metrics
              </Text>

              <View style={styles.modalInputRow}>
                <TextInput
                  label="Squat 1RM (kg)"
                  value={editData.squat_1rm}
                  onChangeText={(text) =>
                    setEditData({ ...editData, squat_1rm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.modalInputHalf}
                />
                <TextInput
                  label="Deadlift 1RM (kg)"
                  value={editData.deadlift_1rm}
                  onChangeText={(text) =>
                    setEditData({ ...editData, deadlift_1rm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.modalInputHalf}
                />
              </View>

              <View style={styles.modalInputRow}>
                <TextInput
                  label="Bench 1RM (kg)"
                  value={editData.bench_1rm}
                  onChangeText={(text) =>
                    setEditData({ ...editData, bench_1rm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.modalInputHalf}
                />
                <TextInput
                  label="Mile Time"
                  value={editData.mile_time}
                  onChangeText={(text) =>
                    setEditData({ ...editData, mile_time: text })
                  }
                  mode="outlined"
                  placeholder="e.g. 7:30"
                  style={styles.modalInputHalf}
                />
              </View>

              <Text variant="titleSmall" style={styles.modalSectionTitle}>
                Body Metrics
              </Text>

              <View style={styles.modalInputRow}>
                <TextInput
                  label="Weight (kg)"
                  value={editData.weight_kg}
                  onChangeText={(text) =>
                    setEditData({ ...editData, weight_kg: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.modalInputHalf}
                />
                <TextInput
                  label="Height (cm)"
                  value={editData.height_cm}
                  onChangeText={(text) =>
                    setEditData({ ...editData, height_cm: text })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.modalInputHalf}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                loading={savingProfile}
                disabled={savingProfile}
                style={styles.modalSaveButton}
              >
                Save Changes
              </Button>
            </View>
          </SafeAreaView>
        </Modal>
        {/* Delete Account Modal */}
        <Modal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Delete Account
              </Text>
              <IconButton
                icon={() => <X size={24} color="#666" />}
                onPress={() => setDeleteModalVisible(false)}
              />
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.dangerBody}>
                This will permanently delete your account and associated data.
                This action cannot be undone.
              </Text>
              <Text style={styles.confirmLabel}>Type DELETE to confirm:</Text>
              <TextInput
                mode="outlined"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                autoCapitalize="characters"
                style={styles.deleteInput}
              />
              {!!deleteError && (
                <Text style={styles.deleteError}>{deleteError}</Text>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                mode="outlined"
                onPress={() => setDeleteModalVisible(false)}
                style={styles.modalCancelButton}
                disabled={deleteSubmitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleDeleteAccount}
                disabled={!canDelete || deleteSubmitting}
                loading={deleteSubmitting}
                buttonColor="#d32f2f"
                textColor="#fff"
                style={styles.modalSaveButton}
              >
                Delete
              </Button>
            </View>
          </SafeAreaView>
        </Modal>
      </Portal>
    </Screen>
  );
}

function MetricItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: any;
  unit?: string;
}) {
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
    backgroundColor: palette.paper,
  },
  contact: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 120,
  },
  headerCard: {
    borderRadius: 22,
    backgroundColor: palette.paperElevated,
    marginBottom: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(26, 35, 50, 0.05)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    backgroundColor: palette.blueWash,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    color: palette.ink,
  },
  email: {
    color: palette.inkSoft,
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
    color: palette.blue,
  },
  prStatValue: {
    color: palette.orange,
  },
  memberSinceValue: {
    color: palette.green,
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
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricsTitle: {
    fontWeight: "600",
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
  editButton: {
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  insightsCard: {
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
    overflow: "hidden",
  },
  insightsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.orangeWash,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  insightsListItem: {
    paddingVertical: 8,
  },
  settingsSection: {
    marginBottom: 8,
  },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 4,
  },
  dangerCard: {
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#fde0e0",
  },
  dangerTitle: {
    fontWeight: "600",
    color: "#b71c1c",
    marginBottom: 6,
  },
  dangerText: {
    color: "#6b6b6b",
    marginBottom: 12,
  },
  deleteButton: {
    alignSelf: "flex-start",
  },
  signOutButton: {
    marginTop: 16,
    borderColor: "#d32f2f",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
    opacity: 0.8,
  },
  modalInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  modalInputHalf: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSaveButton: {
    flex: 2,
  },
  dangerBody: {
    color: "#444",
    marginBottom: 12,
  },
  confirmLabel: {
    fontWeight: "600",
    marginBottom: 8,
  },
  deleteInput: {
    marginBottom: 12,
  },
  deleteError: {
    color: "#b71c1c",
    marginTop: 4,
  },
});
