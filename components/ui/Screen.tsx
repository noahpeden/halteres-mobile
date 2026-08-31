import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "@/lib/theme";

type ScreenProps = {
  children: ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
  notebook?: boolean;
  style?: ViewStyle;
};

/** Warm paper canvas with an optional composition-notebook gutter. */
export function Screen({
  children,
  edges = ["top"],
  notebook = true,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {notebook ? <View style={styles.gutter} pointerEvents="none" /> : null}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  gutter: {
    position: "absolute",
    left: 18,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: palette.margin,
    opacity: 0.42,
    zIndex: 0,
  },
});
