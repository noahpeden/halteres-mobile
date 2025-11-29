import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  Card,
  Chip,
  IconButton,
  Menu,
  Text,
  useTheme,
} from "react-native-paper";
import type { Workout } from "@/hooks/useProgramWorkoutsMobile";

type WorkoutCardProps = {
  workout: Workout;
  programId: string;
  onDelete?: (workoutId: string) => void;
  onToggleComplete?: (workoutId: string, completed: boolean) => void;
};

export function WorkoutCard({
  workout,
  programId,
  onDelete,
  onToggleComplete,
}: WorkoutCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getDayOfWeek = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  const getBodyPreview = (body: string) => {
    // Remove markdown formatting and get first few lines
    const cleanBody = body
      .replace(/[#*_`]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return cleanBody.length > 150 ? `${cleanBody.slice(0, 150)}...` : cleanBody;
  };

  const handleView = () => {
    setMenuVisible(false);
    // Navigate to workout detail view
    router.push(`/programs/${programId}/workout/${workout.id}`);
  };

  const handleCardPress = () => {
    router.push(`/programs/${programId}/workout/${workout.id}`);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete?.(workout.id);
  };

  const handleToggleComplete = () => {
    setMenuVisible(false);
    onToggleComplete?.(workout.id, !workout.completed);
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
      <Card
        style={[
          styles.card,
          workout.completed && {
            opacity: 0.7,
            borderLeftColor: theme.colors.primary,
            borderLeftWidth: 3,
          },
        ]}
        mode="outlined"
      >
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text
                variant="titleMedium"
                style={[
                  styles.title,
                  workout.completed && styles.completedTitle,
                ]}
              >
                {workout.title}
              </Text>
              {workout.scheduled_date && (
                <Text variant="bodySmall" style={styles.date}>
                  {getDayOfWeek(workout.scheduled_date)} •{" "}
                  {formatDate(workout.scheduled_date)}
                </Text>
              )}
            </View>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={handleView}
                title="View Details"
                leadingIcon="eye"
              />
              <Menu.Item
                onPress={handleToggleComplete}
                title={workout.completed ? "Mark Incomplete" : "Mark Complete"}
                leadingIcon={
                  workout.completed
                    ? "close-circle-outline"
                    : "check-circle-outline"
                }
              />
              <Menu.Item
                onPress={handleDelete}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          {workout.body && (
            <Text variant="bodyMedium" style={styles.preview}>
              {getBodyPreview(workout.body)}
            </Text>
          )}

          {workout.tags && workout.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {workout.tags.slice(0, 3).map((tag) => (
                <Chip key={tag} mode="outlined" compact style={styles.tag}>
                  {tag}
                </Chip>
              ))}
              {workout.tags.length > 3 && (
                <Text variant="bodySmall" style={styles.moreTags}>
                  +{workout.tags.length - 3} more
                </Text>
              )}
            </View>
          )}

          {workout.completed && workout.completed_at && (
            <Text variant="bodySmall" style={styles.completedAt}>
              Completed {formatDate(workout.completed_at)}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: "600",
  },
  completedTitle: {
    textDecorationLine: "line-through",
  },
  date: {
    opacity: 0.7,
    marginTop: 2,
  },
  preview: {
    marginTop: 8,
    opacity: 0.8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    alignItems: "center",
    gap: 6,
  },
  tag: {
    height: 28,
  },
  moreTags: {
    opacity: 0.6,
    marginLeft: 4,
  },
  completedAt: {
    marginTop: 8,
    opacity: 0.6,
    fontStyle: "italic",
  },
});
