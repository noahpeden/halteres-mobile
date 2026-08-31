import { Info, Search } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Menu,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { programTypes } from "@/lib/constants/programConfig";

// Training methodology options matching web app's ProgramTypeSelector
const trainingMethodologies = [
  { value: "crossfit", label: "CrossFit" },
  { value: "strength", label: "Strength Training" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "bodybuilding", label: "Bodybuilding" },
  { value: "olympic_weightlifting", label: "Olympic Weightlifting" },
  { value: "hiit", label: "HIIT" },
  { value: "endurance", label: "Endurance" },
  { value: "functional_fitness", label: "Functional Fitness" },
  { value: "sport_specific", label: "Sport Specific" },
  { value: "rehabilitation", label: "Rehabilitation" },
  { value: "general_fitness", label: "General Fitness" },
];

type ProgramEssentialsProps = {
  name?: string;
  trainingMethodology: string;
  programType: string;
  description: string;
  referenceInput: string;
  onNameChange?: (value: string) => void;
  onTrainingMethodologyChange: (value: string) => void;
  onProgramTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onReferenceInputChange: (value: string) => void;
  onFieldBlur: (field: string) => void;
  onSearchWorkouts?: () => void;
};

export function ProgramEssentials({
  name,
  trainingMethodology,
  programType,
  description,
  referenceInput,
  onNameChange,
  onTrainingMethodologyChange,
  onProgramTypeChange,
  onDescriptionChange,
  onReferenceInputChange,
  onFieldBlur,
  onSearchWorkouts,
}: ProgramEssentialsProps) {
  const theme = useTheme();
  const [methodologyMenuVisible, setMethodologyMenuVisible] = useState(false);
  const [periodizationMenuVisible, setPeriodizationMenuVisible] =
    useState(false);

  // Local state for debounced inputs
  const [localDescription, setLocalDescription] = useState(description);
  const [localReferenceInput, setLocalReferenceInput] =
    useState(referenceInput);
  const [localName, setLocalName] = useState(name || "");

  const descriptionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const referenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const nameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalDescription(description);
  }, [description]);

  useEffect(() => {
    setLocalReferenceInput(referenceInput);
  }, [referenceInput]);
  useEffect(() => {
    setLocalName(name || "");
  }, [name]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (descriptionTimeoutRef.current)
        clearTimeout(descriptionTimeoutRef.current);
      if (referenceTimeoutRef.current)
        clearTimeout(referenceTimeoutRef.current);
    };
  }, []);

  const handleNameChange = useCallback(
    (text: string) => {
      setLocalName(text);
      if (nameTimeoutRef.current) clearTimeout(nameTimeoutRef.current);
      nameTimeoutRef.current = setTimeout(() => {
        onNameChange?.(text);
      }, 300);
    },
    [onNameChange],
  );

  const handleNameBlur = useCallback(() => {
    if (nameTimeoutRef.current) {
      clearTimeout(nameTimeoutRef.current);
      nameTimeoutRef.current = null;
    }
    onNameChange?.(localName);
    onFieldBlur("name");
  }, [localName, onNameChange, onFieldBlur]);

  const handleDescriptionChange = useCallback(
    (text: string) => {
      setLocalDescription(text);
      if (descriptionTimeoutRef.current)
        clearTimeout(descriptionTimeoutRef.current);
      descriptionTimeoutRef.current = setTimeout(() => {
        onDescriptionChange(text);
      }, 500);
    },
    [onDescriptionChange],
  );

  const handleDescriptionBlur = useCallback(() => {
    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
      descriptionTimeoutRef.current = null;
    }
    onDescriptionChange(localDescription);
    onFieldBlur("description");
  }, [localDescription, onDescriptionChange, onFieldBlur]);

  const handleReferenceInputChange = useCallback(
    (text: string) => {
      setLocalReferenceInput(text);
      if (referenceTimeoutRef.current)
        clearTimeout(referenceTimeoutRef.current);
      referenceTimeoutRef.current = setTimeout(() => {
        onReferenceInputChange(text);
      }, 500);
    },
    [onReferenceInputChange],
  );

  const handleReferenceInputBlur = useCallback(() => {
    if (referenceTimeoutRef.current) {
      clearTimeout(referenceTimeoutRef.current);
      referenceTimeoutRef.current = null;
    }
    onReferenceInputChange(localReferenceInput);
    onFieldBlur("referenceInput");
  }, [localReferenceInput, onReferenceInputChange, onFieldBlur]);

  const selectedMethodology = trainingMethodologies.find(
    (m) => m.value === trainingMethodology,
  );
  const selectedProgramType = programTypes.find((p) => p.value === programType);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          Essentials
        </Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          The writer treats this as the brief — methodology, influences, and how
          you already train.
        </Text>

        {/* Training Methodology */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text variant="labelLarge">
              Methodology (Overall Program Approach)
            </Text>
            <Info size={16} color={theme.colors.primary} />
          </View>
          <Menu
            visible={methodologyMenuVisible}
            onDismiss={() => setMethodologyMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setMethodologyMenuVisible(true)}
                style={[styles.dropdown, { borderColor: theme.colors.outline }]}
              >
                <View style={styles.dropdownContent}>
                  <Text>
                    {selectedMethodology?.label || "Select methodology"}
                  </Text>
                  <Text>▼</Text>
                </View>
              </TouchableRipple>
            }
            contentStyle={styles.menuContent}
          >
            {trainingMethodologies.map((method) => (
              <Menu.Item
                key={method.value}
                onPress={() => {
                  onTrainingMethodologyChange(method.value);
                  setMethodologyMenuVisible(false);
                  onFieldBlur("trainingMethodology");
                }}
                title={method.label}
                titleStyle={
                  trainingMethodology === method.value
                    ? { fontWeight: "bold" }
                    : undefined
                }
              />
            ))}
          </Menu>
          <Text variant="bodySmall" style={styles.helperText}>
            Select the overall approach that will guide your program's structure
            and progression.
          </Text>
        </View>

        {/* Periodization Type */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge">Periodization Type</Text>
          <Menu
            visible={periodizationMenuVisible}
            onDismiss={() => setPeriodizationMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setPeriodizationMenuVisible(true)}
                style={[styles.dropdown, { borderColor: theme.colors.outline }]}
              >
                <View style={styles.dropdownContent}>
                  <Text>
                    {selectedProgramType?.label || "Select periodization type"}
                  </Text>
                  <Text>▼</Text>
                </View>
              </TouchableRipple>
            }
            contentStyle={styles.menuContent}
          >
            {programTypes.map((type) => (
              <Menu.Item
                key={type.value}
                onPress={() => {
                  onProgramTypeChange(type.value);
                  setPeriodizationMenuVisible(false);
                  onFieldBlur("programType");
                }}
                title={type.label}
                titleStyle={
                  programType === type.value
                    ? { fontWeight: "bold" }
                    : undefined
                }
              />
            ))}
          </Menu>
        </View>

        {/* Program Name */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text variant="labelLarge">Program Name</Text>
            <Info size={16} color={theme.colors.primary} />
          </View>
          <TextInput
            mode="outlined"
            value={localName}
            onChangeText={handleNameChange}
            onBlur={handleNameBlur}
            placeholder="e.g., Strength & Engine Block"
            style={styles.textArea}
          />
        </View>

        {/* Program Description */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text variant="labelLarge">Program Description</Text>
            <Info size={16} color={theme.colors.primary} />
          </View>
          <TextInput
            mode="outlined"
            value={localDescription}
            onChangeText={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            placeholder="Enter a description of your program (e.g., 'Intro to strength training, 4x4 program')"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        {/* Previous Workout/Program Input */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelRow}>
            <Text variant="labelLarge">
              Previous Workout/Program (Optional)
            </Text>
            <Info size={16} color={theme.colors.primary} />
          </View>
          <TextInput
            mode="outlined"
            value={localReferenceInput}
            onChangeText={handleReferenceInputChange}
            onBlur={handleReferenceInputBlur}
            placeholder="Paste your own workout text here (e.g., a specific WOD, a previous program structure)"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
          <Text variant="bodySmall" style={styles.helperText}>
            We use this for Retrieval Augmented Generation (RAG) to match
            relevant workouts.
          </Text>
          {onSearchWorkouts && (
            <Button
              mode="outlined"
              onPress={onSearchWorkouts}
              style={styles.searchButton}
              icon={() => <Search size={18} color={theme.colors.primary} />}
            >
              Search Reference Workouts
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
  },
  dropdownContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuContent: {
    maxHeight: 300,
  },
  helperText: {
    opacity: 0.6,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: "transparent",
  },
  searchButton: {
    marginTop: 8,
  },
});
