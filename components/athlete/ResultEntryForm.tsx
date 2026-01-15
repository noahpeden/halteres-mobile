import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Chip,
  Surface,
  SegmentedButtons,
} from "react-native-paper";
import { supabase } from "@/lib/supabase/client";
import { brandColors } from "@/app/_layout";

type ResultType = "time" | "rounds_reps" | "weight" | "reps" | "distance" | "calories";
type Scale = "rx" | "scaled" | "rx_plus";

type Props = {
  workoutId: string;
  gymId?: string;
  workoutTitle?: string;
  onSuccess?: (result: any, isPR: boolean, prData: any) => void;
  onCancel?: () => void;
  defaultResultType?: ResultType;
};

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
  onSuccess,
  onCancel,
  defaultResultType = "time",
}: Props) {
  const [resultType, setResultType] = useState<ResultType>(defaultResultType);
  const [scale, setScale] = useState<Scale>("rx");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result values
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [rounds, setRounds] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [count, setCount] = useState("");
  const [modifications, setModifications] = useState("");
  const [notes, setNotes] = useState("");
  const [perceivedEffort, setPerceivedEffort] = useState<number | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const resultData: any = {
        user_id: user.id,
        workout_id: workoutId,
        gym_id: gymId || null,
        result_type: resultType,
        scale,
        modifications: scale === "scaled" ? modifications : null,
        notes,
        perceived_effort: perceivedEffort,
      };

      // Add type-specific values
      switch (resultType) {
        case "time":
          const totalSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
          if (totalSeconds === 0) {
            setError("Please enter a valid time");
            setLoading(false);
            return;
          }
          resultData.time_seconds = totalSeconds;
          break;
        case "rounds_reps":
          resultData.rounds = parseInt(rounds) || 0;
          resultData.reps = parseInt(reps) || 0;
          break;
        case "weight":
          if (!weight) {
            setError("Please enter a weight");
            setLoading(false);
            return;
          }
          resultData.weight_kg = parseFloat(weight);
          break;
        case "reps":
        case "distance":
        case "calories":
          if (!count) {
            setError("Please enter a value");
            setLoading(false);
            return;
          }
          resultData.count = parseInt(count);
          break;
      }

      const { data: result, error: insertError } = await supabase
        .from("workout_results")
        .insert([resultData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Check for PR (simplified version)
      const { data: previousResults } = await supabase
        .from("workout_results")
        .select("*")
        .eq("user_id", user.id)
        .eq("workout_id", workoutId)
        .eq("scale", scale)
        .neq("id", result.id)
        .is("deleted_at", null);

      const isPR = !previousResults || previousResults.length === 0;

      if (isPR) {
        await supabase
          .from("workout_results")
          .update({ is_pr: true, pr_type: "workout_pr" })
          .eq("id", result.id);
      }

      if (onSuccess) {
        onSuccess(result, isPR, isPR ? { displayValue: formatResult(result) } : null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatResult = (result: any) => {
    switch (result.result_type) {
      case "time":
        const mins = Math.floor(result.time_seconds / 60);
        const secs = result.time_seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
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
      {workoutTitle && (
        <Text variant="titleLarge" style={styles.title}>
          {workoutTitle}
        </Text>
      )}

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
            <Text variant="headlineMedium" style={styles.colon}>:</Text>
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
            <Text variant="headlineMedium" style={styles.colon}>+</Text>
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
              label={resultType === "distance" ? "Meters" : resultType === "calories" ? "Calories" : "Reps"}
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
          Log Result
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "bold",
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
    backgroundColor: "#fff",
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
    color: brandColors.error,
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
