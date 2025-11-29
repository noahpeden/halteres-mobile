import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  Edit2,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { EnhanceWorkoutModal } from "@/components/workouts/EnhanceWorkoutModal";
import { useProgramDataMobile } from "@/hooks/useProgramDataMobile";
import { useWorkout } from "@/hooks/useWorkout";

type EnhancedWorkout = {
  title: string;
  description: string;
  notes?: string;
};

export default function WorkoutDetailScreen() {
  const { id: programId, workoutId } = useLocalSearchParams<{
    id: string;
    workoutId: string;
  }>();
  const router = useRouter();
  const theme = useTheme();

  const {
    workout,
    loading,
    error,
    updateWorkout,
    toggleComplete,
    deleteWorkout,
    enhanceWorkout,
    saveEnhancement,
  } = useWorkout(workoutId);

  const { program } = useProgramDataMobile(programId);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  // Enhance mode state
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedWorkout, setEnhancedWorkout] =
    useState<EnhancedWorkout | null>(null);

  // Action states
  const [isToggling, setIsToggling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Edit handlers
  const handleStartEdit = () => {
    setEditTitle(workout?.title || "");
    setEditBody(workout?.body || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditBody("");
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    setIsSaving(true);
    const result = await updateWorkout({ title: editTitle, body: editBody });
    setIsSaving(false);

    if (result.success) {
      setIsEditing(false);
    } else {
      Alert.alert("Error", result.error || "Failed to save changes");
    }
  };

  // Completion handler
  const handleToggleComplete = async () => {
    setIsToggling(true);
    const result = await toggleComplete();
    setIsToggling(false);

    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to update workout");
    }
  };

  // Delete handler
  const handleDelete = () => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            const result = await deleteWorkout();
            setIsDeleting(false);

            if (result.success) {
              router.back();
            } else {
              Alert.alert("Error", result.error || "Failed to delete workout");
            }
          },
        },
      ],
    );
  };

  // Share handler
  const handleShare = async () => {
    if (!workout) return;

    try {
      const shareContent = `${workout.title}\n\n${workout.body}`;
      await Share.share({
        message: shareContent,
        title: workout.title,
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // Enhance handlers
  const handleEnhance = async (instructions: string) => {
    if (!workout || !program) return;

    setIsEnhancing(true);

    // Extract equipment as string array
    const equipmentArray = (program.gym_details?.equipment || [])
      .map((item) => (typeof item === "string" ? item : String(item)))
      .filter(Boolean);

    const result = await enhanceWorkout({
      workout: { title: workout.title, description: workout.body },
      instructions,
      methodology: program.training_methodology || "",
      gymEquipment: equipmentArray.length > 0 ? equipmentArray : ["Bodyweight"],
      injuries: program.reference_input ? [program.reference_input] : undefined,
    });
    setIsEnhancing(false);

    if (result.success && result.enhanced) {
      setEnhancedWorkout(result.enhanced);
    } else {
      Alert.alert("Error", result.error || "Failed to enhance workout");
    }
  };

  const handleSaveEnhancement = async () => {
    if (!enhancedWorkout) return;

    setIsSaving(true);
    const result = await saveEnhancement(enhancedWorkout);
    setIsSaving(false);

    if (result.success) {
      setEnhancedWorkout(null);
      setShowEnhanceModal(false);
    } else {
      Alert.alert("Error", result.error || "Failed to save enhancement");
    }
  };

  const handleDiscardEnhancement = () => {
    setEnhancedWorkout(null);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Loading workout...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workout) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            Workout Not Found
          </Text>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error || "This workout may have been deleted."}
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderColor: theme.colors.outlineVariant }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
          {isEditing ? "Edit Workout" : "Workout Details"}
        </Text>
        <View style={styles.headerActions}>
          {!isEditing && (
            <>
              <IconButton
                icon={() => <Share2 size={20} color={theme.colors.onSurface} />}
                onPress={handleShare}
                size={20}
              />
              <IconButton
                icon={() => <Edit2 size={20} color={theme.colors.onSurface} />}
                onPress={handleStartEdit}
                size={20}
              />
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Banner */}
        {workout.completed && (
          <Card
            style={[
              styles.statusBanner,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Card.Content style={styles.statusContent}>
              <Check size={20} color={theme.colors.primary} />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                Completed{" "}
                {workout.completed_at &&
                  `on ${formatDate(workout.completed_at)}`}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Main Content Card */}
        <Card style={styles.mainCard}>
          <Card.Content>
            {isEditing ? (
              <>
                <TextInput
                  label="Title"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Workout Details"
                  value={editBody}
                  onChangeText={setEditBody}
                  mode="outlined"
                  multiline
                  numberOfLines={15}
                  style={[styles.input, styles.bodyInput]}
                />
              </>
            ) : (
              <>
                <Text variant="headlineSmall" style={styles.title}>
                  {workout.title}
                </Text>

                {workout.scheduled_date && (
                  <View style={styles.dateRow}>
                    <Calendar size={16} color={theme.colors.onSurfaceVariant} />
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {formatDate(workout.scheduled_date)}
                    </Text>
                  </View>
                )}

                {workout.tags && workout.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {workout.tags.map((tag) => (
                      <Chip
                        key={tag}
                        mode="outlined"
                        compact
                        style={styles.tag}
                      >
                        {tag}
                      </Chip>
                    ))}
                  </View>
                )}

                <Divider style={styles.divider} />

                <Text variant="bodyLarge" style={styles.body} selectable>
                  {workout.body}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        {isEditing ? (
          <View style={styles.editActions}>
            <Button
              mode="outlined"
              onPress={handleCancelEdit}
              style={styles.actionButton}
              icon={() => <X size={18} color={theme.colors.onSurface} />}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveEdit}
              style={styles.actionButton}
              loading={isSaving}
              disabled={isSaving}
              icon={() => <Check size={18} color={theme.colors.onPrimary} />}
            >
              Save
            </Button>
          </View>
        ) : (
          <>
            {/* Enhance Button */}
            <Button
              mode="contained-tonal"
              onPress={() => setShowEnhanceModal(true)}
              style={styles.enhanceButton}
              icon={() => <Sparkles size={18} color={theme.colors.primary} />}
            >
              Enhance with AI
            </Button>

            {/* Complete/Incomplete Button */}
            <Button
              mode={workout.completed ? "outlined" : "contained"}
              onPress={handleToggleComplete}
              style={styles.completeButton}
              loading={isToggling}
              disabled={isToggling}
              icon={() => (
                <Check
                  size={18}
                  color={
                    workout.completed
                      ? theme.colors.onSurface
                      : theme.colors.onPrimary
                  }
                />
              )}
            >
              {workout.completed ? "Mark Incomplete" : "Mark Complete"}
            </Button>

            {/* Delete Button */}
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.deleteButton}
              textColor={theme.colors.error}
              loading={isDeleting}
              disabled={isDeleting}
              icon={() => <Trash2 size={18} color={theme.colors.error} />}
            >
              Delete Workout
            </Button>
          </>
        )}
      </ScrollView>

      {/* Enhance Modal */}
      <EnhanceWorkoutModal
        visible={showEnhanceModal}
        onDismiss={() => {
          setShowEnhanceModal(false);
          setEnhancedWorkout(null);
        }}
        onEnhance={handleEnhance}
        onSave={handleSaveEnhancement}
        onDiscard={handleDiscardEnhancement}
        isEnhancing={isEnhancing}
        enhancedWorkout={enhancedWorkout}
        originalTitle={workout.title}
        originalBody={workout.body}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorTitle: {
    fontWeight: "bold",
  },
  errorText: {
    opacity: 0.7,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontWeight: "600",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusBanner: {
    marginBottom: 16,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mainCard: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    height: 28,
  },
  divider: {
    marginVertical: 16,
  },
  body: {
    lineHeight: 24,
  },
  input: {
    marginBottom: 12,
  },
  bodyInput: {
    minHeight: 300,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  enhanceButton: {
    marginBottom: 12,
  },
  completeButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginBottom: 16,
  },
});
