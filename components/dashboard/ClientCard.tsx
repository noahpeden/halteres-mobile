import { brandColors } from "@/app/_layout";
import type { Client } from "@/hooks/useClients";
import {
  ChevronRight,
  Edit2,
  Trash2,
  Trophy,
  User,
  Users,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Text } from "react-native-paper";

interface ClientCardProps {
  client: Client;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClientCard({
  client,
  onPress,
  onEdit,
  onDelete,
}: ClientCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isClient = client.type === "CLIENT";
  const accentColor = isClient
    ? brandColors.smartBlue
    : brandColors.thrivingGreen;

  // Format metrics summary for CLIENT type
  const metricsCount = [
    client.bench_1rm,
    client.squat_1rm,
    client.deadlift_1rm,
    client.weight_kg,
    client.height_cm,
  ].filter(Boolean).length;

  // Format class metrics summary for CLASS type
  const hasClassMetrics = !isClient && (
    client.class_size ||
    client.average_age ||
    client.has_elite_athletes
  );

  return (
    <AnimatedPressable
      onPress={onPress || onEdit}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      style={animatedStyle}
    >
      <View style={styles.card}>
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor.DEFAULT }]} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {isClient ? (
                <User size={20} color={accentColor.DEFAULT} strokeWidth={2} />
              ) : (
                <Users size={20} color={accentColor.DEFAULT} strokeWidth={2} />
              )}
            </View>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.title}>
                {client.name}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: accentColor.container }]}>
                <Text style={[styles.typeBadgeText, { color: accentColor.dark }]}>
                  {isClient ? "Client" : "Class"}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              {onEdit && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Edit2 size={16} color={brandColors.smartBlue.DEFAULT} />
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={16} color="#dc2626" />
                </Pressable>
              )}
              <ChevronRight size={18} color={brandColors.practicalGray.light} />
            </View>
          </View>

          {/* Metrics summary for clients */}
          {isClient && metricsCount > 0 && (
            <View style={styles.metricsRow}>
              <Text variant="bodySmall" style={styles.metricsText}>
                {metricsCount} metric{metricsCount !== 1 ? "s" : ""} recorded
              </Text>
            </View>
          )}

          {/* Class metrics summary */}
          {!isClient && hasClassMetrics && (
            <View style={styles.metricsRow}>
              <View style={styles.classMetricsContainer}>
                {client.class_size && (
                  <View style={styles.classMetricItem}>
                    <Users size={12} color={brandColors.practicalGray.DEFAULT} />
                    <Text variant="bodySmall" style={styles.classMetricText}>
                      {client.class_size} athletes
                    </Text>
                  </View>
                )}
                {client.average_age && (
                  <View style={styles.classMetricItem}>
                    <Text variant="bodySmall" style={styles.classMetricText}>
                      Avg {client.average_age} yrs
                    </Text>
                  </View>
                )}
                {client.has_elite_athletes && (
                  <View style={styles.eliteBadge}>
                    <Trophy size={10} color={brandColors.helpfulOrange.DEFAULT} />
                    <Text style={styles.eliteBadgeText}>Elite</Text>
                  </View>
                )}
              </View>
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
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f5f7f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "700",
    color: "#121212",
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f7f9",
  },
  metricsRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  metricsText: {
    color: brandColors.practicalGray.DEFAULT,
  },
  // Class metrics styles
  classMetricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  classMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  classMetricText: {
    color: brandColors.practicalGray.DEFAULT,
  },
  eliteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: brandColors.helpfulOrange.container,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  eliteBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: brandColors.helpfulOrange.DEFAULT,
  },
});
