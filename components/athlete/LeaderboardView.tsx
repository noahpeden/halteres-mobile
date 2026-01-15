import { useState, useEffect, useContext } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import {
  Text,
  Surface,
  Avatar,
  Chip,
  ActivityIndicator,
  Badge,
} from "react-native-paper";
import { supabase } from "@/lib/supabase/client";
import { AuthContext } from "@/components/providers/AuthProvider";
import { brandColors } from "@/app/_layout";

type Scale = "rx" | "scaled" | null;

type LeaderboardEntry = {
  id: string;
  result_type: string;
  time_seconds: number | null;
  rounds: number | null;
  reps: number | null;
  weight_kg: number | null;
  count: number | null;
  scale: string;
  is_pr: boolean;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    full_name: string | null;
    profile_photo_url: string | null;
  };
  rank: number;
  fistBumpCount: number;
  hasFistBumped: boolean;
  isCurrentUser: boolean;
  displayValue: string;
};

type Props = {
  workoutId: string;
  gymId?: string;
  workoutTitle?: string;
};

export default function LeaderboardView({ workoutId, gymId, workoutTitle }: Props) {
  const { user } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState<Scale>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("workout_results")
        .select(`
          id, result_type, time_seconds, rounds, reps, weight_kg, count,
          scale, is_pr, created_at,
          user:profiles (id, display_name, full_name, profile_photo_url)
        `)
        .eq("workout_id", workoutId)
        .eq("include_in_leaderboard", true)
        .is("deleted_at", null);

      if (gymId) query = query.eq("gym_id", gymId);
      if (scale) query = query.eq("scale", scale);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Sort and add metadata
      const sorted = sortResults(data || []);
      const withMetadata = await addMetadata(sorted);
      setLeaderboard(withMetadata);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortResults = (results: any[]) => {
    return results.sort((a, b) => {
      if (a.result_type === "time") {
        return (a.time_seconds || Infinity) - (b.time_seconds || Infinity);
      }
      if (a.result_type === "rounds_reps") {
        const aScore = (a.rounds || 0) * 1000 + (a.reps || 0);
        const bScore = (b.rounds || 0) * 1000 + (b.reps || 0);
        return bScore - aScore;
      }
      if (a.result_type === "weight") {
        return (b.weight_kg || 0) - (a.weight_kg || 0);
      }
      return (b.count || 0) - (a.count || 0);
    });
  };

  const addMetadata = async (results: any[]): Promise<LeaderboardEntry[]> => {
    const resultIds = results.map((r) => r.id);

    // Get fist bump counts
    const { data: fistBumps } = await supabase
      .from("social_interactions")
      .select("workout_result_id")
      .in("workout_result_id", resultIds)
      .eq("interaction_type", "fist_bump")
      .is("deleted_at", null);

    const fistBumpCounts: Record<string, number> = {};
    (fistBumps || []).forEach((fb) => {
      fistBumpCounts[fb.workout_result_id] = (fistBumpCounts[fb.workout_result_id] || 0) + 1;
    });

    // Get user's fist bumps
    const { data: userFistBumps } = await supabase
      .from("social_interactions")
      .select("workout_result_id")
      .in("workout_result_id", resultIds)
      .eq("user_id", user?.id || "")
      .eq("interaction_type", "fist_bump")
      .is("deleted_at", null);

    const userFistBumpSet = new Set((userFistBumps || []).map((fb) => fb.workout_result_id));

    return results.map((result, index) => ({
      ...result,
      rank: index + 1,
      fistBumpCount: fistBumpCounts[result.id] || 0,
      hasFistBumped: userFistBumpSet.has(result.id),
      isCurrentUser: result.user?.id === user?.id,
      displayValue: formatResult(result),
    }));
  };

  const formatResult = (result: any) => {
    switch (result.result_type) {
      case "time":
        if (!result.time_seconds) return "-";
        const mins = Math.floor(result.time_seconds / 60);
        const secs = result.time_seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      case "rounds_reps":
        return `${result.rounds || 0} + ${result.reps || 0}`;
      case "weight":
        return `${result.weight_kg || 0} kg`;
      default:
        return `${result.count || 0}`;
    }
  };

  const handleFistBump = async (resultId: string, index: number) => {
    const entry = leaderboard[index];
    if (entry.isCurrentUser) return;

    try {
      if (entry.hasFistBumped) {
        // Remove fist bump
        await supabase
          .from("social_interactions")
          .delete()
          .eq("workout_result_id", resultId)
          .eq("user_id", user?.id || "")
          .eq("interaction_type", "fist_bump");
      } else {
        // Add fist bump
        await supabase.from("social_interactions").insert([{
          workout_result_id: resultId,
          user_id: user?.id,
          interaction_type: "fist_bump",
        }]);
      }

      // Update local state
      setLeaderboard((prev) =>
        prev.map((item, i) => {
          if (i === index) {
            return {
              ...item,
              hasFistBumped: !item.hasFistBumped,
              fistBumpCount: item.fistBumpCount + (item.hasFistBumped ? -1 : 1),
            };
          }
          return item;
        })
      );
    } catch (err) {
      console.error("Fist bump error:", err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [workoutId, gymId, scale]);

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return rank.toString();
    }
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <Surface
      style={[
        styles.entryCard,
        item.isCurrentUser && styles.currentUserCard,
      ]}
      elevation={1}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, item.rank <= 3 && styles.topRank]}>
          {getRankDisplay(item.rank)}
        </Text>
      </View>

      {/* Avatar */}
      {item.user?.profile_photo_url ? (
        <Avatar.Image size={40} source={{ uri: item.user.profile_photo_url }} />
      ) : (
        <Avatar.Text
          size={40}
          label={(item.user?.display_name || item.user?.full_name || "U").charAt(0)}
        />
      )}

      {/* Name and Result */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text variant="bodyLarge" style={styles.name} numberOfLines={1}>
            {item.user?.display_name || item.user?.full_name || "Anonymous"}
          </Text>
          {item.isCurrentUser && (
            <Chip compact mode="flat" style={styles.youChip}>You</Chip>
          )}
        </View>
        <View style={styles.resultRow}>
          <Text variant="titleMedium" style={styles.resultValue}>
            {item.displayValue}
          </Text>
          <Chip compact mode="outlined" style={styles.scaleChip}>
            {item.scale.toUpperCase()}
          </Chip>
          {item.is_pr && <Text style={styles.prBadge}>🏆</Text>}
        </View>
      </View>

      {/* Fist Bump */}
      <TouchableOpacity
        onPress={() => handleFistBump(item.id, index)}
        disabled={item.isCurrentUser}
        style={styles.fistBumpButton}
      >
        <Text style={[styles.fistBump, item.hasFistBumped && styles.fistBumped]}>
          👊
        </Text>
        <Text style={styles.fistBumpCount}>{item.fistBumpCount}</Text>
      </TouchableOpacity>
    </Surface>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {workoutTitle && (
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>{workoutTitle}</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Leaderboard</Text>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterContainer}>
        <Chip
          selected={scale === null}
          onPress={() => setScale(null)}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={scale === "rx"}
          onPress={() => setScale("rx")}
          style={styles.filterChip}
        >
          RX
        </Chip>
        <Chip
          selected={scale === "scaled"}
          onPress={() => setScale("scaled")}
          style={styles.filterChip}
        >
          Scaled
        </Chip>
      </View>

      {/* List */}
      {leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No results yet. Be the first!
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    paddingVertical: 16,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.6,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    marginHorizontal: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  currentUserCard: {
    backgroundColor: brandColors.smartBlue.container,
    borderWidth: 2,
    borderColor: brandColors.smartBlue.DEFAULT,
  },
  rankContainer: {
    width: 36,
    alignItems: "center",
  },
  rank: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.5,
  },
  topRank: {
    fontSize: 24,
    opacity: 1,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontWeight: "600",
    flex: 1,
  },
  youChip: {
    height: 24,
    backgroundColor: brandColors.smartBlue.DEFAULT,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  resultValue: {
    fontWeight: "bold",
  },
  scaleChip: {
    height: 22,
  },
  prBadge: {
    fontSize: 14,
  },
  fistBumpButton: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  fistBump: {
    fontSize: 20,
    opacity: 0.5,
  },
  fistBumped: {
    opacity: 1,
  },
  fistBumpCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    opacity: 0.6,
  },
});
