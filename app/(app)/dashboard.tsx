import { useRouter } from "expo-router";
import {
	ChevronRight,
	Dumbbell,
	Plus,
	Sparkles,
	Users,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import { AddClientModal } from "@/components/dashboard/AddClientModal";
import { EditClientModal } from "@/components/dashboard/EditClientModal";
import { ClientCard } from "@/components/dashboard/ClientCard";
import { ProgramCard } from "@/components/dashboard/ProgramCard";
import { useDashboardDataMobile } from "@/hooks/useDashboardDataMobile";
import {
  useDeleteClient,
  useUpdateClient,
  type Client,
  type ClientMetrics,
} from "@/hooks/useClients";
import { brandColors } from "@/app/_layout";
import type { EntityType } from "@/lib/validations/program.schema";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const {
    programs,
    entities: clients,
    stats,
    isLoading,
    refetch,
  } = useDashboardDataMobile();

  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateProgram = () => {
    // Navigate to program creation screen
    router.push("/(app)/programs/create");
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowEditClient(true);
  };

  const handleUpdateClient = async (data: {
    name: string;
    type: EntityType;
    metrics?: ClientMetrics;
  }) => {
    if (!selectedClient) return;

    try {
      await updateClient.mutateAsync({
        id: selectedClient.id,
        data,
      });
      setShowEditClient(false);
      setSelectedClient(null);
      refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to update client");
      throw error;
    }
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      `Delete ${client.type === "CLIENT" ? "Client" : "Class"}?`,
      `Are you sure you want to delete "${client.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClient.mutateAsync(client.id);
              refetch();
            } catch (error) {
              Alert.alert("Error", "Failed to delete client");
            }
          },
        },
      ]
    );
  };

  const recentPrograms = programs?.slice(0, 3) || [];
  const recentClients = clients?.slice(0, 3) || [];

  // Animation for quick action cards
  const createProgramScale = useSharedValue(1);
  const addClientScale = useSharedValue(1);

  const createProgramStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createProgramScale.value }],
  }));

  const addClientStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addClientScale.value }],
  }));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header - Fixed at top */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Coach Dashboard
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Manage your programs and track client progress
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          style={styles.section}
        >
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsContainer}>
            <AnimatedPressable
              onPress={handleCreateProgram}
              onPressIn={() => {
                createProgramScale.value = withSpring(0.96, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPressOut={() => {
                createProgramScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 150,
                });
              }}
              style={[styles.quickAction, createProgramStyle]}
            >
              <View style={[styles.quickActionCard, styles.primaryActionCard]}>
                <View style={styles.quickActionIconLarge}>
                  <Sparkles
                    size={32}
                    color={brandColors.smartBlue.DEFAULT}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.quickActionTextContainer}>
                  <Text variant="titleMedium" style={styles.quickActionTitle}>
                    Create Program
                  </Text>
                  <Text variant="bodySmall" style={styles.quickActionSubtitle}>
                    AI-powered workout plans
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={brandColors.practicalGray.light}
                />
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => setShowAddClient(true)}
              onPressIn={() => {
                addClientScale.value = withSpring(0.96, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPressOut={() => {
                addClientScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 150,
                });
              }}
              style={[styles.quickAction, addClientStyle]}
            >
              <View
                style={[styles.quickActionCard, styles.secondaryActionCard]}
              >
                <View
                  style={[
                    styles.quickActionIconLarge,
                    { backgroundColor: brandColors.thrivingGreen.container },
                  ]}
                >
                  <Users
                    size={32}
                    color={brandColors.thrivingGreen.DEFAULT}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.quickActionTextContainer}>
                  <Text variant="titleMedium" style={styles.quickActionTitle}>
                    Add Client
                  </Text>
                  <Text variant="bodySmall" style={styles.quickActionSubtitle}>
                    New athlete or class
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={brandColors.practicalGray.light}
                />
              </View>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(300)}
          style={styles.section}
        >
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Overview
          </Text>
          <View style={styles.statsContainer}>
            {/* Programs Stat */}
            <View style={[styles.statCard, styles.statCardBlue]}>
              <View style={styles.statIconContainer}>
                <Dumbbell
                  size={24}
                  color={brandColors.smartBlue.DEFAULT}
                  strokeWidth={2}
                />
              </View>
              <Text
                variant="displaySmall"
                style={[
                  styles.statValue,
                  { color: brandColors.smartBlue.dark },
                ]}
              >
                {stats.totalPrograms}
              </Text>
              <Text variant="labelMedium" style={styles.statLabel}>
                Total Programs
              </Text>
            </View>

            {/* Clients Stat */}
            <View style={[styles.statCard, styles.statCardGreen]}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: brandColors.thrivingGreen.lightest },
                ]}
              >
                <Users
                  size={24}
                  color={brandColors.thrivingGreen.DEFAULT}
                  strokeWidth={2}
                />
              </View>
              <Text
                variant="displaySmall"
                style={[
                  styles.statValue,
                  { color: brandColors.thrivingGreen.dark },
                ]}
              >
                {clients?.length || 0}
              </Text>
              <Text variant="labelMedium" style={styles.statLabel}>
                Active Clients
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Programs */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(400)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Programs
            </Text>
            {programs && programs.length > 3 && (
              <Pressable
                onPress={() => router.push("/(app)/programs")}
                style={styles.viewAllButton}
              >
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  View All
                </Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : recentPrograms.length > 0 ? (
            recentPrograms.map((program, index) => (
              <Animated.View
                key={program.id}
                entering={FadeInUp.duration(300).delay(450 + index * 100)}
              >
                <ProgramCard program={program} />
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconContainer}>
                <Dumbbell
                  size={40}
                  color={brandColors.practicalGray.light}
                  strokeWidth={1.5}
                />
              </View>
              <Text variant="titleMedium" style={styles.emptyStateTitle}>
                No programs yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                Create your first AI-powered program to get started!
              </Text>
              <Button
                mode="contained"
                onPress={handleCreateProgram}
                icon={() => <Plus size={18} color="#fff" />}
                style={styles.emptyStateButton}
              >
                Create Program
              </Button>
            </View>
          )}
        </Animated.View>

        {/* Recent Clients */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(500)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Clients
            </Text>
            {clients && clients.length > 3 && (
              <Pressable
                onPress={() => router.push("/(app)/clients")}
                style={styles.viewAllButton}
              >
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  View All
                </Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : recentClients.length > 0 ? (
            recentClients.map((client, index) => (
              <Animated.View
                key={client.id}
                entering={FadeInUp.duration(300).delay(550 + index * 100)}
              >
                <ClientCard
                  client={client}
                  onPress={() => router.push(`/(app)/clients/${client.id}`)}
                  onEdit={() => handleEditClient(client)}
                  onDelete={() => handleDeleteClient(client)}
                />
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <View
                style={[
                  styles.emptyStateIconContainer,
                  { backgroundColor: brandColors.thrivingGreen.container },
                ]}
              >
                <Users
                  size={40}
                  color={brandColors.thrivingGreen.light}
                  strokeWidth={1.5}
                />
              </View>
              <Text variant="titleMedium" style={styles.emptyStateTitle}>
                No clients yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptyStateText}>
                Add your first client or class to get started!
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowAddClient(true)}
                icon={() => <Plus size={18} color="#fff" />}
                style={[
                  styles.emptyStateButton,
                  { backgroundColor: brandColors.thrivingGreen.DEFAULT },
                ]}
              >
                Add Client
              </Button>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Add Client Modal */}
      <AddClientModal
        visible={showAddClient}
        onClose={() => setShowAddClient(false)}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        visible={showEditClient}
        onClose={() => {
          setShowEditClient(false);
          setSelectedClient(null);
        }}
        onSubmit={handleUpdateClient}
        client={selectedClient}
        isSubmitting={updateClient.isPending}
        mode="edit"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#121212",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // Quick Actions - New Design
  quickActionsContainer: {
    gap: 12,
  },
  quickAction: {
    flex: 1,
  },
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionCard: {
    borderLeftWidth: 4,
    borderLeftColor: brandColors.smartBlue.DEFAULT,
  },
  secondaryActionCard: {
    borderLeftWidth: 4,
    borderLeftColor: brandColors.thrivingGreen.DEFAULT,
  },
  quickActionIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: brandColors.smartBlue.container,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionTitle: {
    fontWeight: "700",
    color: "#121212",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    color: brandColors.practicalGray.DEFAULT,
  },
  // Stats - New Design
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  statCardBlue: {
    backgroundColor: brandColors.smartBlue.container,
  },
  statCardGreen: {
    backgroundColor: brandColors.thrivingGreen.container,
  },
  statCardOrange: {
    backgroundColor: brandColors.helpfulOrange.container,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: brandColors.smartBlue.lightest,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    color: brandColors.practicalGray.medium,
    fontWeight: "500",
  },
  // Loading
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  // Empty States - New Design
  emptyStateCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: brandColors.smartBlue.container,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontWeight: "700",
    color: "#121212",
    marginBottom: 8,
  },
  emptyStateText: {
    textAlign: "center",
    color: brandColors.practicalGray.DEFAULT,
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    borderRadius: 12,
    paddingHorizontal: 8,
  },
});
