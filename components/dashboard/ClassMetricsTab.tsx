import { brandColors } from "@/app/_layout";
import { useUpdateClient, type ClassMetrics, type Client, type SkillDistribution } from "@/hooks/useClients";
import { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  Switch,
} from "react-native";
import Slider from "@react-native-community/slider";
import {
  Button,
  Card,
  Text,
  TextInput,
} from "react-native-paper";
import { Trophy, Users, Clock, TrendingUp } from "lucide-react-native";

type ClassMetricsTabProps = {
  client: Client;
  onUpdate?: () => void;
};

export function ClassMetricsTab({ client, onUpdate }: ClassMetricsTabProps) {
  const updateClient = useUpdateClient();
  const [isEditing, setIsEditing] = useState(false);

  // Class metrics state
  const [classSize, setClassSize] = useState(client.class_size?.toString() || "");
  const [averageAge, setAverageAge] = useState(client.average_age?.toString() || "");
  const [hasEliteAthletes, setHasEliteAthletes] = useState(client.has_elite_athletes || false);
  const [avgExperience, setAvgExperience] = useState(client.average_experience_years?.toString() || "");
  const [skillDistribution, setSkillDistribution] = useState<SkillDistribution>(
    client.skill_distribution || { beginner: 33, intermediate: 34, advanced: 33 }
  );
  const [classDuration, setClassDuration] = useState(
    client.class_duration_minutes?.toString() || "60"
  );
  const [warmupDuration, setWarmupDuration] = useState(
    client.warmup_duration_minutes?.toString() || "15"
  );

  const isSubmitting = updateClient.isPending;

  // Reset form when client changes
  useEffect(() => {
    setClassSize(client.class_size?.toString() || "");
    setAverageAge(client.average_age?.toString() || "");
    setHasEliteAthletes(client.has_elite_athletes || false);
    setAvgExperience(client.average_experience_years?.toString() || "");
    setSkillDistribution(
      client.skill_distribution || { beginner: 33, intermediate: 34, advanced: 33 }
    );
    setClassDuration(client.class_duration_minutes?.toString() || "60");
    setWarmupDuration(client.warmup_duration_minutes?.toString() || "15");
  }, [client]);

  const handleSkillDistributionChange = (level: keyof SkillDistribution, value: number) => {
    const roundedValue = Math.round(value);
    const levels: (keyof SkillDistribution)[] = ["beginner", "intermediate", "advanced"];
    const otherLevels = levels.filter((l) => l !== level);

    const remaining = 100 - roundedValue;
    const currentOtherTotal = skillDistribution[otherLevels[0]] + skillDistribution[otherLevels[1]];

    let newDistribution = { ...skillDistribution, [level]: roundedValue };

    if (currentOtherTotal > 0) {
      const ratio0 = skillDistribution[otherLevels[0]] / currentOtherTotal;
      const ratio1 = skillDistribution[otherLevels[1]] / currentOtherTotal;
      newDistribution[otherLevels[0]] = Math.round(remaining * ratio0);
      newDistribution[otherLevels[1]] = Math.round(remaining * ratio1);

      // Adjust for rounding errors
      const total =
        newDistribution.beginner +
        newDistribution.intermediate +
        newDistribution.advanced;
      if (total !== 100) {
        newDistribution[otherLevels[1]] += 100 - total;
      }
    } else {
      newDistribution[otherLevels[0]] = Math.round(remaining / 2);
      newDistribution[otherLevels[1]] = remaining - newDistribution[otherLevels[0]];
    }

    setSkillDistribution(newDistribution);
  };

  const handleSave = async () => {
    const classMetrics: ClassMetrics = {
      class_size: classSize ? parseInt(classSize, 10) : null,
      average_age: averageAge ? parseInt(averageAge, 10) : null,
      has_elite_athletes: hasEliteAthletes,
      average_experience_years: avgExperience ? parseFloat(avgExperience) : null,
      skill_distribution: skillDistribution,
      class_duration_minutes: classDuration ? parseInt(classDuration, 10) : 60,
      warmup_duration_minutes: warmupDuration ? parseInt(warmupDuration, 10) : 15,
    };

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          name: client.name,
          type: "CLASS",
          classMetrics,
        },
      });
      Alert.alert("Success", "Class metrics updated successfully");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      Alert.alert("Error", message);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setClassSize(client.class_size?.toString() || "");
    setAverageAge(client.average_age?.toString() || "");
    setHasEliteAthletes(client.has_elite_athletes || false);
    setAvgExperience(client.average_experience_years?.toString() || "");
    setSkillDistribution(
      client.skill_distribution || { beginner: 33, intermediate: 34, advanced: 33 }
    );
    setClassDuration(client.class_duration_minutes?.toString() || "60");
    setWarmupDuration(client.warmup_duration_minutes?.toString() || "15");
    setIsEditing(false);
  };

  const workoutWindow = (parseInt(classDuration) || 60) - (parseInt(warmupDuration) || 15);

  if (!isEditing) {
    // View mode
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Class Metrics
          </Text>
          <Button mode="outlined" onPress={() => setIsEditing(true)}>
            Edit
          </Button>
        </View>

        {/* Demographics Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Users size={20} color={brandColors.smartBlue.DEFAULT} />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Class Demographics
              </Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Class Size
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {client.class_size || "N/A"}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Avg Age
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {client.average_age ? `${client.average_age} yrs` : "N/A"}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Avg Experience
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {client.average_experience_years
                    ? `${client.average_experience_years} yrs`
                    : "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.eliteRow}>
              <Trophy
                size={16}
                color={
                  client.has_elite_athletes
                    ? brandColors.helpfulOrange.DEFAULT
                    : brandColors.practicalGray.light
                }
              />
              <Text
                style={[
                  styles.eliteText,
                  client.has_elite_athletes && styles.eliteTextActive,
                ]}
              >
                {client.has_elite_athletes
                  ? "Elite Athletes Present"
                  : "No Elite Athletes"}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Skill Distribution Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <TrendingUp size={20} color={brandColors.smartBlue.DEFAULT} />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Skill Distribution
              </Text>
            </View>
            <View style={styles.skillBars}>
              <View style={styles.skillBarRow}>
                <Text style={[styles.skillLabel, { color: "#22c55e" }]}>
                  Beginner
                </Text>
                <View style={styles.skillBarContainer}>
                  <View
                    style={[
                      styles.skillBar,
                      {
                        width: `${client.skill_distribution?.beginner || 0}%`,
                        backgroundColor: "#22c55e",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.skillPercent}>
                  {client.skill_distribution?.beginner || 0}%
                </Text>
              </View>
              <View style={styles.skillBarRow}>
                <Text style={[styles.skillLabel, { color: "#3b82f6" }]}>
                  Intermediate
                </Text>
                <View style={styles.skillBarContainer}>
                  <View
                    style={[
                      styles.skillBar,
                      {
                        width: `${client.skill_distribution?.intermediate || 0}%`,
                        backgroundColor: "#3b82f6",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.skillPercent}>
                  {client.skill_distribution?.intermediate || 0}%
                </Text>
              </View>
              <View style={styles.skillBarRow}>
                <Text style={[styles.skillLabel, { color: "#a855f7" }]}>
                  Advanced
                </Text>
                <View style={styles.skillBarContainer}>
                  <View
                    style={[
                      styles.skillBar,
                      {
                        width: `${client.skill_distribution?.advanced || 0}%`,
                        backgroundColor: "#a855f7",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.skillPercent}>
                  {client.skill_distribution?.advanced || 0}%
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Time Constraints Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Clock size={20} color={brandColors.smartBlue.DEFAULT} />
              <Text variant="titleMedium" style={styles.cardTitle}>
                Time Constraints
              </Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Class Duration
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {client.class_duration_minutes || 60} min
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Warmup
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {client.warmup_duration_minutes || 15} min
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Workout
                </Text>
                <Text variant="headlineSmall" style={styles.statValue}>
                  {(client.class_duration_minutes || 60) -
                    (client.warmup_duration_minutes || 15)}{" "}
                  min
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // Edit mode
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Edit Class Metrics
        </Text>
      </View>

      {/* Demographics Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Users size={20} color={brandColors.smartBlue.DEFAULT} />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Class Demographics
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputField}>
              <Text variant="labelMedium" style={styles.inputLabel}>
                Class Size
              </Text>
              <TextInput
                value={classSize}
                onChangeText={setClassSize}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g. 15"
                style={styles.input}
                disabled={isSubmitting}
              />
            </View>
            <View style={styles.inputField}>
              <Text variant="labelMedium" style={styles.inputLabel}>
                Average Age
              </Text>
              <TextInput
                value={averageAge}
                onChangeText={setAverageAge}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g. 32"
                style={styles.input}
                disabled={isSubmitting}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputField}>
              <Text variant="labelMedium" style={styles.inputLabel}>
                Avg Experience (years)
              </Text>
              <TextInput
                value={avgExperience}
                onChangeText={setAvgExperience}
                mode="outlined"
                keyboardType="decimal-pad"
                placeholder="e.g. 2.5"
                style={styles.input}
                disabled={isSubmitting}
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Trophy size={20} color={brandColors.helpfulOrange.DEFAULT} />
              <View style={styles.switchTextContainer}>
                <Text variant="labelLarge" style={styles.switchLabel}>
                  Elite Athletes Present
                </Text>
                <Text variant="bodySmall" style={styles.switchDescription}>
                  Enable RX+ scaling options
                </Text>
              </View>
            </View>
            <Switch
              value={hasEliteAthletes}
              onValueChange={setHasEliteAthletes}
              trackColor={{
                false: brandColors.practicalGray.lighter,
                true: brandColors.smartBlue.container,
              }}
              thumbColor={
                hasEliteAthletes
                  ? brandColors.smartBlue.DEFAULT
                  : brandColors.practicalGray.light
              }
              disabled={isSubmitting}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Skill Distribution Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <TrendingUp size={20} color={brandColors.smartBlue.DEFAULT} />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Skill Distribution
            </Text>
          </View>

          <View style={styles.sliderSection}>
            <View style={styles.sliderRow}>
              <Text style={[styles.sliderLabel, { color: "#22c55e" }]}>
                Beginner: {skillDistribution.beginner}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={skillDistribution.beginner}
                onValueChange={(value) =>
                  handleSkillDistributionChange("beginner", value)
                }
                minimumTrackTintColor="#22c55e"
                maximumTrackTintColor={brandColors.practicalGray.lighter}
                thumbTintColor="#22c55e"
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.sliderRow}>
              <Text style={[styles.sliderLabel, { color: "#3b82f6" }]}>
                Intermediate: {skillDistribution.intermediate}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={skillDistribution.intermediate}
                onValueChange={(value) =>
                  handleSkillDistributionChange("intermediate", value)
                }
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor={brandColors.practicalGray.lighter}
                thumbTintColor="#3b82f6"
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.sliderRow}>
              <Text style={[styles.sliderLabel, { color: "#a855f7" }]}>
                Advanced: {skillDistribution.advanced}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={skillDistribution.advanced}
                onValueChange={(value) =>
                  handleSkillDistributionChange("advanced", value)
                }
                minimumTrackTintColor="#a855f7"
                maximumTrackTintColor={brandColors.practicalGray.lighter}
                thumbTintColor="#a855f7"
                disabled={isSubmitting}
              />
            </View>

            <Text style={styles.totalText}>
              Total:{" "}
              {skillDistribution.beginner +
                skillDistribution.intermediate +
                skillDistribution.advanced}
              %
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Time Constraints Section */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Clock size={20} color={brandColors.smartBlue.DEFAULT} />
            <Text variant="titleMedium" style={styles.cardTitle}>
              Time Constraints
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputField}>
              <Text variant="labelMedium" style={styles.inputLabel}>
                Class Duration (min)
              </Text>
              <TextInput
                value={classDuration}
                onChangeText={setClassDuration}
                mode="outlined"
                keyboardType="numeric"
                placeholder="60"
                style={styles.input}
                disabled={isSubmitting}
              />
            </View>
            <View style={styles.inputField}>
              <Text variant="labelMedium" style={styles.inputLabel}>
                Warmup (min)
              </Text>
              <TextInput
                value={warmupDuration}
                onChangeText={setWarmupDuration}
                mode="outlined"
                keyboardType="numeric"
                placeholder="15"
                style={styles.input}
                disabled={isSubmitting}
              />
            </View>
          </View>

          <View style={styles.workoutWindowInfo}>
            <Text variant="bodyMedium" style={styles.workoutWindowText}>
              Workout Window: {workoutWindow} minutes
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleCancel}
          disabled={isSubmitting}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.saveButton}
          buttonColor={brandColors.smartBlue.DEFAULT}
        >
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    color: "#121212",
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "600",
    color: "#121212",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: brandColors.practicalGray.DEFAULT,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "700",
    color: "#121212",
  },
  eliteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  eliteText: {
    color: brandColors.practicalGray.light,
    fontSize: 14,
  },
  eliteTextActive: {
    color: brandColors.helpfulOrange.DEFAULT,
    fontWeight: "600",
  },
  skillBars: {
    gap: 12,
  },
  skillBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  skillLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: "600",
  },
  skillBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  skillBar: {
    height: "100%",
    borderRadius: 4,
  },
  skillPercent: {
    width: 40,
    textAlign: "right",
    fontSize: 12,
    color: brandColors.practicalGray.DEFAULT,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  inputField: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: 4,
    color: brandColors.practicalGray.DEFAULT,
  },
  input: {
    backgroundColor: "#ffffff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  switchInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchTextContainer: {
    gap: 2,
  },
  switchLabel: {
    fontWeight: "600",
    color: "#121212",
  },
  switchDescription: {
    color: brandColors.practicalGray.DEFAULT,
  },
  sliderSection: {
    gap: 16,
  },
  sliderRow: {
    gap: 4,
  },
  sliderLabel: {
    fontWeight: "600",
    fontSize: 14,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  totalText: {
    textAlign: "center",
    color: brandColors.practicalGray.DEFAULT,
    fontSize: 12,
  },
  workoutWindowInfo: {
    padding: 12,
    backgroundColor: brandColors.smartBlue.container,
    borderRadius: 8,
    marginTop: 8,
  },
  workoutWindowText: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    borderColor: brandColors.practicalGray.lighter,
  },
  saveButton: {
    flex: 1,
  },
});
