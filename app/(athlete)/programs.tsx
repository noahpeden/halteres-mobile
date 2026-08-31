import { useRouter } from "expo-router";
import { PenLine } from "lucide-react-native";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { ProgramCard } from "@/components/dashboard/ProgramCard";
import { TAB_BAR_CLEARANCE } from "@/components/navigation/AthleteTabBar";
import { AppText } from "@/components/ui/AppText";
import { HButton } from "@/components/ui/HButton";
import { HCard } from "@/components/ui/HCard";
import { Screen } from "@/components/ui/Screen";
import { usePrograms } from "@/hooks/usePrograms";
import { palette } from "@/lib/theme";

export default function AthleteProgramsScreen() {
  const router = useRouter();
  const { data: programs, isLoading, refetch } = usePrograms();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreateProgram = () => {
    router.push("/(athlete)/programs/create");
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="eyebrow">Your notebook</AppText>
        <AppText variant="display" style={styles.title}>
          Programs
        </AppText>
        <AppText variant="italic">
          {programs?.length
            ? `${programs.length} block${programs.length === 1 ? "" : "s"} in ink.`
            : "Write the next block. Length is yours — one week or a full season."}
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HButton
          label="Write a program"
          tone="orange"
          icon={<PenLine size={16} color={palette.white} />}
          onPress={handleCreateProgram}
        />

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={palette.blue} />
          </View>
        ) : programs && programs.length > 0 ? (
          <View style={styles.list}>
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </View>
        ) : (
          <HCard accent="orange">
            <AppText variant="title">A blank page.</AppText>
            <AppText variant="body" style={{ marginTop: 8 }}>
              Name a block, pick your days, generate the sessions. Edit any day.
              No coach in the loop.
            </AppText>
            <View style={{ marginTop: 16 }}>
              <HButton
                label="Start the first one"
                tone="ink"
                onPress={handleCreateProgram}
              />
            </View>
          </HCard>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { marginTop: 6, marginBottom: 6 },
  scroll: {
    paddingHorizontal: 22,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: 16,
  },
  loading: { alignItems: "center", paddingVertical: 48 },
  list: { gap: 4 },
});
