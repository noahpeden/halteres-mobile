// Two-Phase Generation Types
// Matches database schema from migration 20260113000000_add_two_phase_generation_support.sql

/**
 * Generation status for individual workouts
 */
export type GenerationStatus =
  | "pending"
  | "skeleton"
  | "enhancing"
  | "detailed";

/**
 * Generation status for programs
 */
export type ProgramGenerationStatus =
  | "pending"
  | "generating"
  | "skeleton_complete"
  | "completed"
  | "failed";

/**
 * Two-phase generation stage (extends single-phase stages)
 */
export type TwoPhaseStage =
  | "idle"
  | "preparing"
  | "generating_skeleton"
  | "skeleton_streaming"
  | "skeleton_complete"
  | "enhancing_week"
  | "enhancing_all"
  | "complete"
  | "error"
  | "retrying";

/**
 * Workout with two-phase generation fields
 */
export type TwoPhaseWorkout = {
  id: string;
  program_id: string;
  title: string;
  body: string | null;
  body_skeleton: string | null;
  generation_status: GenerationStatus;
  week_number: number;
  scheduled_date?: string;
  tags?: Record<string, unknown>;
  is_reference: boolean;
  completed?: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Skeleton generation progress tracking
 */
export type SkeletonProgress = {
  currentWeek: number;
  totalWeeks: number;
  workoutsSaved: number;
  totalExpected: number;
};

/**
 * Enhancement progress tracking
 */
export type EnhancementProgress = {
  weekNumber: number;
  currentWorkout: number;
  totalWorkoutsInWeek: number;
  enhancedCount: number;
};

/**
 * Grouped week data for UI display
 */
export type WeekData = {
  weekNumber: number;
  workouts: TwoPhaseWorkout[];
  status: "skeleton" | "enhancing" | "detailed";
  weekNote?: string;
};

/**
 * SSE event types for skeleton generation
 */
export type SkeletonSSEEvent =
  | { type: "status"; message: string }
  | {
      type: "skeleton_chunk";
      week: number;
      workouts: Array<{
        id?: string;
        title: string;
        body: string;
        date: string;
      }>;
      totalGenerated: number;
      totalExpected: number;
    }
  | { type: "stream_start"; week: number; message: string }
  | { type: "stream_chunk"; week: number; chunk: string; totalLength: number }
  | {
      type: "skeleton_complete";
      message: string;
      title?: string;
      description?: string;
      suggestions?: unknown[];
      totalWorkouts: number;
      generationType: string;
    }
  | { type: "warning"; message: string; week?: number }
  | { type: "error"; error: string };

/**
 * SSE event types for enhancement
 */
export type EnhancementSSEEvent =
  | { type: "status"; message: string }
  | { type: "stream_start"; week: number; message: string }
  | { type: "stream_chunk"; week: number; chunk: string; totalLength: number }
  | {
      type: "enhanced_workout";
      workout: {
        id: string;
        title: string;
        body: string;
        generation_status: string;
      };
      progress: { current: number; total: number };
    }
  | {
      type: "enhancement_complete";
      message: string;
      weekNumber: number;
      enhancedCount: number;
      totalCount: number;
    }
  | { type: "error"; error: string };

/**
 * Request body for skeleton generation
 */
export type SkeletonGenerationRequest = {
  programId?: string;
  name: string;
  description: string;
  goal?: string;
  difficulty?: string;
  focus_area?: string;
  personalization?: string;
  referenceInput?: string;
  trainingMethodology: string;
  duration_weeks: number;
  days_per_week: number;
  entityId: string;
  gym_details: {
    equipment: string[];
    gym_type: string;
  };
  periodization?: {
    program_type?: string;
  };
  calendar_data: {
    start_date?: string;
    end_date?: string;
    days_per_week: number;
    days_of_week: number[];
  };
  session_details?: Record<string, unknown>;
  program_overview?: Record<string, unknown>;
  workout_format?: string[];
  forceRegenerate?: boolean;
};

/**
 * Request body for week enhancement
 */
export type EnhanceWeekRequest = {
  programId: string;
  weekNumber: number;
  workoutIds: string[];
  context: {
    goal?: string;
    difficulty?: string;
    equipment?: string[];
    useImperial?: boolean;
    trainingMethodology?: string;
    numberOfWeeks?: number;
    session_details?: Record<string, unknown>;
    workout_format?: string[];
    focus_area?: string;
    referenceInput?: string;
  };
  weekSpecificInput?: string;
};

/**
 * Helper to determine week status from workouts
 */
export function getWeekStatus(
  workouts: TwoPhaseWorkout[],
): "skeleton" | "enhancing" | "detailed" {
  if (workouts.length === 0) return "skeleton";

  const hasEnhancing = workouts.some(
    (w) => w.generation_status === "enhancing",
  );
  if (hasEnhancing) return "enhancing";

  const allDetailed = workouts.every((w) => w.generation_status === "detailed");
  if (allDetailed) return "detailed";

  return "skeleton";
}

/**
 * Group workouts by week number with status
 */
export function groupWorkoutsByWeek(workouts: TwoPhaseWorkout[]): WeekData[] {
  const weekMap = new Map<number, TwoPhaseWorkout[]>();

  for (const workout of workouts) {
    const weekNum = workout.week_number || 1;
    const existing = weekMap.get(weekNum) || [];
    existing.push(workout);
    weekMap.set(weekNum, existing);
  }

  const weeks: WeekData[] = [];
  for (const [weekNumber, weekWorkouts] of weekMap.entries()) {
    // Sort workouts by date within week
    weekWorkouts.sort((a, b) => {
      if (!a.scheduled_date || !b.scheduled_date) return 0;
      return (
        new Date(a.scheduled_date).getTime() -
        new Date(b.scheduled_date).getTime()
      );
    });

    weeks.push({
      weekNumber,
      workouts: weekWorkouts,
      status: getWeekStatus(weekWorkouts),
    });
  }

  // Sort weeks by week number
  weeks.sort((a, b) => a.weekNumber - b.weekNumber);

  return weeks;
}
