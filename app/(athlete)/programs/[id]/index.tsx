import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AIProgramWriter } from "@/components/programs/AIProgramWriter";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { palette } from "@/lib/theme";

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <Screen notebook={false} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={palette.ink} />
        </Pressable>
        <View style={styles.titles}>
          <AppText variant="eyebrow" color={palette.orange}>
            Writer
          </AppText>
          <AppText variant="title">Generate & edit</AppText>
        </View>
        <View style={styles.back} />
      </View>
      <AIProgramWriter programId={id as string} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  titles: { flex: 1, alignItems: "center" },
});
