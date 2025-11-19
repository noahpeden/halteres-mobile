import { useRouter } from "expo-router";
import { Calendar, Dumbbell, User } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import type { Program } from "@/hooks/usePrograms";

interface ProgramCardProps {
  program: any; // Use any for now to support the new hook structure or update Program type
}

export function ProgramCard({ program }: ProgramCardProps) {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = () => {
    router.push(`/(app)/programs/${program.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            {program.name}
          </Text>

          {program.description ? (
            <Text
              variant="bodySmall"
              style={[
                styles.description,
                { color: theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={2}
            >
              {program.description}
            </Text>
          ) : null}

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={theme.colors.onSurfaceVariant} />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {program.duration_weeks} weeks
              </Text>
            </View>

            {program.client_name && (
              <View style={styles.metaItem}>
                <User size={14} color={theme.colors.onSurfaceVariant} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {program.client_name}
                </Text>
              </View>
            )}

            {program.workout_count !== undefined && (
              <View style={styles.metaItem}>
                <Dumbbell size={14} color={theme.colors.onSurfaceVariant} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {program.workout_count} workouts
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
  },
  title: {
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
