import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSimpleResultWrite,
  friendlyWorkoutResultError,
  isUniqueViolation,
  pickExistingWorkoutResult,
  sanitizeWorkoutResultWrite,
  upsertWorkoutResult,
  WORKOUT_RESULT_SAVE_ERROR,
} from "./upsertWorkoutResult.ts";

type FindHandler = (filters: Record<string, unknown>) => {
  data: unknown;
  error: unknown;
};
type WriteHandler = (
  payload: unknown,
  filters: Record<string, unknown>,
) => { data: unknown; error: unknown };

function createMockClient(handlers: {
  find?: FindHandler;
  insert?: WriteHandler;
  update?: WriteHandler;
}) {
  const calls: Array<{
    method: string;
    payload?: unknown;
    filters: Record<string, unknown>;
  }> = [];

  return {
    calls,
    from() {
      const ctx: {
        method: string;
        payload?: unknown;
        filters: Record<string, unknown>;
      } = { method: "select", filters: {} };

      const finish = (asSingle: boolean) => {
        calls.push({
          method: ctx.method,
          payload: ctx.payload,
          filters: { ...ctx.filters },
        });
        if (ctx.method === "insert") {
          return (
            handlers.insert?.(ctx.payload, ctx.filters) ?? {
              data: asSingle ? { id: "new" } : [{ id: "new" }],
              error: null,
            }
          );
        }
        if (ctx.method === "update") {
          return (
            handlers.update?.(ctx.payload, ctx.filters) ?? {
              data: asSingle
                ? { id: String(ctx.filters.id) }
                : [{ id: ctx.filters.id }],
              error: null,
            }
          );
        }
        return (
          handlers.find?.(ctx.filters) ?? {
            data: [],
            error: null,
          }
        );
      };

      const api: Record<string, unknown> = {
        select() {
          return api;
        },
        insert(payload: unknown) {
          ctx.method = "insert";
          ctx.payload = payload;
          return api;
        },
        update(payload: unknown) {
          ctx.method = "update";
          ctx.payload = payload;
          return api;
        },
        eq(column: string, value: unknown) {
          ctx.filters[column] = value;
          return api;
        },
        single() {
          return Promise.resolve(finish(true));
        },
        // biome-ignore lint/suspicious/noThenProperty: mock supabase thenable builder
        then(
          resolve: (value: unknown) => unknown,
          reject: (err: unknown) => unknown,
        ) {
          return Promise.resolve(finish(false)).then(resolve, reject);
        },
      };
      return api;
    },
  };
}

describe("pickExistingWorkoutResult", () => {
  it("prefers the newest live row and ignores a newer deleted one", () => {
    const picked = pickExistingWorkoutResult([
      { id: "old", created_at: "2026-01-01T00:00:00Z", deleted_at: null },
      { id: "newer", created_at: "2026-02-01T00:00:00Z", deleted_at: null },
      {
        id: "deleted",
        created_at: "2026-03-01T00:00:00Z",
        deleted_at: "2026-03-02T00:00:00Z",
      },
    ]);
    assert.equal(picked?.id, "newer");
    assert.equal(pickExistingWorkoutResult([]), null);
  });
});

describe("isUniqueViolation + friendly errors", () => {
  it("detects Postgres 23505 and duplicate-key text", () => {
    assert.equal(isUniqueViolation({ code: "23505" }), true);
    assert.equal(
      isUniqueViolation({
        message: "duplicate key value violates unique constraint",
      }),
      true,
    );
    assert.equal(isUniqueViolation({ message: "something else" }), false);
  });

  it("hides raw database text", () => {
    assert.equal(
      friendlyWorkoutResultError({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "workout_results_user_id_workout_id_key"',
      }),
      "This workout already has a log. Please try again.",
    );
    assert.equal(
      friendlyWorkoutResultError({
        message: "new row violates row-level security policy",
      }),
      WORKOUT_RESULT_SAVE_ERROR,
    );
    assert.equal(
      friendlyWorkoutResultError(new Error("Not authenticated")),
      "Please sign in to log a result.",
    );
    assert.equal(
      friendlyWorkoutResultError(new Error("Please enter a valid time")),
      "Please enter a valid time",
    );
  });
});

describe("sanitize / build write payload", () => {
  it("never includes exercise_logs, even if the caller spread a web row", () => {
    const sanitized = sanitizeWorkoutResultWrite({
      user_id: "user-1",
      workout_id: "workout-1",
      result_type: "time",
      notes: "felt good",
      exercise_logs: { schema_version: 1, exercises: [{ name: "Back Squat" }] },
      photos: [],
    });
    assert.equal("exercise_logs" in sanitized, false);
    assert.equal("photos" in sanitized, false);
    assert.equal(sanitized.notes, "felt good");
  });

  it("nulls unused simple fields so an edit cannot leave stale numbers", () => {
    const payload = buildSimpleResultWrite({
      userId: "user-1",
      workoutId: "workout-1",
      resultType: "weight",
      scale: "rx",
      weightKg: 100,
      timeSeconds: 312,
      notes: "heavy",
    });
    assert.equal(payload.weight_kg, 100);
    assert.equal(payload.time_seconds, null);
    assert.equal(payload.deleted_at, null);
    assert.equal("exercise_logs" in payload, false);
  });
});

describe("upsertWorkoutResult", () => {
  it("updates the existing user+workout row", async () => {
    const client = createMockClient({
      find: () => ({
        data: [
          { id: "row-1", created_at: "2026-01-01T00:00:00Z", deleted_at: null },
        ],
        error: null,
      }),
      update: (payload) => ({
        data: { id: "row-1", ...(payload as object) },
        error: null,
      }),
    });

    const result = await upsertWorkoutResult(client, {
      user_id: "user-1",
      workout_id: "workout-1",
      result_type: "time",
      time_seconds: 400,
      exercise_logs: { schema_version: 1 },
    });

    assert.equal(result.created, false);
    assert.equal(result.data.id, "row-1");
    const updateCall = client.calls.find((call) => call.method === "update");
    assert.ok(updateCall);
    assert.equal(Object.hasOwn(updateCall?.payload, "exercise_logs"), false);
    assert.equal(
      client.calls.some((call) => call.method === "insert"),
      false,
    );
  });

  it("inserts when no row exists", async () => {
    const client = createMockClient({
      find: () => ({ data: [], error: null }),
      insert: (payload) => ({
        data: { id: "new-1", ...(Array.isArray(payload) ? payload[0] : {}) },
        error: null,
      }),
    });

    const result = await upsertWorkoutResult(client, {
      user_id: "user-1",
      workout_id: "workout-1",
      result_type: "reps",
      count: 21,
    });

    assert.equal(result.created, true);
    assert.equal(result.data.id, "new-1");
    assert.equal(
      client.calls.some((call) => call.method === "insert"),
      true,
    );
  });

  it("retries a 23505 race as an update", async () => {
    let finds = 0;
    const client = createMockClient({
      find: () => {
        finds += 1;
        if (finds === 1) return { data: [], error: null };
        return {
          data: [
            {
              id: "raced",
              created_at: "2026-04-01T00:00:00Z",
              deleted_at: null,
            },
          ],
          error: null,
        };
      },
      insert: () => ({
        data: null,
        error: {
          code: "23505",
          message:
            'duplicate key value violates unique constraint "workout_results_user_id_workout_id_key"',
        },
      }),
      update: (payload) => ({
        data: { id: "raced", ...(payload as object) },
        error: null,
      }),
    });

    const result = await upsertWorkoutResult(client, {
      user_id: "user-1",
      workout_id: "workout-1",
      result_type: "time",
      time_seconds: 180,
    });

    assert.equal(result.created, false);
    assert.equal(result.data.id, "raced");
    assert.equal(
      client.calls.filter((call) => call.method === "insert").length,
      1,
    );
    assert.equal(
      client.calls.filter((call) => call.method === "update").length,
      1,
    );
  });
});
