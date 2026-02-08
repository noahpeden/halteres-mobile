import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Surface,
  ActivityIndicator,
  Chip,
  Button,
  IconButton,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";
import { API_BASE } from "@/lib/api/getApiUrl";
import ResultEntryForm from "@/components/athlete/ResultEntryForm";
import LeaderboardView from "@/components/athlete/LeaderboardView";
import PRCelebration from "@/components/athlete/PRCelebration";
import AIFeedbackCard from "@/components/athlete/AIFeedbackCard";
import { TemplateFeedbackButton, ResultFeedbackCard } from "@/components/feedback";
import { SectionButtons, TVDisplayMode, useTVDisplay } from "@/components/tv-display";
import { parseMarkdownContent } from "@/lib/utils/markdownParser";
import { parseWorkoutSections } from "@/lib/utils/workoutParser";

type Tab = "workout" | "log" | "leaderboard";

type Workout = {
  id: string;
  name: string;
  description: string | null;
  workout_type: string | null;
  exercises: any[] | null;
  program: {
    name: string;
  } | null;
};

type UserResult = {
  id: string;
  result_type: string;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  weight_kg: number | null;
  count: number | null;
  scale: string;
  is_pr: boolean;
  modifications: string | null;
  notes: string | null;
  displayValue: string;
};

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, currentGym } = useContext(AuthContext);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [userResult, setUserResult] = useState<UserResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("workout");
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prData, setPrData] = useState<any>(null);

  // TV Display Mode - Parse sections from workout description
  const sections = useMemo(
    () => parseWorkoutSections(workout?.description),
    [workout?.description]
  );
  const tvDisplay = useTVDisplay(sections);

  const fetchWorkoutData = useCallback(async () => {
    if (!id || !user?.id) return;

    try {
      // Fetch workout details
      const { data: workoutData, error: workoutError } = await supabase
        .from("program_workouts")
        .select(`
          id, name, description, workout_type, exercises,
          program:programs (name)
        `)
        .eq("id", id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      // Fetch user's result for this workout
      const { data: resultData } = await supabase
        .from("workout_results")
        .select("*")
        .eq("workout_id", id)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resultData) {
        setUserResult({
          ...resultData,
          displayValue: formatResult(resultData),
        });
      }
    } catch (err) {
      console.error("Error fetching workout:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    fetchWorkoutData();
  }, [fetchWorkoutData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkoutData();
  };

  const formatResult = (result: any): string => {
    switch (result.result_type) {
      case "time":
        if (!result.time_seconds) return "-";
        const mins = Math.floor(result.time_seconds / 60);
        const secs = result.time_seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      case "rounds_reps":
        return `${result.rounds || 0} + ${result.reps || 0}`;
      case "weight":
        return `${result.weight_kg || 0} kg`;
      default:
        return `${result.count || 0}`;
    }
  };

  const getDefaultResultType = (workoutType: string | null | undefined): string => {
    switch (workoutType?.toLowerCase()) {
      case "amrap":
        return "rounds_reps";
      case "for time":
      case "time":
        return "time";
      case "max weight":
      case "strength":
        return "weight";
      default:
        return "time";
    }
  };

  const handleResultSuccess = async (result: any, isPR: boolean, prInfo: any) => {
    setUserResult({
      ...result,
      displayValue: formatResult(result),
    });

    if (isPR && prInfo) {
      setPrData(prInfo);
      setShowPRCelebration(true);
    }

    // Auto-trigger AI feedback generation in the background
    try {
      fetch(`${API_BASE}/api/ai-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutResultId: result.id,
          userId: user?.id,
        }),
      }).catch(() => {}); // Fire and forget
    } catch (e) {
      // Silently fail - feedback generation is non-critical
    }

    setActiveTab("leaderboard");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.smartBlue.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#000" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Workout Not Found
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            This workout doesn't exist or you don't have access.
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* PR Celebration Modal */}
      <PRCelebration
        visible={showPRCelebration}
        prData={prData}
        onClose={() => setShowPRCelebration(false)}
      />

      {/* Header */}
      <Surface style={styles.headerSurface} elevation={2}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={brandColors.smartBlue.DEFAULT} size={24} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text variant="titleLarge" style={styles.workoutTitle} numberOfLines={1}>
              {workout.name}
            </Text>
            <View style={styles.headerMeta}>
              {workout.workout_type && (
                <Chip compact mode="flat" style={styles.typeChip}>
                  {workout.workout_type}
                </Chip>
              )}
              {workout.program?.name && (
                <Text variant="bodySmall" style={styles.programName}>
                  {workout.program.name}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Surface>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("workout")}
          style={[styles.tab, activeTab === "workout" && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, activeTab === "workout" && styles.activeTabText]}
          >
            Workout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("log")}
          style={[styles.tab, activeTab === "log" && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === "log" && styles.activeTabText]}>
            {userResult ? "Edit Result" : "Log Result"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("leaderboard")}
          style={[styles.tab, activeTab === "leaderboard" && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, activeTab === "leaderboard" && styles.activeTabText]}
          >
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "workout" && (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Workout Description */}
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Description
            </Text>
            <View style={styles.descriptionContainer}>
              {workout.description
                ? parseMarkdownContent(workout.description)
                : <Text variant="bodyMedium" style={styles.description}>No description provided.</Text>
              }
            </View>
            {/* Template Feedback */}
            <View style={styles.templateFeedbackContainer}>
              <TemplateFeedbackButton
                workoutId={id || ""}
                gymId={currentGym?.id}
                showStats
              />
            </View>

            {/* TV Display Section Buttons */}
            {sections.length > 0 && (
              <View style={styles.tvDisplayContainer}>
                <SectionButtons
                  sections={sections}
                  onOpenSection={tvDisplay.openSection}
                />
              </View>
            )}
          </Surface>

          {/* Exercises */}
          {workout.exercises && workout.exercises.length > 0 && (
            <Surface style={styles.card} elevation={1}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Exercises
              </Text>
              {workout.exercises.map((exercise: any, idx: number) => (
                <View key={idx} style={styles.exerciseItem}>
                  <View style={styles.exerciseIndicator} />
                  <View style={styles.exerciseContent}>
                    <Text variant="bodyLarge" style={styles.exerciseName}>
                      {exercise.name}
                    </Text>
                    {exercise.reps && (
                      <Text variant="bodySmall" style={styles.exerciseDetail}>
                        {exercise.reps} reps
                      </Text>
                    )}
                    {exercise.weight && (
                      <Text variant="bodySmall" style={styles.exerciseDetail}>
                        @ {exercise.weight}
                      </Text>
                    )}
                    {exercise.notes && (
                      <Text variant="bodySmall" style={styles.exerciseNotes}>
                        {exercise.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Surface>
          )}

          {/* User's Result */}
          {userResult && (
            <Surface style={styles.resultCard} elevation={2}>
              <View style={styles.resultHeader}>
                <Text variant="titleMedium" style={styles.resultTitle}>
                  Your Result
                </Text>
                <Chip compact mode="flat" style={styles.scaleChip}>
                  {userResult.scale.toUpperCase()}
                </Chip>
              </View>
              <View style={styles.resultContent}>
                <Text variant="displaySmall" style={styles.resultValue}>
                  {userResult.displayValue}
                </Text>
                {userResult.is_pr && (
                  <View style={styles.prBadge}>
                    <Text style={styles.prIcon}>🏆</Text>
                    <Text style={styles.prText}>PR!</Text>
                  </View>
                )}
              </View>
              <Button
                mode="outlined"
                onPress={() => setActiveTab("log")}
                style={styles.editButton}
              >
                Edit Result
              </Button>
            </Surface>
          )}

          {/* AI Feedback */}
          {userResult && (
            <View style={styles.feedbackContainer}>
              <AIFeedbackCard workoutResultId={userResult.id} />
            </View>
          )}

          {/* Self-Assessment Feedback */}
          {userResult && user?.id && (
            <View style={styles.feedbackContainer}>
              <ResultFeedbackCard
                workoutResultId={userResult.id}
                resultOwnerId={user.id}
                currentUserId={user.id}
                gymId={currentGym?.id}
              />
            </View>
          )}

          {/* Log Result CTA */}
          {!userResult && (
            <Button
              mode="contained"
              onPress={() => setActiveTab("log")}
              style={styles.logButton}
              labelStyle={styles.logButtonLabel}
            >
              Log Your Result
            </Button>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Log Result Tab */}
      {activeTab === "log" && (
        <View style={styles.formContainer}>
          <ResultEntryForm
            workoutId={id!}
            gymId={currentGym?.id}
            workoutTitle={workout.name}
            onSuccess={handleResultSuccess}
            onCancel={() => setActiveTab("workout")}
            defaultResultType={getDefaultResultType(workout.workout_type) as any}
          />
        </View>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <View style={styles.leaderboardContainer}>
          <LeaderboardView
            workoutId={id!}
            gymId={currentGym?.id}
            workoutTitle={workout.name}
          />
        </View>
      )}

      {/* TV Display Mode */}
      <TVDisplayMode
        isOpen={tvDisplay.isOpen}
        currentSection={tvDisplay.currentSection}
        sections={sections}
        currentSectionId={tvDisplay.currentSectionId}
        workoutTitle={workout?.name || "Workout"}
        onClose={tvDisplay.close}
        onNext={tvDisplay.goToNext}
        onPrevious={tvDisplay.goToPrevious}
        onGoToSection={tvDisplay.goToSection}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  errorText: {
    opacity: 0.6,
    marginBottom: 24,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  headerSurface: {
    backgroundColor: "#fff",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  workoutTitle: {
    fontWeight: "bold",
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  typeChip: {
    height: 24,
    backgroundColor: brandColors.smartBlue.container,
  },
  programName: {
    opacity: 0.6,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: brandColors.smartBlue.DEFAULT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    lineHeight: 22,
    color: "#333",
  },
  descriptionContainer: {
    marginTop: 4,
  },
  templateFeedbackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  tvDisplayContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  exerciseItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  exerciseIndicator: {
    width: 4,
    backgroundColor: brandColors.smartBlue.DEFAULT,
    borderRadius: 2,
    marginRight: 12,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: "600",
  },
  exerciseDetail: {
    color: "#666",
  },
  exerciseNotes: {
    color: "#999",
    fontStyle: "italic",
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: brandColors.thrivingGreen.container,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: brandColors.thrivingGreen.DEFAULT,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTitle: {
    color: brandColors.thrivingGreen.DEFAULT,
    fontWeight: "600",
  },
  scaleChip: {
    backgroundColor: "#fff",
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultValue: {
    fontWeight: "bold",
  },
  prBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  prText: {
    color: "#d97706",
    fontWeight: "600",
    fontSize: 12,
  },
  editButton: {
    marginTop: 12,
    borderColor: brandColors.thrivingGreen.DEFAULT,
  },
  feedbackContainer: {
    marginBottom: 16,
  },
  logButton: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  logButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 24,
  },
  formContainer: {
    flex: 1,
  },
  leaderboardContainer: {
    flex: 1,
  },
});
