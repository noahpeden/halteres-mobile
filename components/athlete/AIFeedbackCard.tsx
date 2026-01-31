import { useState, useEffect, useContext } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
  Text,
  Surface,
  Button,
  ActivityIndicator,
  List,
} from "react-native-paper";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";
import { API_BASE } from "@/lib/api/getApiUrl";

type Feedback = {
  id: string;
  performance_analysis: string;
  strengths: string[];
  areas_for_improvement: string[];
  recovery_suggestions: string[];
  next_workout_recommendations: string[];
  created_at: string;
};

type Props = {
  workoutResultId: string;
  autoGenerate?: boolean;
};

export default function AIFeedbackCard({ workoutResultId, autoGenerate = false }: Props) {
  const { user } = useContext(AuthContext);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchExistingFeedback();
  }, [workoutResultId]);

  useEffect(() => {
    if (autoGenerate && !feedback && !loading) {
      generateFeedback();
    }
  }, [autoGenerate, feedback]);

  const fetchExistingFeedback = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/ai-feedback?workoutResultId=${workoutResultId}&userId=${user.id}`
      );
      const data = await response.json();
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
    }
  };

  const generateFeedback = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/ai-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutResultId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFeedback(data.feedback);
      } else {
        setError(data.error || "Failed to generate feedback");
      }
    } catch (err) {
      setError("Failed to generate feedback");
    } finally {
      setLoading(false);
    }
  };

  if (!feedback && !loading) {
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.header}>
          <Text style={styles.robotIcon}>🤖</Text>
          <Text variant="titleMedium" style={styles.title}>
            AI Coach Feedback
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.description}>
          Get personalized feedback on your workout performance
        </Text>
        <Button
          mode="contained"
          onPress={generateFeedback}
          loading={loading}
          style={styles.button}
        >
          Get Feedback
        </Button>
      </Surface>
    );
  }

  if (loading) {
    return (
      <Surface style={[styles.card, styles.loadingCard]} elevation={1}>
        <ActivityIndicator size="large" color={brandColors.smartBlue.DEFAULT} />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Analyzing your workout...
        </Text>
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={[styles.card, styles.errorCard]} elevation={1}>
        <Text variant="bodyMedium" style={styles.errorText}>
          {error}
        </Text>
        <Button mode="outlined" onPress={generateFeedback}>
          Try Again
        </Button>
      </Surface>
    );
  }

  return (
    <Surface style={styles.feedbackCard} elevation={2}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.feedbackHeader}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.robotIcon}>🤖</Text>
          <Text variant="titleMedium" style={styles.title}>
            AI Coach Feedback
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? "−" : "+"}</Text>
      </TouchableOpacity>

      {/* Performance Analysis */}
      <Text variant="bodyMedium" style={styles.analysis}>
        {feedback?.performance_analysis}
      </Text>

      {/* Expanded Content */}
      {expanded && feedback && (
        <View style={styles.expandedContent}>
          {/* Strengths */}
          {feedback.strengths?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>💪</Text>
                <Text variant="titleSmall" style={styles.strengthsTitle}>
                  Strengths
                </Text>
              </View>
              {feedback.strengths.map((strength, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.checkMark}>✓</Text>
                  <Text variant="bodySmall" style={styles.listText}>
                    {strength}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Areas for Improvement */}
          {feedback.areas_for_improvement?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🎯</Text>
                <Text variant="titleSmall" style={styles.improvementTitle}>
                  Areas to Focus On
                </Text>
              </View>
              {feedback.areas_for_improvement.map((area, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.arrow}>→</Text>
                  <Text variant="bodySmall" style={styles.listText}>
                    {area}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recovery Suggestions */}
          {feedback.recovery_suggestions?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🧘</Text>
                <Text variant="titleSmall" style={styles.recoveryTitle}>
                  Recovery Tips
                </Text>
              </View>
              {feedback.recovery_suggestions.map((suggestion, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text variant="bodySmall" style={styles.listText}>
                    {suggestion}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Next Workout Recommendations */}
          {feedback.next_workout_recommendations?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📋</Text>
                <Text variant="titleSmall" style={styles.nextTitle}>
                  For Your Next Workout
                </Text>
              </View>
              {feedback.next_workout_recommendations.map((rec, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.arrow}>→</Text>
                  <Text variant="bodySmall" style={styles.listText}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Expand hint */}
      {!expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text variant="bodySmall" style={styles.expandHint}>
            View detailed feedback →
          </Text>
        </TouchableOpacity>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  loadingCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  errorCard: {
    borderWidth: 1,
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: brandColors.smartBlue.DEFAULT + "30",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  robotIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontWeight: "600",
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: "bold",
    opacity: 0.5,
  },
  description: {
    opacity: 0.7,
    marginBottom: 16,
  },
  button: {
    alignSelf: "flex-end",
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
  },
  analysis: {
    lineHeight: 22,
  },
  expandedContent: {
    marginTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  strengthsTitle: {
    color: brandColors.thrivingGreen.DEFAULT,
    fontWeight: "600",
  },
  improvementTitle: {
    color: brandColors.helpfulOrange.DEFAULT,
    fontWeight: "600",
  },
  recoveryTitle: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
  },
  nextTitle: {
    color: "#8b5cf6",
    fontWeight: "600",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingLeft: 4,
  },
  checkMark: {
    color: brandColors.thrivingGreen.DEFAULT,
    marginRight: 8,
    fontWeight: "bold",
  },
  arrow: {
    color: brandColors.helpfulOrange.DEFAULT,
    marginRight: 8,
  },
  bullet: {
    color: brandColors.smartBlue.DEFAULT,
    marginRight: 8,
  },
  listText: {
    flex: 1,
    lineHeight: 20,
  },
  expandHint: {
    color: brandColors.smartBlue.DEFAULT,
    marginTop: 8,
  },
});
