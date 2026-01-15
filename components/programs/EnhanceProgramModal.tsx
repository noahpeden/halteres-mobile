import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import type { Workout } from "@/hooks/useProgramWorkoutsMobile";
import {
  useEnhanceProgram,
  type EnhancedWorkout,
} from "@/hooks/useEnhanceProgram";

type EnhanceProgramModalProps = {
  visible: boolean;
  workouts: Workout[];
  formData: {
    name?: string;
    trainingMethodology?: string;
    equipment?: string[];
    focusArea?: string;
    workoutFormats?: string[];
  };
  onClose: () => void;
  onSave: (workouts: EnhancedWorkout[]) => Promise<void>;
};

export function EnhanceProgramModal({
  visible,
  workouts,
  formData,
  onClose,
  onSave,
}: EnhanceProgramModalProps) {
  const theme = useTheme();
  const { isEnhancing, enhanceProgram } = useEnhanceProgram();

  // Internal state
  const [instructions, setInstructions] = useState("");
  const [enhancedWorkouts, setEnhancedWorkouts] = useState<EnhancedWorkout[] | null>(null);
  const [enhancementNotes, setEnhancementNotes] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setInstructions("");
    setEnhancedWorkouts(null);
    setEnhancementNotes("");
    setPreviewMode(false);
    setCurrentPreviewIndex(0);
    setError(null);
    onClose();
  }, [onClose]);

  // Call the enhance API
  const handleEnhance = useCallback(async () => {
    if (!instructions.trim()) {
      setError("Please enter enhancement instructions");
      return;
    }

    setError(null);

    const result = await enhanceProgram({
      workouts: workouts.map((w) => ({
        id: w.id,
        title: w.title,
        body: w.body || "",
      })),
      instructions,
      programName: formData?.name || "Program",
      methodology: formData?.trainingMethodology || "General fitness",
      gymEquipment: formData?.equipment || [],
      focusArea: formData?.focusArea || "",
      workoutFormats: formData?.workoutFormats || [],
    });

    if (result) {
      setEnhancedWorkouts(result.enhancedWorkouts);
      setEnhancementNotes(result.notes);
      setPreviewMode(true);
      setCurrentPreviewIndex(0);
    } else {
      setError("Enhancement failed. Please try again.");
    }
  }, [instructions, workouts, formData, enhanceProgram]);

  // Navigation
  const goToPreviousWorkout = useCallback(() => {
    setCurrentPreviewIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextWorkout = useCallback(() => {
    setCurrentPreviewIndex((prev) =>
      Math.min((enhancedWorkouts?.length || 1) - 1, prev + 1),
    );
  }, [enhancedWorkouts]);

  // Save all enhanced workouts
  const handleSaveAll = useCallback(async () => {
    if (!enhancedWorkouts) return;

    setIsSaving(true);
    try {
      await onSave(enhancedWorkouts);
      handleClose();
    } catch (err) {
      setError("Failed to save workouts");
    } finally {
      setIsSaving(false);
    }
  }, [enhancedWorkouts, onSave, handleClose]);

  const currentOriginal = workouts[currentPreviewIndex];
  const currentEnhanced = enhancedWorkouts?.[currentPreviewIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
              <Sparkles size={20} color={theme.colors.primary} />
            </View>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Enhance Program
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {!previewMode ? (
            // Input Phase
            <View style={styles.inputPhase}>
              <Text variant="titleMedium" style={styles.label}>
                How would you like to enhance this program?
              </Text>
              <TextInput
                mode="outlined"
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g., Add more upper body work, increase conditioning intensity, focus on Olympic lifting..."
                multiline
                numberOfLines={4}
                style={styles.textInput}
                disabled={isEnhancing}
              />

              <Card style={styles.infoCard} mode="outlined">
                <Card.Content>
                  <Text variant="bodyMedium">
                    <Text style={{ fontWeight: "bold" }}>{workouts.length} workouts</Text> will be
                    enhanced based on your instructions. The AI will maintain program progression
                    and ensure all workouts complement each other.
                  </Text>
                </Card.Content>
              </Card>

              {error && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              )}
            </View>
          ) : (
            // Preview Phase
            <View style={styles.previewPhase}>
              {/* AI Notes */}
              {enhancementNotes && (
                <Card style={[styles.notesCard, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Card.Content style={styles.notesContent}>
                    <Sparkles size={18} color={theme.colors.primary} />
                    <View style={styles.notesTextContainer}>
                      <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
                        Enhancement Summary
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                        {enhancementNotes}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* Navigation */}
              <View style={styles.navigation}>
                <Text variant="bodyMedium">
                  Workout {currentPreviewIndex + 1} of {enhancedWorkouts?.length || 0}
                </Text>
                <View style={styles.navButtons}>
                  <TouchableOpacity
                    onPress={goToPreviousWorkout}
                    disabled={currentPreviewIndex === 0}
                    style={[
                      styles.navButton,
                      currentPreviewIndex === 0 && styles.navButtonDisabled,
                    ]}
                  >
                    <ChevronLeft
                      size={24}
                      color={currentPreviewIndex === 0 ? theme.colors.outline : theme.colors.onSurface}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goToNextWorkout}
                    disabled={currentPreviewIndex === (enhancedWorkouts?.length || 1) - 1}
                    style={[
                      styles.navButton,
                      currentPreviewIndex === (enhancedWorkouts?.length || 1) - 1 &&
                        styles.navButtonDisabled,
                    ]}
                  >
                    <ChevronRight
                      size={24}
                      color={
                        currentPreviewIndex === (enhancedWorkouts?.length || 1) - 1
                          ? theme.colors.outline
                          : theme.colors.onSurface
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Comparison */}
              <View style={styles.comparison}>
                {/* Original */}
                <Card style={styles.comparisonCard} mode="outlined">
                  <View style={[styles.cardHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text variant="labelMedium">Original</Text>
                  </View>
                  <Card.Content style={styles.cardContent}>
                    <Text variant="titleSmall" style={styles.workoutTitle}>
                      {currentOriginal?.title || "Untitled"}
                    </Text>
                    <Divider style={styles.cardDivider} />
                    <ScrollView style={styles.workoutBody} nestedScrollEnabled>
                      <Text variant="bodySmall">
                        {currentOriginal?.body || "No content"}
                      </Text>
                    </ScrollView>
                  </Card.Content>
                </Card>

                {/* Enhanced */}
                <Card
                  style={[styles.comparisonCard, { borderColor: theme.colors.primary }]}
                  mode="outlined"
                >
                  <View style={[styles.cardHeader, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                      Enhanced
                    </Text>
                  </View>
                  <Card.Content style={styles.cardContent}>
                    <Text variant="titleSmall" style={styles.workoutTitle}>
                      {currentEnhanced?.title || "Untitled"}
                    </Text>
                    <Divider style={styles.cardDivider} />
                    <ScrollView style={styles.workoutBody} nestedScrollEnabled>
                      <Text variant="bodySmall">{currentEnhanced?.body || "No content"}</Text>
                    </ScrollView>
                  </Card.Content>
                </Card>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderColor: theme.colors.outlineVariant }]}>
          {!previewMode ? (
            <>
              <Button mode="text" onPress={handleClose} disabled={isEnhancing}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleEnhance}
                disabled={isEnhancing || !instructions.trim()}
                icon={isEnhancing ? undefined : () => <Sparkles size={18} color="white" />}
                loading={isEnhancing}
              >
                {isEnhancing ? "Enhancing..." : "Enhance Program"}
              </Button>
            </>
          ) : (
            <>
              <Button mode="text" onPress={handleClose} disabled={isSaving}>
                Discard
              </Button>
              <Button mode="contained" onPress={handleSaveAll} loading={isSaving} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save All Changes"}
              </Button>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  inputPhase: {
    gap: 16,
  },
  label: {
    fontWeight: "600",
  },
  textInput: {
    minHeight: 120,
  },
  infoCard: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 8,
  },
  previewPhase: {
    gap: 16,
  },
  notesCard: {
    marginBottom: 8,
  },
  notesContent: {
    flexDirection: "row",
    gap: 12,
  },
  notesTextContainer: {
    flex: 1,
    gap: 4,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  comparison: {
    gap: 16,
  },
  comparisonCard: {
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardContent: {
    paddingTop: 12,
  },
  workoutTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardDivider: {
    marginBottom: 8,
  },
  workoutBody: {
    maxHeight: height * 0.2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
