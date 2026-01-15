import { brandColors } from "@/app/_layout";
import { useRouter } from "expo-router";
import { ArrowLeft, type LucideIcon } from "lucide-react-native";
import type React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

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
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
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
          <ArrowLeft size={22} color={brandColors.practicalGray.DEFAULT} />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}

      <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightAction && RightIcon ? (
        <Pressable
          onPress={rightAction.onPress}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RightIcon size={22} color={brandColors.practicalGray.DEFAULT} />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    fontWeight: "700",
    color: "#121212",
    textAlign: "center",
    marginHorizontal: 8,
  },
});
