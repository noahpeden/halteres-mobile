import { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
} from "react-native";
import {
  Text,
  Surface,
  Button,
  TextInput,
  Chip,
  Avatar,
  Divider,
  ActivityIndicator,
  SegmentedButtons,
  Switch,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { AuthContext } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { brandColors } from "@/app/_layout";

type Member = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    full_name: string | null;
    profile_photo_url: string | null;
  } | null;
};

export default function GymManagementScreen() {
  const { currentGym, fetchGymMemberships, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState("invite");
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    require_approval: true,
  });

  useEffect(() => {
    if (currentGym) {
      setFormData({
        name: currentGym.name || "",
        description: currentGym.description || "",
        require_approval: currentGym.require_approval ?? true,
      });
      fetchMembers();
      fetchPendingMembers();
    }
  }, [currentGym]);

  const fetchMembers = async () => {
    if (!currentGym?.id) return;

    const { data, error } = await supabase
      .from("gym_memberships")
      .select(`
        id, user_id, role, status, joined_at, created_at,
        user:profiles (id, display_name, full_name, profile_photo_url)
      `)
      .eq("gym_id", currentGym.id)
      .eq("status", "active");

    if (!error && data) {
      setMembers(data as Member[]);
    }
  };

  const fetchPendingMembers = async () => {
    if (!currentGym?.id) return;

    const { data, error } = await supabase
      .from("gym_memberships")
      .select(`
        id, user_id, role, status, joined_at, created_at,
        user:profiles (id, display_name, full_name, profile_photo_url)
      `)
      .eq("gym_id", currentGym.id)
      .eq("status", "pending");

    if (!error && data) {
      setPendingMembers(data as Member[]);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchMembers(), fetchPendingMembers()]).finally(() => {
      setRefreshing(false);
    });
  }, [currentGym?.id]);

  const handleCreateGym = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a gym name");
      return;
    }

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();

      const { data, error } = await supabase
        .from("gyms")
        .insert([
          {
            owner_id: user?.id,
            name: formData.name,
            description: formData.description,
            invite_code: inviteCode,
            require_approval: formData.require_approval,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create owner membership
      await supabase.from("gym_memberships").insert([
        {
          gym_id: data.id,
          user_id: user?.id,
          role: "owner",
          status: "active",
          joined_at: new Date().toISOString(),
        },
      ]);

      await fetchGymMemberships?.();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGym = async () => {
    if (!currentGym?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("gyms")
        .update({
          name: formData.name,
          description: formData.description,
          require_approval: formData.require_approval,
        })
        .eq("id", currentGym.id);

      if (error) throw error;
      await fetchGymMemberships?.();
      Alert.alert("Success", "Gym settings updated");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      "Regenerate Code",
      "The old invite code will no longer work. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          onPress: async () => {
            setLoading(true);
            try {
              const newCode = generateInviteCode();
              const { error } = await supabase
                .from("gyms")
                .update({ invite_code: newCode })
                .eq("id", currentGym?.id);

              if (error) throw error;
              await fetchGymMemberships?.();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCopyInviteLink = async () => {
    const link = `https://halteres.ai/join/${currentGym?.invite_code}`;
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    const link = `https://halteres.ai/join/${currentGym?.invite_code}`;
    try {
      await Share.share({
        message: `Join ${currentGym?.name} on Halteres! Use this link: ${link} or enter code: ${currentGym?.invite_code}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveMember = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from("gym_memberships")
        .update({ status: "active", joined_at: new Date().toISOString() })
        .eq("id", membershipId);

      if (error) throw error;
      fetchMembers();
      fetchPendingMembers();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleRejectMember = (membershipId: string) => {
    Alert.alert("Reject Request", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("gym_memberships")
              .delete()
              .eq("id", membershipId);

            if (error) throw error;
            fetchPendingMembers();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  // No gym - show creation form
  if (!currentGym) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Create Your Gym
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Set up your gym to invite athletes
            </Text>
          </View>

          <Surface style={styles.formCard} elevation={2}>
            <TextInput
              label="Gym Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text variant="bodyMedium">Require approval for new members</Text>
              <Switch
                value={formData.require_approval}
                onValueChange={(value) =>
                  setFormData({ ...formData, require_approval: value })
                }
              />
            </View>

            <Button
              mode="contained"
              onPress={handleCreateGym}
              loading={loading}
              style={styles.button}
            >
              Create Gym
            </Button>
          </Surface>
        </ScrollView>
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
            {currentGym.name}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Gym Management
          </Text>
        </View>

        {/* Tabs */}
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: "invite", label: "Invite" },
            { value: "members", label: `Members (${members.length})` },
            { value: "settings", label: "Settings" },
          ]}
          style={styles.tabs}
        />

        {/* Invite Tab */}
        {activeTab === "invite" && (
          <Surface style={styles.card} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Invite Athletes
            </Text>
            <Text variant="bodyMedium" style={styles.cardSubtitle}>
              Share this link or code with athletes
            </Text>

            {/* Invite Code */}
            <View style={styles.codeContainer}>
              <Text variant="displaySmall" style={styles.inviteCode}>
                {currentGym.invite_code}
              </Text>
              <Button mode="text" onPress={handleRegenerateCode} compact>
                Regenerate
              </Button>
            </View>

            {/* Actions */}
            <View style={styles.buttonRow}>
              <Button
                mode={copied ? "contained" : "outlined"}
                onPress={handleCopyInviteLink}
                icon={copied ? "check" : "content-copy"}
                style={styles.actionButton}
              >
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                mode="contained"
                onPress={handleShareInvite}
                icon="share"
                style={styles.actionButton}
              >
                Share
              </Button>
            </View>

            {/* Pending Approvals */}
            {pendingMembers.length > 0 && (
              <View style={styles.pendingSection}>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.pendingTitle}>
                  Pending Approvals ({pendingMembers.length})
                </Text>
                {pendingMembers.map((member) => (
                  <View key={member.id} style={styles.pendingMember}>
                    <View style={styles.memberInfo}>
                      <Avatar.Text
                        size={40}
                        label={(
                          member.user?.display_name ||
                          member.user?.full_name ||
                          "U"
                        ).charAt(0)}
                      />
                      <View style={styles.memberText}>
                        <Text variant="bodyMedium">
                          {member.user?.display_name ||
                            member.user?.full_name ||
                            "Unknown"}
                        </Text>
                        <Text variant="bodySmall" style={styles.memberDate}>
                          {new Date(member.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.memberActions}>
                      <Button
                        mode="contained"
                        compact
                        onPress={() => handleApproveMember(member.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        mode="text"
                        compact
                        onPress={() => handleRejectMember(member.id)}
                      >
                        Reject
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Surface>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <Surface style={styles.card} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Active Members
            </Text>
            {members.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No members yet. Share your invite link!
              </Text>
            ) : (
              members.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  {member.user?.profile_photo_url ? (
                    <Avatar.Image
                      size={44}
                      source={{ uri: member.user.profile_photo_url }}
                    />
                  ) : (
                    <Avatar.Text
                      size={44}
                      label={(
                        member.user?.display_name ||
                        member.user?.full_name ||
                        "U"
                      ).charAt(0)}
                    />
                  )}
                  <View style={styles.memberText}>
                    <Text variant="bodyLarge">
                      {member.user?.display_name ||
                        member.user?.full_name ||
                        "Unknown"}
                    </Text>
                    <Text variant="bodySmall" style={styles.memberDate}>
                      Joined{" "}
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>
                  <Chip compact mode="outlined">
                    {member.role}
                  </Chip>
                </View>
              ))
            )}
          </Surface>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Surface style={styles.card} elevation={2}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Gym Settings
            </Text>

            <TextInput
              label="Gym Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text variant="bodyMedium">Require approval for new members</Text>
              <Switch
                value={formData.require_approval}
                onValueChange={(value) =>
                  setFormData({ ...formData, require_approval: value })
                }
              />
            </View>

            <Button
              mode="contained"
              onPress={handleUpdateGym}
              loading={loading}
              style={styles.button}
            >
              Save Changes
            </Button>
          </Surface>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function generateInviteCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  tabs: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#fff",
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#fff",
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  cardSubtitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  codeContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  inviteCode: {
    fontFamily: "monospace",
    letterSpacing: 8,
    fontWeight: "bold",
    color: brandColors.smartBlue.DEFAULT,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  divider: {
    marginVertical: 20,
  },
  pendingSection: {
    marginTop: 8,
  },
  pendingTitle: {
    color: brandColors.helpfulOrange.DEFAULT,
    fontWeight: "600",
    marginBottom: 12,
  },
  pendingMember: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff5f0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberText: {
    flex: 1,
  },
  memberDate: {
    opacity: 0.6,
  },
  memberActions: {
    flexDirection: "row",
    gap: 4,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    paddingVertical: 24,
  },
});
