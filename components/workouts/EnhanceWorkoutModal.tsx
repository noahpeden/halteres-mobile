import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";

type EnhancedWorkout = {
  title: string;
  description: string;
  notes?: string;
};

type EnhanceWorkoutModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onEnhance: (instructions: string) => Promise<void>;
  onSave: () => void;
  onDiscard: () => void;
  isEnhancing: boolean;
  enhancedWorkout: EnhancedWorkout | null;
  originalTitle: string;
  originalBody: string;
};

export function EnhanceWorkoutModal({
  visible,
  onDismiss,
  onEnhance,
  onSave,
  onDiscard,
  isEnhancing,
  enhancedWorkout,
  originalTitle,
  originalBody,
}: EnhanceWorkoutModalProps) {
  const theme = useTheme();
  const [instructions, setInstructions] = useState("");
  const [showPreview, setShowPreview] = useState<"original" | "enhanced">(
    "enhanced",
  );

  const suggestionChips = [
    "Make it harder",
    "Make it easier",
    "Add more volume",
    "Focus on strength",
    "Add mobility work",
    "Reduce time",
    "Add conditioning",
    "More compound movements",
  ];

  const handleEnhance = async () => {
    if (!instructions.trim()) return;
    await onEnhance(instructions);
  };

  const handleSave = () => {
    setInstructions("");
    onSave();
  };

  const handleDiscard = () => {
    setInstructions("");
    onDiscard();
  };

  const handleDismiss = () => {
    setInstructions("");
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Enhance Workout
        </Text>

        {!enhancedWorkout ? (
          <>
            <Text variant="bodyMedium" style={styles.description}>
              Describe how you'd like to modify this workout. The AI will
              consider your training methodology and available equipment.
            </Text>

            <TextInput
              label="Enhancement Instructions"
              value={instructions}
              onChangeText={setInstructions}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="e.g., Make it more challenging, add core work, reduce rest times..."
              style={styles.input}
            />

            <Text variant="labelMedium" style={styles.suggestionsLabel}>
              Quick suggestions:
            </Text>
            <View style={styles.chipsContainer}>
              {suggestionChips.map((suggestion) => (
                <Chip
                  key={suggestion}
                  mode="outlined"
                  onPress={() => setInstructions(suggestion)}
                  style={styles.chip}
                  compact
                >
                  {suggestion}
                </Chip>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleDismiss}
                style={styles.button}
                disabled={isEnhancing}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleEnhance}
                style={styles.button}
                disabled={!instructions.trim() || isEnhancing}
                loading={isEnhancing}
              >
                Enhance
              </Button>
            </View>

            {isEnhancing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" />
                <Text variant="bodySmall" style={styles.loadingText}>
                  AI is enhancing your workout...
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.previewToggle}>
              <Button
                mode={showPreview === "original" ? "contained" : "outlined"}
                onPress={() => setShowPreview("original")}
                compact
                style={styles.toggleButton}
              >
                Original
              </Button>
              <Button
                mode={showPreview === "enhanced" ? "contained" : "outlined"}
                onPress={() => setShowPreview("enhanced")}
                compact
                style={styles.toggleButton}
              >
                Enhanced
              </Button>
            </View>

            <ScrollView style={styles.previewScroll}>
              {showPreview === "original" ? (
                <Card style={styles.previewCard} mode="outlined">
                  <Card.Title
                    title={originalTitle}
                    titleVariant="titleMedium"
                  />
                  <Card.Content>
                    <Text variant="bodyMedium">{originalBody}</Text>
                  </Card.Content>
                </Card>
              ) : (
                <Card
                  style={[
                    styles.previewCard,
                    { borderColor: theme.colors.primary },
                  ]}
                  mode="outlined"
                >
                  <Card.Title
                    title={enhancedWorkout.title}
                    titleVariant="titleMedium"
                    subtitle="Enhanced"
                    subtitleStyle={{ color: theme.colors.primary }}
                  />
                  <Card.Content>
                    <Text variant="bodyMedium">
                      {enhancedWorkout.description}
                    </Text>
                    {enhancedWorkout.notes && (
                      <View style={styles.notesContainer}>
                        <Text
                          variant="labelMedium"
                          style={{ color: theme.colors.primary }}
                        >
                          AI Notes:
                        </Text>
                        <Text variant="bodySmall" style={styles.notes}>
                          {enhancedWorkout.notes}
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              )}
            </ScrollView>

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleDiscard}
                style={styles.button}
                textColor={theme.colors.error}
              >
                Discard
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
              >
                Save Enhancement
              </Button>
            </View>
          </>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: "85%",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    opacity: 0.8,
  },
  input: {
    marginBottom: 12,
  },
  suggestionsLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  button: {
    minWidth: 100,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  loadingText: {
    opacity: 0.7,
  },
  previewToggle: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
  },
  previewScroll: {
    maxHeight: 350,
    marginBottom: 16,
  },
  previewCard: {
    borderWidth: 1,
  },
  notesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
  },
  notes: {
    marginTop: 4,
    fontStyle: "italic",
  },
});
