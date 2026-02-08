import { Monitor } from "lucide-react-native";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { WorkoutSection } from "@/lib/utils/workoutParser";

type SectionButtonsProps = {
  sections: WorkoutSection[];
  onOpenSection: (id: number) => void;
};

/**
 * Horizontal scrollable row of buttons for each workout section
 */
export function SectionButtons({ sections, onOpenSection }: SectionButtonsProps) {
  const theme = useTheme();

  if (!sections || sections.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Monitor size={16} color={theme.colors.primary} />
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          TV Display Mode
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => onOpenSection(section.id)}
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Monitor size={14} color={theme.colors.primary} />
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onPrimaryContainer }}
              numberOfLines={1}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
