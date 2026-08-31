import { Sparkles } from "lucide-react-native";
import { useContext, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AIFeedbackCard from "@/components/athlete/AIFeedbackCard";
import { AuthContext } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { palette } from "@/lib/theme";

type WorkoutResult = {
  id: string;
  result_type: string;
  created_at: string;
  workout: {
    title: string;
  } | null;
};

export default function FeedbackScreen() {
  const { user } = useContext(AuthContext);
  const [results, setResults] = useState<WorkoutResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("workout_results")
        .select(`
          id,
          result_type,
          created_at,
          workout:program_workouts (title)
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

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
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Notes from the writer
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            How the last sessions actually felt
          </Text>
        </View>

        {results.length === 0 ? (
          <Surface style={styles.emptyState} elevation={2}>
            <Sparkles size={48} color={palette.inkFaint} style={styles.icon} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nothing to read yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Log a session and we'll write back — what went well, what to
              watch, what to try next.
            </Text>
          </Surface>
        ) : (
          <View style={styles.feedbackList}>
            {results.map((result) => (
              <View key={result.id} style={styles.feedbackItem}>
                <Text variant="labelLarge" style={styles.workoutName}>
                  {result.workout?.title || "Workout"}
                </Text>
                <Text variant="bodySmall" style={styles.date}>
                  {new Date(result.created_at).toLocaleDateString()}
                </Text>
                <View style={styles.cardContainer}>
                  <AIFeedbackCard workoutResultId={result.id} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  emptyState: {
    padding: 48,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: palette.paperElevated,
  },
  icon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 22,
  },
  feedbackList: {
    gap: 24,
  },
  feedbackItem: {
    marginBottom: 8,
  },
  workoutName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  date: {
    opacity: 0.5,
    marginBottom: 12,
  },
  cardContainer: {
    marginTop: 4,
  },
});
