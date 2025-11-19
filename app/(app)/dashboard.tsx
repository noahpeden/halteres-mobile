import { useRouter } from "expo-router";
import { FileText, Sparkles, Users } from "lucide-react-native";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Card, Text, useTheme } from "react-native-paper";
import { AddClientModal } from "@/components/dashboard/AddClientModal";
import { ClientCard } from "@/components/dashboard/ClientCard";
import { ProgramCard } from "@/components/dashboard/ProgramCard";
import { useDashboardDataMobile } from "@/hooks/useDashboardDataMobile";

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [showAddClient, setShowAddClient] = useState(false);

  const {
    programs,
    entities: clients,
    stats,
    isLoading,
    refetch,
  } = useDashboardDataMobile();

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

  const recentPrograms = programs?.slice(0, 3) || [];
  const recentClients = clients?.slice(0, 3) || [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header - Fixed at top */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              onPress={handleCreateProgram}
              style={styles.quickAction}
            >
              <Card style={styles.card}>
                <Card.Content style={styles.quickActionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <Sparkles size={24} color={theme.colors.primary} />
                  </View>
                  <Text variant="labelLarge" style={styles.quickActionText}>
                    Create Program
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAddClient(true)}
              style={styles.quickAction}
            >
              <Card style={styles.card}>
                <Card.Content style={styles.quickActionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.colors.tertiaryContainer },
                    ]}
                  >
                    <Users size={24} color={theme.colors.tertiary} />
                  </View>
                  <Text variant="labelLarge" style={styles.quickActionText}>
                    Add Client
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Overview
          </Text>
          <View style={styles.statsContainer}>
            <Card style={[styles.card, styles.statCard]}>
              <Card.Content>
                <View style={styles.statHeader}>
                  <Text
                    variant="labelMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Total Programs
                  </Text>
                  <View
                    style={[
                      styles.miniIcon,
                      { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <FileText size={16} color={theme.colors.primary} />
                  </View>
                </View>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {stats.totalPrograms}
                </Text>
              </Card.Content>
            </Card>

            <Card style={[styles.card, styles.statCard]}>
              <Card.Content>
                <View style={styles.statHeader}>
                  <Text
                    variant="labelMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Active Clients
                  </Text>
                  <View
                    style={[
                      styles.miniIcon,
                      { backgroundColor: theme.colors.secondaryContainer },
                    ]}
                  >
                    <Users size={16} color={theme.colors.secondary} />
                  </View>
                </View>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {clients?.length || 0}
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Recent Programs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Programs
            </Text>
            {programs && programs.length > 3 && (
              <TouchableOpacity onPress={() => router.push("/(app)/programs")}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : recentPrograms.length > 0 ? (
            recentPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))
          ) : (
            <Card style={styles.card}>
              <Card.Content style={styles.emptyStateContent}>
                <FileText size={48} color={theme.colors.outline} />
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.emptyStateText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  No programs yet. Create your first program to get started!
                </Text>
                <TouchableOpacity onPress={handleCreateProgram}>
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.primary }}
                  >
                    + Create Program
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Recent Clients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Clients
            </Text>
            {clients && clients.length > 3 && (
              <TouchableOpacity onPress={() => router.push("/(app)/clients")}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : recentClients.length > 0 ? (
            recentClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))
          ) : (
            <Card style={styles.card}>
              <Card.Content style={styles.emptyStateContent}>
                <Users size={48} color={theme.colors.outline} />
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.emptyStateText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  No clients yet. Add your first client to get started!
                </Text>
                <TouchableOpacity onPress={() => setShowAddClient(true)}>
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.primary }}
                  >
                    + Add Client
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Add Client Modal */}
      <AddClientModal
        visible={showAddClient}
        onClose={() => setShowAddClient(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  quickAction: {
    flex: 1,
  },
  card: {
    backgroundColor: "white",
  },
  quickActionContent: {
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActionText: {
    fontWeight: "600",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  miniIcon: {
    padding: 8,
    borderRadius: 8,
  },
  statValue: {
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateContent: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
});
