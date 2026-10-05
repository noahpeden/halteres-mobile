export type WorkoutResultLookupRow = {
  id: string;
  created_at?: string | null;
  deleted_at?: string | null;
};

export type WorkoutResultWrite = {
  user_id: string;
  workout_id: string;
  gym_id?: string | null;
  result_type: string;
  time_seconds?: number | null;
  rounds?: number | null;
  reps?: number | null;
  weight_kg?: number | null;
  count?: number | null;
  scale?: string;
  modifications?: string | null;
  notes?: string | null;
  perceived_effort?: number | null;
  deleted_at?: string | null;
  updated_at?: string;
};

export type UpsertWorkoutResultOutcome = {
  data: Record<string, unknown>;
  created: boolean;
};

/** Minimal supabase-js surface used by the helper (keeps unit tests dependency-free). */
export type WorkoutResultsClient = {
  // supabase-js builders are a wide fluent type; the helper only uses this table.
  // biome-ignore lint/suspicious/noExplicitAny: supabase query builder
  from: (table: "workout_results") => any;
};

const SIMPLE_WRITE_KEYS = [
  "user_id",
  "workout_id",
  "gym_id",
  "result_type",
  "time_seconds",
  "rounds",
  "reps",
  "weight_kg",
  "count",
  "scale",
  "modifications",
  "notes",
  "perceived_effort",
  "deleted_at",
] as const;

export const WORKOUT_RESULT_SAVE_ERROR =
  "Couldn't save this result. Please try again.";

const NUMERIC_RESULT_TYPES = new Set(["reps", "distance", "calories"]);

export function pickExistingWorkoutResult<T extends WorkoutResultLookupRow>(
  rows: T[] | null | undefined,
): T | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const live = rows.filter((row) => !row.deleted_at);
  const pool = live.length > 0 ? live : rows;
  return [...pool].sort((a, b) => {
    const byCreated =
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime();
    if (byCreated !== 0) return byCreated;
    return String(b.id || "").localeCompare(String(a.id || ""));
  })[0];
}

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; details?: string };
  if (err.code === "23505") return true;
  const message = String(err.message || err.details || "");
  return /duplicate key|unique constraint|workout_results_user_id_workout_id/i.test(
    message,
  );
}

function extractErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const err = error as { message?: string; details?: string };
    return String(err.message || err.details || "");
  }
  return "";
}

export function friendlyWorkoutResultError(error: unknown): string {
  if (isUniqueViolation(error)) {
    return "This workout already has a log. Please try again.";
  }
  const message = extractErrorMessage(error).trim();
  if (!message) return WORKOUT_RESULT_SAVE_ERROR;
  if (/not authenticated/i.test(message)) {
    return "Please sign in to log a result.";
  }
  if (
    /duplicate key|unique constraint|23505|violates|PGRST|permission denied|row-level|RLS|postgres|sqlstate/i.test(
      message,
    )
  ) {
    return WORKOUT_RESULT_SAVE_ERROR;
  }
  if (message.length <= 120 && !/[_.]{2,}/.test(message)) {
    return message;
  }
  return WORKOUT_RESULT_SAVE_ERROR;
}

/**
 * Mobile only writes the simple result columns. Never send `exercise_logs`
 * so a web-authored lift log is not nulled out on update.
 */
export function sanitizeWorkoutResultWrite(
  payload: Record<string, unknown>,
): WorkoutResultWrite {
  const write: Record<string, unknown> = {};
  for (const key of SIMPLE_WRITE_KEYS) {
    if (key in payload) write[key] = payload[key];
  }
  return write as WorkoutResultWrite;
}

export function buildSimpleResultWrite(input: {
  userId: string;
  workoutId: string;
  gymId?: string | null;
  resultType: string;
  scale: string;
  modifications?: string | null;
  notes?: string | null;
  perceivedEffort?: number | null;
  timeSeconds?: number | null;
  rounds?: number | null;
  reps?: number | null;
  weightKg?: number | null;
  count?: number | null;
}): WorkoutResultWrite {
  const resultType = input.resultType;
  return {
    user_id: input.userId,
    workout_id: input.workoutId,
    gym_id: input.gymId ?? null,
    result_type: resultType,
    time_seconds: resultType === "time" ? (input.timeSeconds ?? null) : null,
    rounds: resultType === "rounds_reps" ? (input.rounds ?? null) : null,
    reps: resultType === "rounds_reps" ? (input.reps ?? null) : null,
    weight_kg: resultType === "weight" ? (input.weightKg ?? null) : null,
    count: NUMERIC_RESULT_TYPES.has(resultType) ? (input.count ?? null) : null,
    scale: input.scale,
    modifications:
      input.scale === "scaled" ? (input.modifications ?? null) : null,
    notes: input.notes ?? null,
    perceived_effort: input.perceivedEffort ?? null,
    deleted_at: null,
  };
}

export async function upsertWorkoutResult(
  client: WorkoutResultsClient,
  payload: Record<string, unknown>,
): Promise<UpsertWorkoutResultOutcome> {
  const write = sanitizeWorkoutResultWrite(payload);
  if (!write.user_id || !write.workout_id) {
    throw new Error("Missing workout.");
  }

  const { data: existingRows, error: findError } = await client
    .from("workout_results")
    .select("id, created_at, deleted_at")
    .eq("user_id", write.user_id)
    .eq("workout_id", write.workout_id);

  if (findError) throw findError;

  const existing = pickExistingWorkoutResult(
    existingRows as WorkoutResultLookupRow[] | null,
  );
  const stamped = { ...write, updated_at: new Date().toISOString() };

  if (existing) {
    const { data, error } = await client
      .from("workout_results")
      .update(stamped)
      .eq("id", existing.id)
      .eq("user_id", write.user_id)
      .select()
      .single();
    if (error) throw error;
    return { data, created: false };
  }

  const { data, error } = await client
    .from("workout_results")
    .insert([write])
    .select()
    .single();

  if (!error) return { data, created: true };
  if (!isUniqueViolation(error)) throw error;

  const { data: racedRows, error: racedError } = await client
    .from("workout_results")
    .select("id, created_at, deleted_at")
    .eq("user_id", write.user_id)
    .eq("workout_id", write.workout_id);
  if (racedError) throw racedError;

  const raced = pickExistingWorkoutResult(
    racedRows as WorkoutResultLookupRow[] | null,
  );
  if (!raced) throw error;

  const { data: updated, error: updateError } = await client
    .from("workout_results")
    .update(stamped)
    .eq("id", raced.id)
    .eq("user_id", write.user_id)
    .select()
    .single();
  if (updateError) throw updateError;
  return { data: updated, created: false };
}
