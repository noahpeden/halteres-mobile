import { useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Edit2,
  FileText,
  MoreVertical,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Chip, IconButton, Menu, Text, useTheme } from "react-native-paper";
import type { Workout } from "@/hooks/useProgramWorkoutsMobile";
import { brandColors } from "@/app/_layout";

type WorkoutCardProps = {
  workout: Workout;
  programId: string;
  onDelete?: (workoutId: string) => void;
  onToggleComplete?: (workoutId: string, completed: boolean) => void;
  onEdit?: (workoutId: string) => void;
  onChangeDate?: (workoutId: string, currentDate?: string) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WorkoutCard({
  workout,
  programId,
  onDelete,
  onToggleComplete,
  onEdit,
  onChangeDate,
}: WorkoutCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

  const getBodyPreview = (body: string | null) => {
    if (!body) return "";
    // Remove markdown formatting and get first few lines
    const cleanBody = body
      .replace(/[#*_`]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return cleanBody.length > 150 ? `${cleanBody.slice(0, 150)}...` : cleanBody;
  };

  // Check if this is a skeleton workout
  const isSkeleton = workout.generation_status === "skeleton";
  const displayBody = workout.body || workout.body_skeleton;

  const handleView = () => {
    setMenuVisible(false);
    // Navigate to workout detail view
    router.push(`/programs/${programId}/workout/${workout.id}`);
  };

  const handleCardPress = () => {
    router.push(`/programs/${programId}/workout/${workout.id}`);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (onEdit) {
      onEdit(workout.id);
    } else {
      // Default: navigate to detail screen with edit mode
      router.push(`/programs/${programId}/workout/${workout.id}?edit=true`);
    }
  };

  const handleChangeDate = () => {
    setMenuVisible(false);
    onChangeDate?.(workout.id, workout.scheduled_date);
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
    <AnimatedPressable
      onPress={handleCardPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={animatedStyle}
    >
      <View style={[styles.card, workout.completed && styles.cardCompleted, isSkeleton && styles.cardSkeleton]}>
        {/* Status indicator bar */}
        <View
          style={[
            styles.statusBar,
            workout.completed
              ? styles.statusBarCompleted
              : isSkeleton
                ? styles.statusBarSkeleton
                : styles.statusBarPending,
          ]}
        />

        <View style={styles.content}>
          {/* Header with title and menu */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              {/* Skeleton indicator */}
              {isSkeleton && (
                <View style={styles.skeletonBadge}>
                  <FileText
                    size={14}
                    color={brandColors.helpfulOrange.DEFAULT}
                  />
                  <Text variant="labelSmall" style={styles.skeletonBadgeText}>
                    Structure Only
                  </Text>
                </View>
              )}
              {workout.completed && (
                <View style={styles.completedBadge}>
                  <CheckCircle
                    size={14}
                    color={brandColors.thrivingGreen.DEFAULT}
                    fill={brandColors.thrivingGreen.lightest}
                  />
                  <Text variant="labelSmall" style={styles.completedBadgeText}>
                    Completed
                  </Text>
                </View>
              )}
              <Text
                variant="titleMedium"
                style={[
                  styles.title,
                  workout.completed && styles.completedTitle,
                ]}
                numberOfLines={2}
              >
                {workout.title}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <ChevronRight size={20} color={brandColors.practicalGray.light} />
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon={() => (
                      <MoreVertical
                        size={18}
                        color={brandColors.practicalGray.DEFAULT}
                      />
                    )}
                    size={20}
                    onPress={(e) => {
                      e.stopPropagation();
                      setMenuVisible(true);
                    }}
                    style={styles.menuButton}
                  />
                }
              >
                <Menu.Item
                  onPress={handleView}
                  title="View Details"
                  leadingIcon="eye"
                />
                <Menu.Item
                  onPress={handleEdit}
                  title="Edit"
                  leadingIcon="pencil"
                />
                <Menu.Item
                  onPress={handleChangeDate}
                  title="Change Date"
                  leadingIcon="calendar"
                />
                <Menu.Item
                  onPress={handleToggleComplete}
                  title={
                    workout.completed ? "Mark Incomplete" : "Mark Complete"
                  }
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
          </View>

          {/* Date chip */}
          {workout.scheduled_date && (
            <View style={styles.dateContainer}>
              <Calendar
                size={14}
                color={brandColors.smartBlue.DEFAULT}
                strokeWidth={2}
              />
              <Text variant="labelSmall" style={styles.dateText}>
                {getDayOfWeek(workout.scheduled_date)} •{" "}
                {formatDate(workout.scheduled_date)}
              </Text>
            </View>
          )}

          {/* Body preview */}
          {displayBody && (
            <Text variant="bodySmall" style={styles.preview} numberOfLines={2}>
              {getBodyPreview(displayBody)}
            </Text>
          )}

          {/* Tags */}
          {workout.tags && workout.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {workout.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text variant="labelSmall" style={styles.tagText}>
                    {tag}
                  </Text>
                </View>
              ))}
              {workout.tags.length > 3 && (
                <Text variant="labelSmall" style={styles.moreTags}>
                  +{workout.tags.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCompleted: {
    backgroundColor: "#fafafa",
  },
  cardSkeleton: {
    backgroundColor: "#fffbf5",
  },
  statusBar: {
    width: 4,
  },
  statusBarPending: {
    backgroundColor: brandColors.smartBlue.DEFAULT,
  },
  statusBarCompleted: {
    backgroundColor: brandColors.thrivingGreen.DEFAULT,
  },
  statusBarSkeleton: {
    backgroundColor: brandColors.helpfulOrange.DEFAULT,
  },
  content: {
    flex: 1,
    padding: 16,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    margin: -8,
  },
  skeletonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  skeletonBadgeText: {
    color: brandColors.helpfulOrange.DEFAULT,
    fontWeight: "600",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  completedBadgeText: {
    color: brandColors.thrivingGreen.DEFAULT,
    fontWeight: "600",
  },
  title: {
    fontWeight: "700",
    color: "#121212",
    lineHeight: 22,
  },
  completedTitle: {
    color: brandColors.practicalGray.DEFAULT,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: brandColors.smartBlue.container,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    color: brandColors.smartBlue.dark,
    fontWeight: "500",
  },
  preview: {
    marginTop: 12,
    color: brandColors.practicalGray.DEFAULT,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    alignItems: "center",
    gap: 6,
  },
  tagChip: {
    backgroundColor: "#f3f4f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: brandColors.practicalGray.medium,
    fontWeight: "500",
  },
  moreTags: {
    color: brandColors.practicalGray.light,
    fontWeight: "500",
  },
});
