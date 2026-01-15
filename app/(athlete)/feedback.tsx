import { useState, useEffect, useContext } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Text, Surface, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";
import { brandColors } from "@/app/_layout";
import { AuthContext } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import AIFeedbackCard from "@/components/athlete/AIFeedbackCard";

type WorkoutResult = {
  id: string;
  result_type: string;
  created_at: string;
  workout: {
    name: string;
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
          workout:program_workouts (name)
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
            AI Insights
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Personalized feedback and recommendations
          </Text>
        </View>

        {results.length === 0 ? (
          <Surface style={styles.emptyState} elevation={2}>
            <Sparkles
              size={48}
              color={brandColors.practicalGray.light}
              style={styles.icon}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Insights Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Complete workouts and log results to receive personalized AI feedback
              on your performance, recovery suggestions, and training recommendations.
            </Text>
          </Surface>
        ) : (
          <View style={styles.feedbackList}>
            {results.map((result) => (
              <View key={result.id} style={styles.feedbackItem}>
                <Text variant="labelLarge" style={styles.workoutName}>
                  {result.workout?.name || "Workout"}
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
    backgroundColor: "#fff",
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
