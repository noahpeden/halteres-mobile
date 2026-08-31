import { Pressable, StyleSheet } from "react-native";
import { fonts, palette, radii } from "@/lib/theme";
import { AppText } from "./AppText";

type PillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: "blue" | "orange" | "peach";
};

export function Pill({ label, selected, onPress, tone = "blue" }: PillProps) {
  const fill =
    tone === "orange"
      ? palette.orange
      : tone === "peach"
        ? palette.peachDeep
        : palette.ink;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        selected
          ? { backgroundColor: fill }
          : {
              backgroundColor: palette.paperElevated,
              borderColor: palette.rule,
            },
      ]}
    >
      <AppText
        variant="label"
        style={[
          styles.label,
          { color: selected ? palette.paper : palette.inkSoft },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "transparent",
  },
  label: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
  },
});
