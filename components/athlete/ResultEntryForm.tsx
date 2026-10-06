import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { supabase } from "@/lib/supabase/client";
import { palette } from "@/lib/theme";
import {
  buildSimpleResultWrite,
  friendlyWorkoutResultError,
  upsertWorkoutResult,
} from "@/lib/workoutResults/upsertWorkoutResult";

type ResultType =
  | "time"
  | "rounds_reps"
  | "weight"
  | "reps"
  | "distance"
  | "calories";
type Scale = "rx" | "scaled" | "rx_plus";

export type ExistingWorkoutResult = {
  result_type?: string | null;
  time_seconds?: number | null;
  rounds?: number | null;
  reps?: number | null;
  weight_kg?: number | null;
  count?: number | null;
  scale?: string | null;
  modifications?: string | null;
  notes?: string | null;
  perceived_effort?: number | null;
};

type ResultLike = {
  result_type?: string | null;
  time_seconds?: number | null;
  rounds?: number | null;
  reps?: number | null;
  weight_kg?: number | null;
  count?: number | null;
};

type Props = {
  workoutId: string;
  gymId?: string;
  workoutTitle?: string;
  existingResult?: ExistingWorkoutResult | null;
  onSuccess?: (
    result: Record<string, unknown>,
    isPR: boolean,
    prData: { displayValue: string } | null,
  ) => void;
  onCancel?: () => void;
  defaultResultType?: ResultType;
};

function asResultType(value: string | null | undefined): ResultType | null {
  if (
    value === "time" ||
    value === "rounds_reps" ||
    value === "weight" ||
    value === "reps" ||
    value === "distance" ||
    value === "calories"
  ) {
    return value;
  }
  return null;
}

function asScale(value: string | null | undefined): Scale {
  if (value === "scaled" || value === "rx_plus") return value;
  return "rx";
}

function seedTimeParts(totalSeconds: number | null | undefined) {
  if (!totalSeconds) return { minutes: "", seconds: "" };
  return {
    minutes: String(Math.floor(totalSeconds / 60)),
    seconds: String(totalSeconds % 60),
  };
}

const RESULT_TYPES: { value: ResultType; label: string }[] = [
  { value: "time", label: "Time" },
  { value: "rounds_reps", label: "Rounds+Reps" },
  { value: "weight", label: "Weight" },
  { value: "reps", label: "Reps" },
];

export default function ResultEntryForm({
  workoutId,
  gymId,
  workoutTitle,
  existingResult,
  onSuccess,
  onCancel,
  defaultResultType = "time",
}: Props) {
  const seededType =
    asResultType(existingResult?.result_type) ?? defaultResultType;
  const seededTime = seedTimeParts(existingResult?.time_seconds);
  const [resultType, setResultType] = useState<ResultType>(seededType);
  const [scale, setScale] = useState<Scale>(asScale(existingResult?.scale));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result values
  const [minutes, setMinutes] = useState(seededTime.minutes);
  const [seconds, setSeconds] = useState(seededTime.seconds);
  const [rounds, setRounds] = useState(
    existingResult?.rounds != null ? String(existingResult.rounds) : "",
  );
  const [reps, setReps] = useState(
    existingResult?.reps != null ? String(existingResult.reps) : "",
  );
  const [weight, setWeight] = useState(
    existingResult?.weight_kg != null ? String(existingResult.weight_kg) : "",
  );
  const [count, setCount] = useState(
    existingResult?.count != null ? String(existingResult.count) : "",
  );
  const [modifications, setModifications] = useState(
    existingResult?.modifications ?? "",
  );
  const [notes, setNotes] = useState(existingResult?.notes ?? "");
  const [perceivedEffort, setPerceivedEffort] = useState<number | null>(
    existingResult?.perceived_effort ?? null,
  );
  const isEditing = Boolean(existingResult);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let timeSeconds: number | null = null;
      let roundsValue: number | null = null;
      let repsValue: number | null = null;
      let weightKg: number | null = null;
      let countValue: number | null = null;

      switch (resultType) {
        case "time": {
          const totalSeconds =
            (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
          if (totalSeconds === 0) {
            setError("Please enter a valid time");
            setLoading(false);
            return;
          }
          timeSeconds = totalSeconds;
          break;
        }
        case "rounds_reps":
          roundsValue = parseInt(rounds, 10) || 0;
          repsValue = parseInt(reps, 10) || 0;
          break;
        case "weight":
          if (!weight) {
            setError("Please enter a weight");
            setLoading(false);
            return;
          }
          weightKg = parseFloat(weight);
          break;
        case "reps":
        case "distance":
        case "calories":
          if (!count) {
            setError("Please enter a value");
            setLoading(false);
            return;
          }
          countValue = parseInt(count, 10);
          break;
      }

      const resultData = buildSimpleResultWrite({
        userId: user.id,
        workoutId,
        gymId,
        resultType,
        scale,
        modifications,
        notes,
        perceivedEffort,
        timeSeconds,
        rounds: roundsValue,
        reps: repsValue,
        weightKg,
        count: countValue,
      });

      const { data: result, created } = await upsertWorkoutResult(
        supabase,
        resultData,
      );

      // First completion for this user+workout is a PR. Edits stay on the same row.
      const isPR = created;

      if (isPR && result.id) {
        await supabase
          .from("workout_results")
          .update({ is_pr: true, pr_type: "workout_pr" })
          .eq("id", result.id);
      }

      if (onSuccess) {
        onSuccess(
          result,
          isPR,
          isPR ? { displayValue: formatResult(result as ResultLike) } : null,
        );
      }
    } catch (err: unknown) {
      setError(friendlyWorkoutResultError(err));
    } finally {
      setLoading(false);
    }
  };

  const formatResult = (result: ResultLike) => {
    switch (result.result_type) {
      case "time": {
        const total = result.time_seconds || 0;
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      }
      case "rounds_reps":
        return `${result.rounds || 0} + ${result.reps || 0}`;
      case "weight":
        return `${result.weight_kg} kg`;
      default:
        return `${result.count}`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {workoutTitle ? (
        <View>
          <Text variant="titleLarge" style={styles.title}>
            {workoutTitle}
          </Text>
          <Text variant="bodyMedium" style={styles.lede}>
            Write it down while it's still in your hands.
          </Text>
        </View>
      ) : null}

      {/* Result Type Selection */}
      <Text variant="labelLarge" style={styles.label}>
        Result Type
      </Text>
      <View style={styles.chipContainer}>
        {RESULT_TYPES.map((type) => (
          <Chip
            key={type.value}
            selected={resultType === type.value}
            onPress={() => setResultType(type.value)}
            style={styles.chip}
            mode={resultType === type.value ? "flat" : "outlined"}
          >
            {type.label}
          </Chip>
        ))}
      </View>

      {/* Result Input */}
      <Text variant="labelLarge" style={styles.label}>
        Your Result
      </Text>
      <Surface style={styles.inputSurface} elevation={1}>
        {resultType === "time" && (
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="Min"
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="numeric"
              style={styles.smallInput}
            />
            <Text variant="headlineMedium" style={styles.colon}>
              :
            </Text>
            <TextInput
              mode="outlined"
              label="Sec"
              value={seconds}
              onChangeText={setSeconds}
              keyboardType="numeric"
              style={styles.smallInput}
            />
          </View>
        )}

        {resultType === "rounds_reps" && (
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="Rounds"
              value={rounds}
              onChangeText={setRounds}
              keyboardType="numeric"
              style={styles.smallInput}
            />
            <Text variant="headlineMedium" style={styles.colon}>
              +
            </Text>
            <TextInput
              mode="outlined"
              label="Reps"
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              style={styles.smallInput}
            />
          </View>
        )}

        {resultType === "weight" && (
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              style={styles.wideInput}
            />
          </View>
        )}

        {["reps", "distance", "calories"].includes(resultType) && (
          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label={
                resultType === "distance"
                  ? "Meters"
                  : resultType === "calories"
                    ? "Calories"
                    : "Reps"
              }
              value={count}
              onChangeText={setCount}
              keyboardType="numeric"
              style={styles.wideInput}
            />
          </View>
        )}
      </Surface>

      {/* Scale Selection */}
      <Text variant="labelLarge" style={styles.label}>
        Scale
      </Text>
      <SegmentedButtons
        value={scale}
        onValueChange={(value) => setScale(value as Scale)}
        buttons={[
          { value: "rx", label: "RX" },
          { value: "scaled", label: "Scaled" },
          { value: "rx_plus", label: "RX+" },
        ]}
        style={styles.segmented}
      />

      {/* Modifications */}
      {scale === "scaled" && (
        <>
          <Text variant="labelLarge" style={styles.label}>
            What did you modify?
          </Text>
          <TextInput
            mode="outlined"
            value={modifications}
            onChangeText={setModifications}
            placeholder="e.g., 95# instead of 135#"
            multiline
            style={styles.textArea}
          />
        </>
      )}

      {/* Perceived Effort */}
      <Text variant="labelLarge" style={styles.label}>
        Perceived Effort (1-10)
      </Text>
      <View style={styles.effortContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <Chip
            key={num}
            selected={perceivedEffort === num}
            onPress={() => setPerceivedEffort(num)}
            style={styles.effortChip}
            mode={perceivedEffort === num ? "flat" : "outlined"}
            compact
          >
            {num}
          </Chip>
        ))}
      </View>

      {/* Notes */}
      <Text variant="labelLarge" style={styles.label}>
        Notes (optional)
      </Text>
      <TextInput
        mode="outlined"
        value={notes}
        onChangeText={setNotes}
        placeholder="How did it feel?"
        multiline
        style={styles.textArea}
      />

      {/* Error */}
      {error && (
        <Text variant="bodyMedium" style={styles.error}>
          {error}
        </Text>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {onCancel && (
          <Button mode="outlined" onPress={onCancel} style={styles.button}>
            Cancel
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={[styles.button, styles.submitButton]}
        >
          {isEditing ? "Save" : "Log it"}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: palette.paper,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  lede: {
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginRight: 4,
  },
  inputSurface: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: palette.paperElevated,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallInput: {
    flex: 1,
  },
  wideInput: {
    flex: 1,
  },
  colon: {
    marginHorizontal: 8,
  },
  segmented: {
    marginTop: 8,
  },
  textArea: {
    minHeight: 80,
  },
  effortContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  effortChip: {
    minWidth: 36,
  },
  error: {
    color: palette.error,
    marginTop: 16,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
