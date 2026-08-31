import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Calendar, Dumbbell, Home, User } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { fonts, palette, radii, shadows } from "@/lib/theme";

const ICONS: Record<string, { icon: typeof Home; label: string }> = {
  home: { icon: Home, label: "Today" },
  programs: { icon: Dumbbell, label: "Write" },
  history: { icon: Calendar, label: "Log" },
  profile: { icon: User, label: "You" },
};

function TabItem({
  focused,
  routeName,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  routeName: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const meta = ICONS[routeName];
  scale.value = withSpring(focused ? 1 : 0.96, { damping: 16, stiffness: 220 });
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
    >
      <Animated.View
        style={[styles.iconWrap, focused && styles.iconWrapActive, anim]}
      >
        <Icon
          size={20}
          color={focused ? palette.paper : palette.inkFaint}
          strokeWidth={focused ? 2.4 : 1.8}
        />
      </Animated.View>
      <AppText
        variant="label"
        style={[
          styles.label,
          { color: focused ? palette.ink : palette.inkFaint },
        ]}
      >
        {meta.label}
      </AppText>
    </Pressable>
  );
}

export function AthleteTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          if ((options as { href?: unknown }).href === null) return null;
          if (!ICONS[route.name]) return null;

          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              routeName={route.name}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export const TAB_BAR_CLEARANCE = Platform.OS === "ios" ? 108 : 92;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: "row",
    backgroundColor: palette.paperElevated,
    borderRadius: radii.xl,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(26, 35, 50, 0.06)",
    ...shadows.float,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: palette.ink,
  },
  label: {
    fontFamily: fonts.uiSemi,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
