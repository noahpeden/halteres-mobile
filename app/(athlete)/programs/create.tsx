import { brandColors } from "@/app/_layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock, FileText, Sparkles, Target, Settings } from "lucide-react-native";
import { useContext, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Button, Chip, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "@/components/providers/AuthProvider";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateProgram } from "@/hooks/usePrograms";
import { type ProgramInput, programSchema } from "@/lib/validations/program.schema";
import { supabase } from "@/lib/supabase/client";
import { equipmentList, daysOfWeek, difficulties, goals } from "@/lib/constants/programConfig";

/**
 * Creates a program for the current, self-coached athlete.
 *
 * There is no client/gym picker here: every account has exactly one
 * "self" entity (created lazily on first use) that all of the athlete's
 * own programs are attached to under the hood.
 */
export default function CreateProgramScreen() {
  const router = useRouter();
  const { profile } = useContext(AuthContext);
  const createProgram = useCreateProgram();
  const createClient = useCreateClient();
  const { data: clients } = useClients();

  const [isLoading, setIsLoading] = useState(false);
  // Intake local state
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("intermediate");
  const [selectedGoal, setSelectedGoal] = useState<string>("strength");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday", "Wednesday", "Friday"]);
  const [sessionDuration, setSessionDuration] = useState<string>("60");
  const [recentTraining, setRecentTraining] = useState<string>("");
  const [programInfluences, setProgramInfluences] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_weeks: 8,
      client_id: "self",
      gym_id: null,
    },
  });

  // Find (or lazily create) the single entity that represents the
  // logged-in athlete themselves.
  const getOrCreateSelfEntityId = async (): Promise<string> => {
    const existing = clients?.[0];
    if (existing) return existing.id;

    const name = profile?.display_name || profile?.full_name || "My Training";
    const created = await createClient.mutateAsync({ name, type: "CLIENT" });
    return created.id;
  };

  // Check for an existing active program (today within start/end)
  const findActiveProgramForUser = async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Get all of this user's entities (self-coached)
    const { data: entities } = await supabase
      .from("entities")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null);
    const entityIds = (entities || []).map((e) => e.id);
    if (entityIds.length === 0) return null;

    const { data: programs } = await supabase
      .from("programs")
      .select("id, calendar_data, deleted_at")
      .in("entity_id", entityIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!programs || programs.length === 0) return null;

    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);

    for (const p of programs as any[]) {
      const cal = p.calendar_data || {};
      const start = cal.start_date ? new Date(cal.start_date) : null;
      const end = cal.end_date ? new Date(cal.end_date) : null;
      if (start && end) {
        const startD = new Date(start.toISOString().split("T")[0]);
        const endD = new Date(end.toISOString().split("T")[0]);
        if (today >= startD && today <= endD) {
          return p.id as string;
        }
      }
    }
    return null;
  };

  const onSubmit = async (data: ProgramInput) => {
    try {
      setIsLoading(true);
      // Enforce single active program
      const activeProgramId = await findActiveProgramForUser();
      if (activeProgramId) {
        Alert.alert(
          "Active Program In Progress",
          "You already have an active program. Opening it now."
        );
        router.replace(`/(athlete)/programs/${activeProgramId}`);
        return;
      }
      const selfEntityId = await getOrCreateSelfEntityId();
      const result = await createProgram.mutateAsync({
        ...data,
        client_id: selfEntityId,
        gym_id: null,
        // Intake extensions
        difficulty: selectedDifficulty,
        goal: selectedGoal,
        equipment: selectedEquipment,
        days_of_week_names: selectedDays,
        session_duration_minutes: Number.parseInt(sessionDuration || "60", 10),
        recent_training_history: recentTraining,
        program_influences: programInfluences,
      });

      if (result && typeof result === "object" && "id" in result) {
        router.replace(`/(athlete)/programs/${result.id}`);
      } else {
        router.back();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create program";
      Alert.alert("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={brandColors.practicalGray.DEFAULT} />
          </Pressable>
          <Text variant="titleMedium" style={styles.headerTitle}>
            New Program
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.heroSection}>
            <View style={styles.heroIconContainer}>
              <Sparkles size={32} color={brandColors.smartBlue.DEFAULT} strokeWidth={1.5} />
            </View>
            <Text variant="headlineSmall" style={styles.heroTitle}>
              Build Your Training Program
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              Give it a name and a length, then generate AI-powered workouts
              tailored to your goals in the next step.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={styles.formCardIconContainer}>
                <FileText size={18} color={brandColors.smartBlue.DEFAULT} strokeWidth={2} />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Program Details
              </Text>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Program Name"
                    placeholder="e.g., 12-Week Strength Builder"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    autoCapitalize="words"
                    mode="outlined"
                    style={styles.input}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name?.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Description (Optional)"
                    placeholder="Describe your goals and focus..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    mode="outlined"
                    style={[styles.input, styles.textArea]}
                  />
                </View>
              )}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(300)} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.formCardIconContainer, { backgroundColor: brandColors.helpfulOrange.container }]}>
                <Clock size={18} color={brandColors.helpfulOrange.DEFAULT} strokeWidth={2} />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Duration
              </Text>
            </View>

            <Controller
              control={control}
              name="duration_weeks"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <View style={styles.quickRow}>
                    {[1, 8, 12].map((w) => (
                      <Chip
                        key={w}
                        selected={value === w}
                        onPress={() => onChange(w)}
                        style={styles.chip}
                      >
                        {w} wk{w !== 1 ? "s" : ""}
                      </Chip>
                    ))}
                  </View>
                  <TextInput
                    label="Custom Weeks"
                    placeholder="e.g., 6"
                    value={value ? String(value) : ""}
                    onChangeText={(text) => {
                      const num = Number.parseInt(text, 10);
                      if (!Number.isNaN(num)) onChange(num);
                      else if (text === "") onChange(0);
                    }}
                    onBlur={onBlur}
                    error={!!errors.duration_weeks}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.input}
                    right={<TextInput.Affix text="weeks" />}
                  />
                  {errors.duration_weeks ? (
                    <Text style={styles.errorText}>{errors.duration_weeks?.message}</Text>
                  ) : (
                    <Text style={styles.fieldHint}>Choose 1, 8, 12, or set a custom length</Text>
                  )}
                </View>
              )}
            />
          </Animated.View>

          {/* Experience & Goals */}
          <Animated.View entering={FadeInDown.duration(300).delay(350)} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.formCardIconContainer, { backgroundColor: brandColors.smartBlue.container }]}>
                <Target size={18} color={brandColors.smartBlue.DEFAULT} strokeWidth={2} />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Experience & Goals
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>Experience Level</Text>
              <View style={styles.quickRow}>
                {difficulties.map((d) => (
                  <Chip
                    key={d.value}
                    selected={selectedDifficulty === d.value}
                    onPress={() => setSelectedDifficulty(d.value)}
                    style={styles.chip}
                  >
                    {d.label}
                  </Chip>
                ))}
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>Primary Goal</Text>
              <View style={styles.quickRow}>
                {goals.map((g) => (
                  <Chip
                    key={g.value}
                    selected={selectedGoal === g.value}
                    onPress={() => setSelectedGoal(g.value)}
                    style={styles.chip}
                  >
                    {g.label}
                  </Chip>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Equipment */}
          <Animated.View entering={FadeInDown.duration(300).delay(400)} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.formCardIconContainer, { backgroundColor: brandColors.practicalGray.container }]}>
                <Settings size={18} color={brandColors.practicalGray.DEFAULT} strokeWidth={2} />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Available Equipment (Hard Constraint)
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.fieldHint}>
              Only workouts that use selected equipment will be programmed.
            </Text>
            <View style={styles.multiWrap}>
              {equipmentList.map((eq) => {
                const isSelected = selectedEquipment.includes(eq.value);
                return (
                  <Chip
                    key={eq.value}
                    selected={isSelected}
                    onPress={() =>
                      setSelectedEquipment((prev) =>
                        prev.includes(eq.value) ? prev.filter((v) => v !== eq.value) : [...prev, eq.value],
                      )
                    }
                    style={styles.chip}
                  >
                    {eq.label}
                  </Chip>
                );
              })}
            </View>
          </Animated.View>

          {/* Scheduling */}
          <Animated.View entering={FadeInDown.duration(300).delay(450)} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.formCardIconContainer, { backgroundColor: brandColors.thrivingGreen.container }]}>
                <Clock size={18} color={brandColors.thrivingGreen.DEFAULT} strokeWidth={2} />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Scheduling
              </Text>
            </View>
            <Text variant="labelLarge" style={styles.label}>Days of Week</Text>
            <View style={styles.quickRow}>
              {daysOfWeek.map((d) => {
                const isSelected = selectedDays.includes(d.value);
                return (
                  <Chip
                    key={d.value}
                    selected={isSelected}
                    onPress={() =>
                      setSelectedDays((prev) =>
                        prev.includes(d.value) ? prev.filter((v) => v !== d.value) : [...prev, d.value],
                      )
                    }
                    style={styles.chip}
                  >
                    {d.label}
                  </Chip>
                );
              })}
            </View>
            <Text variant="labelLarge" style={[styles.label, { marginTop: 12 }]}>Session Duration (minutes)</Text>
            <TextInput
              mode="outlined"
              keyboardType="number-pad"
              value={sessionDuration}
              onChangeText={setSessionDuration}
              style={styles.input}
              placeholder="e.g., 60"
            />
          </Animated.View>

          {/* Training Context */}
          <Animated.View entering={FadeInDown.duration(300).delay(500)} style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={[styles.formCardIconContainer, { backgroundColor: brandColors.smartBlue.container }]}>
                <FileText size={18} color={brandColors.smartBlue.DEFAULT} strokeWidth={2} />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Training Context
              </Text>
            </View>
            <TextInput
              label="Recent Training History"
              mode="outlined"
              value={recentTraining}
              onChangeText={setRecentTraining}
              placeholder="What have you been doing the past couple months?"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />
            <TextInput
              label="Program Influences (Methods, Coaches, Named Programs)"
              mode="outlined"
              value={programInfluences}
              onChangeText={setProgramInfluences}
              placeholder="e.g., Texas Method, 5/3/1, Rich Froning style conditioning"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(400)} style={styles.buttonContainer}>
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Creating..." : "Continue"}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.back()} disabled={isLoading} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontWeight: "700", color: "#121212" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  heroSection: { alignItems: "center", paddingVertical: 24, marginBottom: 8 },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: brandColors.smartBlue.container,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: { fontWeight: "700", color: "#121212", marginBottom: 8, textAlign: "center" },
  heroSubtitle: { color: brandColors.practicalGray.DEFAULT, textAlign: "center" },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  formCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  formCardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: brandColors.smartBlue.container,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  formCardTitle: { fontWeight: "700", color: "#121212" },
  inputContainer: { marginBottom: 4 },
  input: { backgroundColor: "#ffffff" },
  textArea: { minHeight: 100 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 4, marginLeft: 4 },
  fieldHint: { color: brandColors.practicalGray.DEFAULT, fontSize: 12, marginTop: 4, marginLeft: 4 },
  label: { marginBottom: 6, fontWeight: "600" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  multiWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { marginRight: 4, marginBottom: 6 },
  buttonContainer: { gap: 12, marginTop: 8 },
  primaryButton: {
    backgroundColor: brandColors.smartBlue.DEFAULT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryButton: { paddingVertical: 12, alignItems: "center" },
  secondaryButtonText: { color: brandColors.practicalGray.medium, fontWeight: "600" },
});
