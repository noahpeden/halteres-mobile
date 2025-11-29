import { useCallback, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  Menu,
  Searchbar,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import {
  difficulties,
  equipmentList,
  focusAreas,
  gymEquipmentPresets,
  gymTypes,
  workoutFormats,
} from "@/lib/constants/programConfig";

const durationOptions = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 75, label: "75 minutes" },
  { value: 90, label: "90 minutes" },
];

type ProgramDetailsSectionProps = {
  gymType: string;
  difficulty: string;
  selectedEquipment: number[];
  focusArea: string;
  sessionDuration: number;
  selectedFormats: string[];
  onGymTypeChange: (type: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onEquipmentChange: (equipment: number[]) => void;
  onFocusAreaChange: (area: string) => void;
  onDurationChange: (duration: number) => void;
  onFormatsChange: (formats: string[]) => void;
  onFieldBlur: (field: string) => void;
};

export function ProgramDetailsSection({
  gymType,
  difficulty,
  selectedEquipment,
  focusArea,
  sessionDuration,
  selectedFormats,
  onGymTypeChange,
  onDifficultyChange,
  onEquipmentChange,
  onFocusAreaChange,
  onDurationChange,
  onFormatsChange,
  onFieldBlur,
}: ProgramDetailsSectionProps) {
  const theme = useTheme();
  const [gymTypeMenuVisible, setGymTypeMenuVisible] = useState(false);
  const [difficultyMenuVisible, setDifficultyMenuVisible] = useState(false);
  const [focusAreaMenuVisible, setFocusAreaMenuVisible] = useState(false);
  const [durationMenuVisible, setDurationMenuVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState("");

  // When gym type changes, apply equipment preset
  const handleGymTypeChange = useCallback(
    (type: string) => {
      onGymTypeChange(type);
      // Apply preset equipment for this gym type
      const preset = gymEquipmentPresets[type];
      if (preset && preset.length > 0) {
        onEquipmentChange(preset);
      }
      onFieldBlur("gymType");
    },
    [onGymTypeChange, onEquipmentChange, onFieldBlur],
  );

  const handleEquipmentToggle = useCallback(
    (equipmentId: number) => {
      if (selectedEquipment.includes(equipmentId)) {
        onEquipmentChange(selectedEquipment.filter((id) => id !== equipmentId));
      } else {
        onEquipmentChange([...selectedEquipment, equipmentId]);
      }
    },
    [selectedEquipment, onEquipmentChange],
  );

  const handleFormatToggle = useCallback(
    (formatValue: string) => {
      if (selectedFormats.includes(formatValue)) {
        onFormatsChange(selectedFormats.filter((f) => f !== formatValue));
      } else {
        onFormatsChange([...selectedFormats, formatValue]);
      }
      onFieldBlur("workoutFormats");
    },
    [selectedFormats, onFormatsChange, onFieldBlur],
  );

  const filteredEquipment = equipmentList.filter((item) =>
    item.label.toLowerCase().includes(equipmentSearch.toLowerCase()),
  );

  const getSelectedEquipmentLabels = () => {
    return selectedEquipment
      .map((id) => equipmentList.find((e) => e.value === id)?.label)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.primary }]}
        >
          Program Details
        </Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          Configure your training environment and preferences.
        </Text>

        {/* Gym Type */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Gym Type
          </Text>
          <Menu
            visible={gymTypeMenuVisible}
            onDismiss={() => setGymTypeMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setGymTypeMenuVisible(true)}
                style={[styles.dropdown, { borderColor: theme.colors.outline }]}
              >
                <View style={styles.dropdownContent}>
                  <Text>
                    {gymTypes.find((g) => g.value === gymType)?.label ||
                      "Select gym type"}
                  </Text>
                  <Text>▼</Text>
                </View>
              </TouchableRipple>
            }
            contentStyle={styles.menuContent}
          >
            <ScrollView style={styles.menuScroll}>
              {gymTypes.map((type) => (
                <Menu.Item
                  key={type.value}
                  onPress={() => {
                    handleGymTypeChange(type.value);
                    setGymTypeMenuVisible(false);
                  }}
                  title={type.label}
                  titleStyle={
                    gymType === type.value ? { fontWeight: "bold" } : undefined
                  }
                />
              ))}
            </ScrollView>
          </Menu>
        </View>

        {/* Difficulty */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Difficulty
          </Text>
          <Menu
            visible={difficultyMenuVisible}
            onDismiss={() => setDifficultyMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setDifficultyMenuVisible(true)}
                style={[styles.dropdown, { borderColor: theme.colors.outline }]}
              >
                <View style={styles.dropdownContent}>
                  <Text>
                    {difficulties.find((d) => d.value === difficulty)?.label ||
                      "Select difficulty"}
                  </Text>
                  <Text>▼</Text>
                </View>
              </TouchableRipple>
            }
            contentStyle={styles.menuContent}
          >
            {difficulties.map((diff) => (
              <Menu.Item
                key={diff.value}
                onPress={() => {
                  onDifficultyChange(diff.value);
                  setDifficultyMenuVisible(false);
                  onFieldBlur("difficulty");
                }}
                title={diff.label}
                titleStyle={
                  difficulty === diff.value ? { fontWeight: "bold" } : undefined
                }
              />
            ))}
          </Menu>
        </View>

        {/* Equipment Selector */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Equipment Available
          </Text>
          <TouchableRipple
            onPress={() => setEquipmentModalVisible(true)}
            style={[styles.dropdown, { borderColor: theme.colors.outline }]}
          >
            <View style={styles.dropdownContent}>
              <Text numberOfLines={1} style={styles.equipmentText}>
                {selectedEquipment.length > 0
                  ? `${getSelectedEquipmentLabels()}${selectedEquipment.length > 3 ? ` +${selectedEquipment.length - 3} more` : ""}`
                  : "Select equipment"}
              </Text>
              <Text>▼</Text>
            </View>
          </TouchableRipple>
          <Text variant="bodySmall" style={styles.helperText}>
            {selectedEquipment.length} items selected
          </Text>
        </View>

        {/* Focus Area */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Focus Area
          </Text>
          <Menu
            visible={focusAreaMenuVisible}
            onDismiss={() => setFocusAreaMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setFocusAreaMenuVisible(true)}
                style={[styles.dropdown, { borderColor: theme.colors.outline }]}
              >
                <View style={styles.dropdownContent}>
                  <Text>
                    {focusAreas.find((f) => f.value === focusArea)?.label ||
                      "Select focus area"}
                  </Text>
                  <Text>▼</Text>
                </View>
              </TouchableRipple>
            }
            contentStyle={styles.menuContent}
          >
            {focusAreas.map((area) => (
              <Menu.Item
                key={area.value}
                onPress={() => {
                  onFocusAreaChange(area.value);
                  setFocusAreaMenuVisible(false);
                  onFieldBlur("focusArea");
                }}
                title={area.label}
                titleStyle={
                  focusArea === area.value ? { fontWeight: "bold" } : undefined
                }
              />
            ))}
          </Menu>
        </View>

        {/* Session Duration */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Session Duration
          </Text>
          <Menu
            visible={durationMenuVisible}
            onDismiss={() => setDurationMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setDurationMenuVisible(true)}
                style={[styles.dropdown, { borderColor: theme.colors.outline }]}
              >
                <View style={styles.dropdownContent}>
                  <Text>
                    {durationOptions.find((d) => d.value === sessionDuration)
                      ?.label || "Select duration"}
                  </Text>
                  <Text>▼</Text>
                </View>
              </TouchableRipple>
            }
            contentStyle={styles.menuContent}
          >
            {durationOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  onDurationChange(option.value);
                  setDurationMenuVisible(false);
                  onFieldBlur("sessionDuration");
                }}
                title={option.label}
                titleStyle={
                  sessionDuration === option.value
                    ? { fontWeight: "bold" }
                    : undefined
                }
              />
            ))}
          </Menu>
        </View>

        {/* Workout Formats */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Workout Formats
          </Text>
          <View style={styles.chipsContainer}>
            {workoutFormats.map((format) => {
              const isSelected = selectedFormats.includes(format.value);
              return (
                <Chip
                  key={format.value}
                  selected={isSelected}
                  onPress={() => handleFormatToggle(format.value)}
                  style={styles.formatChip}
                  showSelectedOverlay
                >
                  {format.label}
                </Chip>
              );
            })}
          </View>
        </View>
      </Card.Content>

      {/* Equipment Selection Modal */}
      <Modal
        visible={equipmentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setEquipmentModalVisible(false);
          onFieldBlur("equipment");
        }}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Select Equipment
            </Text>
            <IconButton
              icon="close"
              onPress={() => {
                setEquipmentModalVisible(false);
                onFieldBlur("equipment");
              }}
            />
          </View>

          <Searchbar
            placeholder="Search equipment..."
            value={equipmentSearch}
            onChangeText={setEquipmentSearch}
            style={styles.searchBar}
          />

          <View style={styles.equipmentActions}>
            <Button
              mode="text"
              onPress={() =>
                onEquipmentChange(equipmentList.map((e) => e.value))
              }
              compact
            >
              Select All
            </Button>
            <Button mode="text" onPress={() => onEquipmentChange([])} compact>
              Clear All
            </Button>
          </View>

          <Divider />

          <ScrollView style={styles.equipmentList}>
            {filteredEquipment.map((item) => (
              <TouchableRipple
                key={item.value}
                onPress={() => handleEquipmentToggle(item.value)}
                style={styles.equipmentItem}
              >
                <View style={styles.equipmentItemContent}>
                  <Checkbox
                    status={
                      selectedEquipment.includes(item.value)
                        ? "checked"
                        : "unchecked"
                    }
                  />
                  <Text variant="bodyLarge">{item.label}</Text>
                </View>
              </TouchableRipple>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              mode="contained"
              onPress={() => {
                setEquipmentModalVisible(false);
                onFieldBlur("equipment");
              }}
            >
              Done ({selectedEquipment.length} selected)
            </Button>
          </View>
        </View>
      </Modal>
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
  label: {
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
  menuScroll: {
    maxHeight: 280,
  },
  equipmentText: {
    flex: 1,
    marginRight: 8,
  },
  helperText: {
    opacity: 0.6,
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formatChip: {
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    fontWeight: "bold",
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  equipmentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  equipmentList: {
    flex: 1,
  },
  equipmentItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  equipmentItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
});
