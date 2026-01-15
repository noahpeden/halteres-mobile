import { brandColors } from "@/app/_layout";
import { AddClientModal } from "@/components/dashboard/AddClientModal";
import { ClientCard } from "@/components/dashboard/ClientCard";
import { useClients, useDeleteClient, type Client } from "@/hooks/useClients";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Plus, Users } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Text,
  useTheme,
} from "react-native-paper";

export default function ClientsListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: clients, isLoading, refetch } = useClients();
  const deleteClient = useDeleteClient();

  const [showAddClient, setShowAddClient] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
            } catch (_error) {
              Alert.alert("Error", "Failed to delete client");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.header, { backgroundColor: theme.colors.surface }]}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={brandColors.practicalGray.DEFAULT} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Clients & Classes
            </Text>
            <Text variant="bodySmall" style={{ color: brandColors.practicalGray.DEFAULT }}>
              {clients?.length || 0} total
            </Text>
          </View>

          <Pressable
            onPress={() => setShowAddClient(true)}
            style={[styles.addButton, { backgroundColor: brandColors.smartBlue.DEFAULT }]}
          >
            <Plus size={20} color="#ffffff" />
          </Pressable>
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
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : clients && clients.length > 0 ? (
            clients.map((client, index) => (
              <Animated.View
                key={client.id}
                entering={FadeInUp.duration(300).delay(100 + index * 50)}
              >
                <ClientCard
                  client={client}
                  onPress={() => router.push(`/(app)/clients/${client.id}`)}
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
        </ScrollView>

        {/* Add Client Modal */}
        <AddClientModal
          visible={showAddClient}
          onClose={() => setShowAddClient(false)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: "700",
    color: "#121212",
  },
  addButton: {
    padding: 10,
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
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
