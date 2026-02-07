import { Calendar } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  Button,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

type DatePickerModalProps = {
  visible: boolean;
  currentDate: string | undefined;
  onDismiss: () => void;
  onSave: (newDate: string) => Promise<void>;
  title?: string;
};

export function DatePickerModal({
  visible,
  currentDate,
  onDismiss,
  onSave,
  title = "Change Date",
}: DatePickerModalProps) {
  const theme = useTheme();
  const [dateInput, setDateInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize date input when modal opens
  useEffect(() => {
    if (visible && currentDate) {
      // Format date as YYYY-MM-DD
      const date = new Date(currentDate);
      if (!Number.isNaN(date.getTime())) {
        setDateInput(date.toISOString().split("T")[0]);
      } else {
        setDateInput("");
      }
    } else if (visible) {
      // Default to today if no current date
      setDateInput(new Date().toISOString().split("T")[0]);
    }
    setError(null);
  }, [visible, currentDate]);

  const validateDate = (dateString: string): boolean => {
    // Check format YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    // Check if it's a valid date
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime());
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString || !validateDate(dateString)) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    if (!dateInput) {
      setError("Please enter a date");
      return;
    }

    if (!validateDate(dateInput)) {
      setError("Invalid date format. Use YYYY-MM-DD");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(dateInput);
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save date");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    if (!isSaving) {
      setDateInput("");
      setError(null);
      onDismiss();
    }
  };

  // Quick date buttons
  const setToday = () => {
    setDateInput(new Date().toISOString().split("T")[0]);
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDateInput(tomorrow.toISOString().split("T")[0]);
  };

  const addDays = (days: number) => {
    const current = dateInput ? new Date(dateInput) : new Date();
    current.setDate(current.getDate() + days);
    setDateInput(current.toISOString().split("T")[0]);
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
        <View style={styles.header}>
          <Calendar size={24} color={theme.colors.primary} />
          <Text variant="titleLarge" style={styles.title}>
            {title}
          </Text>
        </View>

        {/* Current date display */}
        {dateInput && validateDate(dateInput) && (
          <View
            style={[
              styles.datePreview,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onPrimaryContainer }}
            >
              {formatDisplayDate(dateInput)}
            </Text>
          </View>
        )}

        {/* Date input */}
        <TextInput
          mode="outlined"
          label="Date (YYYY-MM-DD)"
          value={dateInput}
          onChangeText={(text) => {
            setDateInput(text);
            setError(null);
          }}
          placeholder="2024-01-15"
          keyboardType={
            Platform.OS === "ios" ? "numbers-and-punctuation" : "default"
          }
          error={!!error}
          style={styles.input}
        />

        {error && (
          <Text variant="bodySmall" style={{ color: theme.colors.error }}>
            {error}
          </Text>
        )}

        {/* Quick date buttons */}
        <View style={styles.quickButtons}>
          <Button
            mode="outlined"
            compact
            onPress={setToday}
            style={styles.quickButton}
          >
            Today
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={setTomorrow}
            style={styles.quickButton}
          >
            Tomorrow
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => addDays(7)}
            style={styles.quickButton}
          >
            +1 Week
          </Button>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleDismiss}
            disabled={isSaving}
            style={styles.actionButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || !dateInput}
            style={styles.actionButton}
          >
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
  },
  datePreview: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  input: {
    marginBottom: 8,
  },
  quickButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  quickButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
