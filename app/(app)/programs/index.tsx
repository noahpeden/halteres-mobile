import { useRouter } from "expo-router";
import { FileText, Plus } from "lucide-react-native";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  useTheme,
} from "react-native-paper";
import { ProgramCard } from "@/components/dashboard/ProgramCard";
import { usePrograms } from "@/hooks/usePrograms";

export default function ProgramsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: programs, isLoading, refetch } = usePrograms();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateProgram = () => {
    router.push("/(app)/programs/create");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderColor: theme.colors.outlineVariant }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Programs
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {programs?.length || 0} total programs
            </Text>
          </View>
          <TouchableOpacity onPress={handleCreateProgram}>
            <View
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Plus size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
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
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : programs && programs.length > 0 ? (
            programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))
          ) : (
            <Card style={styles.card}>
              <Card.Content style={styles.emptyStateContent}>
                <FileText size={64} color={theme.colors.outline} />
                <Text variant="titleLarge" style={styles.emptyStateTitle}>
                  No Programs Yet
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.emptyStateDescription,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Create your first training program to get started with your
                  coaching journey.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleCreateProgram}
                  icon={({ size, color }) => <Plus size={size} color={color} />}
                  style={styles.createButton}
                >
                  Create Your First Program
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  addButton: {
    padding: 12,
    borderRadius: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  content: {
    paddingVertical: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  card: {
    marginTop: 32,
    backgroundColor: "white",
  },
  emptyStateContent: {
    padding: 32,
    alignItems: "center",
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  emptyStateDescription: {
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    width: "100%",
  },
});
