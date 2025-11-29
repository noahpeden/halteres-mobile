import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, SegmentedButtons, Text } from "react-native-paper";
import type { Workout } from "@/hooks/useProgramWorkoutsMobile";

import { WorkoutCard } from "./WorkoutCard";

type WorkoutListProps = {
  workouts: Workout[];
  loading: boolean;
  numberOfWeeks: number;
  startDate: string;
  programId: string;
  onDeleteWorkout: (workoutId: string) => void;
  onToggleComplete: (workoutId: string, completed: boolean) => void;
};

export function WorkoutList({
  workouts,
  loading,
  numberOfWeeks,
  startDate,
  programId,
  onDeleteWorkout,
  onToggleComplete,
}: WorkoutListProps) {
  const [selectedWeek, setSelectedWeek] = useState("1");

  // Group workouts by week
  const workoutsByWeek = useMemo(() => {
    if (!startDate || workouts.length === 0) {
      return {};
    }

    const start = new Date(startDate);
    const weeks: Record<string, Workout[]> = {};

    // Initialize all weeks
    for (let i = 1; i <= numberOfWeeks; i++) {
      weeks[i.toString()] = [];
    }

    // Group workouts into weeks
    workouts.forEach((workout) => {
      if (!workout.scheduled_date) return;

      const workoutDate = new Date(workout.scheduled_date);
      const diffTime = workoutDate.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weekNum = Math.floor(diffDays / 7) + 1;

      if (weekNum >= 1 && weekNum <= numberOfWeeks) {
        weeks[weekNum.toString()].push(workout);
      }
    });

    return weeks;
  }, [workouts, startDate, numberOfWeeks]);

  // Get week date ranges for labels
  const getWeekDateRange = (weekNum: number) => {
    if (!startDate) return "";
    const start = new Date(startDate);
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + (weekNum - 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const formatDate = (date: Date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  // Week selector buttons
  const weekButtons = useMemo(() => {
    const buttons = [];
    for (let i = 1; i <= numberOfWeeks; i++) {
      buttons.push({
        value: i.toString(),
        label: `W${i}`,
        showSelectedCheck: false,
      });
    }
    return buttons;
  }, [numberOfWeeks]);

  const currentWeekWorkouts = workoutsByWeek[selectedWeek] || [];
  const weekNum = Number.parseInt(selectedWeek, 10);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Week selector */}
      {numberOfWeeks > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekSelector}
        >
          <SegmentedButtons
            value={selectedWeek}
            onValueChange={setSelectedWeek}
            buttons={weekButtons}
            style={styles.segmentedButtons}
          />
        </ScrollView>
      )}

      {/* Week header */}
      <View style={styles.weekHeader}>
        <Text variant="titleMedium" style={styles.weekTitle}>
          Week {selectedWeek}
        </Text>
        <Text variant="bodySmall" style={styles.weekDateRange}>
          {getWeekDateRange(weekNum)}
        </Text>
        <Text variant="bodySmall" style={styles.workoutCount}>
          {currentWeekWorkouts.length} workout
          {currentWeekWorkouts.length !== 1 ? "s" : ""}
          {currentWeekWorkouts.length > 0 && (
            <>
              {" "}
              • {currentWeekWorkouts.filter((w) => w.completed).length}{" "}
              completed
            </>
          )}
        </Text>
      </View>

      {/* Workout cards */}
      <View style={styles.workoutsContainer}>
        {currentWeekWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No workouts for this week
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Generate the program to create workouts
            </Text>
          </View>
        ) : (
          currentWeekWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              programId={programId}
              onDelete={onDeleteWorkout}
              onToggleComplete={onToggleComplete}
            />
          ))
        )}
      </View>
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
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  weekSelector: {
    marginBottom: 16,
  },
  segmentedButtons: {
    minWidth: "100%",
  },
  weekHeader: {
    marginBottom: 16,
  },
  weekTitle: {
    fontWeight: "bold",
  },
  weekDateRange: {
    opacity: 0.7,
    marginTop: 2,
  },
  workoutCount: {
    opacity: 0.6,
    marginTop: 4,
  },
  workoutsContainer: {
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    opacity: 0.7,
    textAlign: "center",
  },
  emptySubtext: {
    opacity: 0.5,
    textAlign: "center",
    marginTop: 4,
  },
});
