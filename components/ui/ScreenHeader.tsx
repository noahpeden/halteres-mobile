import { useRouter } from "expo-router";
import { ArrowLeft, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { palette } from "@/lib/theme";
import { AppText } from "./AppText";

type ScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: LucideIcon;
    onPress: () => void;
  };
  variant?: "default" | "transparent";
};

export function ScreenHeader({
  title,
  showBack = true,
  onBack,
  rightAction,
  variant = "default",
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const RightIcon = rightAction?.icon;

  return (
    <View
      style={[
        styles.header,
        variant === "transparent" && styles.headerTransparent,
      ]}
    >
      {showBack ? (
        <Pressable
          onPress={handleBack}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={palette.ink} />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}

      <AppText variant="title" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>

      {rightAction && RightIcon ? (
        <Pressable
          onPress={rightAction.onPress}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RightIcon size={22} color={palette.ink} />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.paper,
    borderBottomWidth: 1,
    borderBottomColor: palette.rule,
  },
  headerTransparent: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
});
