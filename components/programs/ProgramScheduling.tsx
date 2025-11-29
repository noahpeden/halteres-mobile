import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Card,
  Chip,
  Menu,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { daysOfWeek } from "@/lib/constants/programConfig";

const weekOptions = [1, 2, 3, 4, 5, 6, 7, 8];

type ProgramSchedulingProps = {
  selectedDays: string[];
  numberOfWeeks: number;
  startDate: string;
  endDate: string;
  onDayToggle: (day: string) => void;
  onWeeksChange: (weeks: number) => void;
  onStartDateChange: (date: string) => void;
  onFieldBlur: (field: string) => void;
};

export function ProgramScheduling({
  selectedDays,
  numberOfWeeks,
  startDate,
  endDate,
  onDayToggle,
  onWeeksChange,
  onStartDateChange,
  onFieldBlur,
}: ProgramSchedulingProps) {
  const theme = useTheme();
  const [weeksMenuVisible, setWeeksMenuVisible] = useState(false);

  const handleDayPress = (dayValue: string) => {
    onDayToggle(dayValue);
    onFieldBlur("daysOfWeek");
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    // Ensure proper format for date input
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.primary }]}
        >
          Scheduling
        </Text>
        <Text variant="bodySmall" style={styles.sectionSubtitle}>
          Choose the length of your program and the days of the week you'll have
          sessions on.
        </Text>

        {/* Days of Week Selector */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Days of Week
          </Text>
          <View style={styles.chipsContainer}>
            {daysOfWeek.map((day) => {
              const isSelected = selectedDays.includes(day.value);
              return (
                <Chip
                  key={day.value}
                  selected={isSelected}
                  onPress={() => handleDayPress(day.value)}
                  style={styles.dayChip}
                  showSelectedOverlay
                >
                  {day.label}
                </Chip>
              );
            })}
          </View>
          <Text variant="bodySmall" style={styles.helperText}>
            {selectedDays.length} day{selectedDays.length !== 1 ? "s" : ""}{" "}
            selected
          </Text>
        </View>

        {/* Number of Weeks */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Weeks
          </Text>
          <Menu
            visible={weeksMenuVisible}
            onDismiss={() => setWeeksMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setWeeksMenuVisible(true)}
                style={[styles.dropdown, { borderColor: theme.colors.outline }]}
              >
                <View style={styles.dropdownContent}>
                  <Text>
                    {numberOfWeeks} {numberOfWeeks === 1 ? "week" : "weeks"}
                  </Text>
                  <Text>▼</Text>
                </View>
              </TouchableRipple>
            }
            contentStyle={styles.menuContent}
          >
            {weekOptions.map((num) => (
              <Menu.Item
                key={num}
                onPress={() => {
                  onWeeksChange(num);
                  setWeeksMenuVisible(false);
                  onFieldBlur("numberOfWeeks");
                }}
                title={`${num} ${num === 1 ? "week" : "weeks"}`}
                titleStyle={
                  numberOfWeeks === num ? { fontWeight: "bold" } : undefined
                }
              />
            ))}
          </Menu>
          <Text variant="bodySmall" style={styles.helperText}>
            Maximum 8 weeks per program
          </Text>
        </View>

        {/* Start Date */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            Start Date
          </Text>
          <TextInput
            mode="outlined"
            value={formatDateForInput(startDate)}
            onChangeText={(text) => {
              onStartDateChange(text);
            }}
            onBlur={() => onFieldBlur("startDate")}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />
          <Text variant="bodySmall" style={styles.helperText}>
            Enter date in format YYYY-MM-DD (e.g., 2024-01-15)
          </Text>
        </View>

        {/* End Date (Calculated) */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            End Date (Calculated)
          </Text>
          <TextInput
            mode="outlined"
            value={formatDateForInput(endDate)}
            editable={false}
            style={[styles.input, styles.disabledInput]}
          />
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
  label: {
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    marginBottom: 4,
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
  input: {
    backgroundColor: "transparent",
  },
  disabledInput: {
    opacity: 0.6,
  },
});
