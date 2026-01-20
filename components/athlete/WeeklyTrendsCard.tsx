import { useState, useEffect, useContext } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, ActivityIndicator } from "react-native-paper";
import { ChevronDown, ChevronUp, TrendingUp, Target, Trophy, Sparkles } from "lucide-react-native";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";

type WeeklyTrends = {
  hasData: boolean;
  workouts_completed?: number;
  prs_achieved?: number;
  summary?: string;
  highlights?: string[];
  areas_to_focus?: string[];
  next_week_goals?: string[];
  message?: string;
};

export default function WeeklyTrendsCard() {
  const { user } = useContext(AuthContext);
  const [trends, setTrends] = useState<WeeklyTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, [user?.id]);

  const fetchTrends = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app') || 'https://halteres.ai'}/api/athlete/weekly-trends`,
        {
          headers: {
            Authorization: `Bearer ${user.id}`,
          },
        }
      );
      const data = await res.json();

      if (data.success) {
        setTrends(data.trends);
      }
    } catch (err) {
      console.error("Error fetching trends:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Surface style={styles.container} elevation={1}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall" style={styles.loadingText}>
            Loading weekly insights...
          </Text>
        </View>
      </Surface>
    );
  }

  if (!trends) {
    return null;
  }

  if (!trends.hasData) {
    return (
      <Surface style={styles.container} elevation={1}>
        <View style={styles.headerRow}>
          <TrendingUp size={18} color={brandColors.smartBlue.DEFAULT} />
          <Text variant="titleSmall" style={styles.headerText}>
            Weekly Insights
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.messageText}>
          {trends.message}
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container} elevation={1}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerRow}>
          <TrendingUp size={18} color={brandColors.smartBlue.DEFAULT} />
          <Text variant="titleSmall" style={styles.headerText}>
            This Week's Insights
          </Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {trends.workouts_completed} workouts
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={20} color={brandColors.practicalGray.DEFAULT} />
          ) : (
            <ChevronDown size={20} color={brandColors.practicalGray.DEFAULT} />
          )}
        </View>

        <Text variant="bodySmall" style={styles.summary}>
          {trends.summary}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Highlights */}
          {trends.highlights && trends.highlights.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={14} color={brandColors.thrivingGreen.DEFAULT} />
                <Text variant="labelMedium" style={styles.sectionTitle}>
                  Highlights
                </Text>
              </View>
              {trends.highlights.map((highlight, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, styles.bulletGreen]}>•</Text>
                  <Text variant="bodySmall" style={styles.bulletText}>
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Focus Areas */}
          {trends.areas_to_focus && trends.areas_to_focus.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={14} color={brandColors.helpfulOrange.DEFAULT} />
                <Text variant="labelMedium" style={styles.sectionTitle}>
                  Focus Areas
                </Text>
              </View>
              {trends.areas_to_focus.map((area, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, styles.bulletOrange]}>•</Text>
                  <Text variant="bodySmall" style={styles.bulletText}>
                    {area}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Next Week Goals */}
          {trends.next_week_goals && trends.next_week_goals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={14} color={brandColors.smartBlue.DEFAULT} />
                <Text variant="labelMedium" style={styles.sectionTitle}>
                  Next Week Goals
                </Text>
              </View>
              {trends.next_week_goals.map((goal, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, styles.bulletBlue]}>○</Text>
                  <Text variant="bodySmall" style={styles.bulletText}>
                    {goal}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* PRs Badge */}
          {trends.prs_achieved && trends.prs_achieved > 0 && (
            <View style={styles.prBanner}>
              <Trophy size={18} color={brandColors.helpfulOrange.DEFAULT} />
              <Text variant="labelMedium" style={styles.prText}>
                {trends.prs_achieved} PR{trends.prs_achieved > 1 ? "s" : ""} achieved this week!
              </Text>
            </View>
          )}
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontWeight: "600",
    flex: 1,
  },
  headerBadge: {
    backgroundColor: brandColors.smartBlue.container,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: brandColors.smartBlue.DEFAULT,
  },
  summary: {
    marginTop: 8,
    opacity: 0.8,
    lineHeight: 18,
  },
  messageText: {
    marginTop: 6,
    opacity: 0.7,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "500",
    opacity: 0.9,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginLeft: 4,
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    marginTop: 1,
  },
  bulletGreen: {
    color: brandColors.thrivingGreen.DEFAULT,
  },
  bulletOrange: {
    color: brandColors.helpfulOrange.DEFAULT,
  },
  bulletBlue: {
    color: brandColors.smartBlue.DEFAULT,
  },
  bulletText: {
    flex: 1,
    opacity: 0.7,
    lineHeight: 18,
  },
  prBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  prText: {
    color: brandColors.helpfulOrange.DEFAULT,
    fontWeight: "600",
  },
});
