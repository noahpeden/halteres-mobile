import { Modal, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  IconButton,
  List,
  Text,
  useTheme,
} from "react-native-paper";

type ValidationItem = {
  label: string;
  value: string;
  isValid: boolean;
  errorMessage?: string;
};

type GenerationConfirmModalProps = {
  visible: boolean;
  isRegeneration: boolean;
  validationItems: ValidationItem[];
  existingWorkoutCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function GenerationConfirmModal({
  visible,
  isRegeneration,
  validationItems,
  existingWorkoutCount,
  onConfirm,
  onCancel,
}: GenerationConfirmModalProps) {
  const theme = useTheme();

  const hasErrors = validationItems.some((item) => !item.isValid);
  const errorCount = validationItems.filter((item) => !item.isValid).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            {isRegeneration ? "Regenerate Program" : "Generate Program"}
          </Text>
          <IconButton icon="close" onPress={onCancel} />
        </View>

        <Divider />

        <ScrollView style={styles.content}>
          {/* Regeneration Warning */}
          {isRegeneration && existingWorkoutCount > 0 && (
            <View
              style={[
                styles.warningBox,
                { backgroundColor: `${theme.colors.error}15` },
              ]}
            >
              <Text
                variant="titleSmall"
                style={[styles.warningTitle, { color: theme.colors.error }]}
              >
                ⚠️ Warning: Existing Workouts Will Be Deleted
              </Text>
              <Text variant="bodyMedium" style={styles.warningText}>
                This program already has {existingWorkoutCount} workout
                {existingWorkoutCount !== 1 ? "s" : ""}. Regenerating will
                delete all existing workouts and create new ones.
              </Text>
            </View>
          )}

          {/* Validation Summary */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Program Configuration
            </Text>
            {hasErrors && (
              <Text
                variant="bodySmall"
                style={[styles.errorSummary, { color: theme.colors.error }]}
              >
                {errorCount} required field{errorCount !== 1 ? "s" : ""} missing
              </Text>
            )}
          </View>

          {/* Validation Items */}
          <View style={styles.validationList}>
            {validationItems.map((item) => (
              <List.Item
                key={item.label}
                title={item.label}
                description={item.isValid ? item.value : item.errorMessage}
                descriptionStyle={
                  !item.isValid
                    ? { color: theme.colors.error }
                    : { opacity: 0.7 }
                }
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={item.isValid ? "check-circle" : "alert-circle"}
                    color={
                      item.isValid ? theme.colors.primary : theme.colors.error
                    }
                  />
                )}
                style={styles.validationItem}
              />
            ))}
          </View>

          {/* Generation Info */}
          {!hasErrors && (
            <View
              style={[
                styles.infoBox,
                { backgroundColor: `${theme.colors.primary}10` },
              ]}
            >
              <Text variant="bodyMedium" style={styles.infoText}>
                Generation may take several minutes depending on the program
                length. You can monitor progress and workouts will appear as
                they are created.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            disabled={hasErrors}
            style={styles.confirmButton}
            buttonColor={
              isRegeneration ? theme.colors.error : theme.colors.primary
            }
          >
            {isRegeneration ? "Regenerate" : "Generate"}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  warningText: {
    opacity: 0.9,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  errorSummary: {
    marginTop: 4,
  },
  validationList: {
    marginBottom: 16,
  },
  validationItem: {
    paddingVertical: 4,
  },
  infoBox: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    opacity: 0.9,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
