import { useState, useCallback } from "react";
import { router } from "expo-router";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Chip,
  Divider,
  List,
  Surface,
  Text,
  TextInput,
  Portal,
  IconButton,
} from "react-native-paper";
import {
  Building2,
  ChevronRight,
  CreditCard,
  Edit3,
  LogOut,
  Shield,
  Sparkles,
  Trash2,
  User,
  X,
  AlertTriangle,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { brandColors } from "@/app/_layout";
import { apiClient } from "@/lib/api/client";

export default function ProfileScreen() {
  const {
    user,
    profile,
    currentGym,
    gymMemberships,
    signOut,
    refetchProfile,
    isGymOwner,
  } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [dangerModalVisible, setDangerModalVisible] = useState(false);
  const [dangerAction, setDangerAction] = useState<"deactivate" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    display_name: profile?.display_name || profile?.full_name || "",
  });

  const displayName = profile?.display_name || profile?.full_name || user?.email || "Coach";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Subscription status
  const subscriptionStatus = profile?.subscription_status || "trialing";
  const isTrialing = subscriptionStatus === "trialing";
  const isPremium = subscriptionStatus === "active";
  const trialEndDate = profile?.trial_end_date
    ? new Date(profile.trial_end_date)
    : null;
  const daysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const generationsRemaining = profile?.generations_remaining ?? 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchProfile();
    setRefreshing(false);
  }, [refetchProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await apiClient.post("/api/cancel-subscription");
              await refetchProfile();
              Alert.alert("Success", "Your subscription has been cancelled.");
            } catch (error) {
              Alert.alert("Error", "Failed to cancel subscription. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDangerAction = async () => {
    if (!dangerAction) return;

    setLoading(true);
    try {
      if (dangerAction === "deactivate") {
        await apiClient.post("/api/deactivate-account");
        Alert.alert("Account Deactivated", "Your account has been deactivated.");
        await signOut();
        router.replace("/(auth)/login");
      } else if (dangerAction === "delete") {
        await apiClient.post("/api/delete-account");
        Alert.alert("Account Deleted", "Your account has been permanently deleted.");
        await signOut();
        router.replace("/(auth)/login");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to ${dangerAction} account. Please try again.`);
    } finally {
      setLoading(false);
      setDangerModalVisible(false);
      setDangerAction(null);
    }
  };

  const openDangerModal = (action: "deactivate" | "delete") => {
    setDangerAction(action);
    setDangerModalVisible(true);
  };

  const getSubscriptionBadge = () => {
    if (isPremium) {
      return { label: "Premium", color: brandColors.thrivingGreen.DEFAULT, bg: brandColors.thrivingGreen.container };
    }
    if (isTrialing) {
      return { label: "Trial", color: brandColors.helpfulOrange.DEFAULT, bg: brandColors.helpfulOrange.container };
    }
    return { label: "Free", color: brandColors.practicalGray.DEFAULT, bg: brandColors.practicalGray.container };
  };

  const badge = getSubscriptionBadge();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Profile
          </Text>
        </View>

        {/* Account Overview Card */}
        <Surface style={styles.profileCard} elevation={2}>
          <View style={styles.profileHeader}>
            {profile?.profile_photo_url ? (
              <Avatar.Image size={72} source={{ uri: profile.profile_photo_url }} />
            ) : (
              <Avatar.Text size={72} label={initials} style={styles.avatar} />
            )}
            <View style={styles.profileInfo}>
              <Text variant="titleLarge" style={styles.profileName}>
                {displayName}
              </Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {user?.email}
              </Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: badge.bg }]}
                textStyle={{ color: badge.color, fontSize: 12 }}
                compact
              >
                {badge.label}
              </Chip>
            </View>
            <IconButton
              icon={() => <Edit3 size={20} color={brandColors.smartBlue.DEFAULT} />}
              onPress={() => {
                setEditData({ display_name: displayName });
                setEditModalVisible(true);
              }}
            />
          </View>

          {currentGym && (
            <View style={styles.gymInfo}>
              <Building2 size={16} color={brandColors.practicalGray.medium} />
              <Text variant="bodyMedium" style={styles.gymName}>
                {currentGym.name}
              </Text>
              {isGymOwner && (
                <Chip compact style={styles.ownerChip}>
                  Owner
                </Chip>
              )}
            </View>
          )}
        </Surface>

        {/* Trial/Generation Stats (for trialing users) */}
        {isTrialing && (
          <Surface style={styles.statsCard} elevation={1}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="displaySmall" style={[styles.statValue, { color: brandColors.helpfulOrange.DEFAULT }]}>
                  {daysRemaining}
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>
                  Trial Days Left
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="displaySmall" style={[styles.statValue, { color: brandColors.smartBlue.DEFAULT }]}>
                  {generationsRemaining}
                </Text>
                <Text variant="labelSmall" style={styles.statLabel}>
                  AI Generations Left
                </Text>
              </View>
            </View>
            <Button
              mode="contained"
              icon={() => <Sparkles size={18} color="#fff" />}
              onPress={() => {/* Navigate to upgrade */}}
              style={styles.upgradeButton}
            >
              Upgrade to Premium
            </Button>
          </Surface>
        )}

        {/* Subscription Management (for premium users) */}
        {isPremium && (
          <Surface style={styles.subscriptionCard} elevation={1}>
            <View style={styles.subscriptionHeader}>
              <CreditCard size={20} color={brandColors.thrivingGreen.DEFAULT} />
              <Text variant="titleMedium" style={styles.subscriptionTitle}>
                Subscription
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.subscriptionText}>
              You have unlimited access to all premium features.
            </Text>
            <Button
              mode="outlined"
              onPress={handleCancelSubscription}
              loading={loading}
              disabled={loading}
              style={styles.cancelButton}
              textColor={brandColors.practicalGray.medium}
            >
              Cancel Subscription
            </Button>
          </Surface>
        )}

        {/* Settings List */}
        <Surface style={styles.settingsCard} elevation={1}>
          <List.Item
            title="Edit Profile"
            description="Update your name and photo"
            left={(props) => (
              <List.Icon {...props} icon={() => <User size={20} color={brandColors.smartBlue.DEFAULT} />} />
            )}
            right={() => <ChevronRight size={20} color={brandColors.practicalGray.light} />}
            onPress={() => {
              setEditData({ display_name: displayName });
              setEditModalVisible(true);
            }}
            style={styles.listItem}
          />
          <Divider />
          {gymMemberships.length > 1 && (
            <>
              <List.Item
                title="Switch Gym"
                description={`${gymMemberships.length} gyms available`}
                left={(props) => (
                  <List.Icon {...props} icon={() => <Building2 size={20} color={brandColors.smartBlue.DEFAULT} />} />
                )}
                right={() => <ChevronRight size={20} color={brandColors.practicalGray.light} />}
                onPress={() => router.push("/(auth)/join-gym")}
                style={styles.listItem}
              />
              <Divider />
            </>
          )}
          <List.Item
            title="Security"
            description="Change password"
            left={(props) => (
              <List.Icon {...props} icon={() => <Shield size={20} color={brandColors.smartBlue.DEFAULT} />} />
            )}
            right={() => <ChevronRight size={20} color={brandColors.practicalGray.light} />}
            onPress={() => router.push("/(app)/change-password")}
            style={styles.listItem}
          />
        </Surface>

        {/* Danger Zone */}
        <Surface style={styles.dangerCard} elevation={1}>
          <Text variant="titleMedium" style={styles.dangerTitle}>
            Danger Zone
          </Text>
          <Text variant="bodySmall" style={styles.dangerDescription}>
            These actions are irreversible. Please proceed with caution.
          </Text>
          <View style={styles.dangerButtons}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => openDangerModal("deactivate")}
            >
              <AlertTriangle size={16} color={brandColors.helpfulOrange.DEFAULT} />
              <Text style={[styles.dangerButtonText, { color: brandColors.helpfulOrange.DEFAULT }]}>
                Deactivate Account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => openDangerModal("delete")}
            >
              <Trash2 size={16} color="#d32f2f" />
              <Text style={[styles.dangerButtonText, { color: "#d32f2f" }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Sign Out Button */}
        <Button
          mode="outlined"
          icon={() => <LogOut size={18} color="#d32f2f" />}
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor="#d32f2f"
        >
          Sign Out
        </Button>
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
            <View style={styles.modalContent}>
              <TextInput
                label="Display Name"
                value={editData.display_name}
                onChangeText={(text) => setEditData({ ...editData, display_name: text })}
                mode="outlined"
                style={styles.modalInput}
              />
              <TextInput
                label="Email"
                value={user?.email || ""}
                mode="outlined"
                disabled
                style={styles.modalInput}
              />
            </View>
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
                onPress={() => {
                  // TODO: Implement profile update
                  setEditModalVisible(false);
                }}
                style={styles.modalSaveButton}
              >
                Save Changes
              </Button>
            </View>
          </SafeAreaView>
        </Modal>
      </Portal>

      {/* Danger Confirmation Modal */}
      <Portal>
        <Modal
          visible={dangerModalVisible}
          onDismiss={() => {
            setDangerModalVisible(false);
            setDangerAction(null);
          }}
          animationType="fade"
          transparent
        >
          <View style={styles.dangerModalOverlay}>
            <Surface style={styles.dangerModalContent} elevation={5}>
              <AlertTriangle
                size={48}
                color={dangerAction === "delete" ? "#d32f2f" : brandColors.helpfulOrange.DEFAULT}
              />
              <Text variant="titleLarge" style={styles.dangerModalTitle}>
                {dangerAction === "delete" ? "Delete Account?" : "Deactivate Account?"}
              </Text>
              <Text variant="bodyMedium" style={styles.dangerModalText}>
                {dangerAction === "delete"
                  ? "This action is permanent and cannot be undone. All your data, programs, and client information will be deleted forever."
                  : "Your account will be deactivated. You can reactivate it later by signing in again."}
              </Text>
              <View style={styles.dangerModalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setDangerModalVisible(false);
                    setDangerAction(null);
                  }}
                  style={styles.dangerModalCancelButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleDangerAction}
                  loading={loading}
                  disabled={loading}
                  buttonColor={dangerAction === "delete" ? "#d32f2f" : brandColors.helpfulOrange.DEFAULT}
                  style={styles.dangerModalConfirmButton}
                >
                  {dangerAction === "delete" ? "Delete" : "Deactivate"}
                </Button>
              </View>
            </Surface>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: "700",
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: brandColors.smartBlue.DEFAULT,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontWeight: "700",
  },
  profileEmail: {
    color: brandColors.practicalGray.medium,
    marginTop: 2,
  },
  statusChip: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  gymInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 8,
  },
  gymName: {
    flex: 1,
    color: brandColors.practicalGray.medium,
  },
  ownerChip: {
    backgroundColor: brandColors.smartBlue.container,
  },
  statsCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontWeight: "800",
  },
  statLabel: {
    color: brandColors.practicalGray.medium,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#f0f0f0",
  },
  upgradeButton: {
    borderRadius: 12,
  },
  subscriptionCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontWeight: "600",
  },
  subscriptionText: {
    color: brandColors.practicalGray.medium,
    marginBottom: 16,
  },
  cancelButton: {
    borderColor: brandColors.practicalGray.light,
  },
  settingsCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
    overflow: "hidden",
  },
  listItem: {
    paddingVertical: 4,
  },
  dangerCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  dangerTitle: {
    fontWeight: "600",
    color: "#991b1b",
    marginBottom: 4,
  },
  dangerDescription: {
    color: brandColors.practicalGray.medium,
    marginBottom: 16,
  },
  dangerButtons: {
    gap: 12,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  dangerButtonText: {
    fontWeight: "500",
  },
  signOutButton: {
    borderColor: "#d32f2f",
    marginTop: 8,
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
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalInput: {
    marginBottom: 16,
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
  // Danger Modal styles
  dangerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dangerModalContent: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
  },
  dangerModalTitle: {
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  dangerModalText: {
    textAlign: "center",
    color: brandColors.practicalGray.medium,
    marginBottom: 24,
  },
  dangerModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  dangerModalCancelButton: {
    flex: 1,
  },
  dangerModalConfirmButton: {
    flex: 1,
  },
});
