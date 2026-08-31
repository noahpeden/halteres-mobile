import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ArrowLeft, PenLine } from "lucide-react-native";
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
import { TextInput } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AuthContext } from "@/components/providers/AuthProvider";
import { AppText } from "@/components/ui/AppText";
import { HButton } from "@/components/ui/HButton";
import { Screen } from "@/components/ui/Screen";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateProgram } from "@/hooks/usePrograms";
import { supabase } from "@/lib/supabase/client";
import { palette } from "@/lib/theme";
import {
  type ProgramInput,
  programSchema,
} from "@/lib/validations/program.schema";

/**
 * Creates a program for the current, self-coached athlete.
 * Entity creation stays internal — not surfaced as a coach/client feature.
 */
export default function CreateProgramScreen() {
  const router = useRouter();
  const { profile } = useContext(AuthContext);
  const createProgram = useCreateProgram();
  const createClient = useCreateClient();
  const { data: clients } = useClients();
  const [isLoading, setIsLoading] = useState(false);

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

  const getOrCreateSelfEntityId = async (): Promise<string> => {
    const existing = clients?.[0];
    if (existing) return existing.id;

    const name = profile?.display_name || profile?.full_name || "Self";
    const created = await createClient.mutateAsync({ name, type: "CLIENT" });
    return created.id;
  };

  const findActiveProgramForUser = async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

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

    for (const p of programs as {
      id: string;
      calendar_data?: { start_date?: string; end_date?: string };
    }[]) {
      const cal = p.calendar_data || {};
      const start = cal.start_date ? new Date(cal.start_date) : null;
      const end = cal.end_date ? new Date(cal.end_date) : null;
      if (start && end) {
        const startD = new Date(start.toISOString().split("T")[0]);
        const endD = new Date(end.toISOString().split("T")[0]);
        if (today >= startD && today <= endD) {
          return p.id;
        }
      }
    }
    return null;
  };

  const onSubmit = async (data: ProgramInput) => {
    try {
      setIsLoading(true);
      const activeProgramId = await findActiveProgramForUser();
      if (activeProgramId) {
        Alert.alert(
          "You already have a live block",
          "Opening it so you can keep writing.",
        );
        router.replace(`/(athlete)/programs/${activeProgramId}`);
        return;
      }
      const selfEntityId = await getOrCreateSelfEntityId();
      const result = await createProgram.mutateAsync({
        ...data,
        client_id: selfEntityId,
        gym_id: null,
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
    <Screen notebook={false} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={22} color={palette.ink} />
          </Pressable>
          <AppText variant="title">New block</AppText>
          <View style={styles.back} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(280)}
            style={styles.hero}
          >
            <View style={styles.heroMark}>
              <PenLine size={28} color={palette.orange} strokeWidth={1.6} />
            </View>
            <AppText variant="display" style={styles.heroTitle}>
              Name the block.
            </AppText>
            <AppText variant="italic">
              Weeks stay flexible in the writer — one week, eight, twelve, or a
              full season. Next screen: generate the days.
            </AppText>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(280).delay(80)}
            style={styles.form}
          >
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    label="Program name"
                    placeholder="e.g. Spring strength, garage days"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    autoCapitalize="sentences"
                    mode="outlined"
                    style={styles.input}
                  />
                  {errors.name ? (
                    <AppText
                      variant="bodySmall"
                      color={palette.error}
                      style={styles.err}
                    >
                      {errors.name.message}
                    </AppText>
                  ) : null}
                </View>
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="What are you writing toward? (optional)"
                  placeholder="Influences, equipment, how you like to train…"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  mode="outlined"
                  style={[styles.input, styles.area]}
                />
              )}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(280).delay(160)}
            style={styles.actions}
          >
            <HButton
              label={isLoading ? "Opening writer…" : "Continue to writer"}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              tone="orange"
            />
            <HButton
              label="Cancel"
              onPress={() => router.back()}
              tone="ghost"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.rule,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 22, paddingBottom: 40 },
  hero: { marginBottom: 22 },
  heroMark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: palette.orangeWash,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    transform: [{ rotate: "-5deg" }],
  },
  heroTitle: { marginBottom: 8 },
  form: {
    backgroundColor: palette.paperElevated,
    borderRadius: 22,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(26, 35, 50, 0.05)",
  },
  input: { backgroundColor: palette.paperElevated },
  area: { minHeight: 110 },
  err: { marginTop: 4, marginLeft: 4 },
  actions: { gap: 10, marginTop: 22 },
});
