import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { fonts, palette } from "@/lib/theme";

type Variant =
  | "display"
  | "headline"
  | "title"
  | "body"
  | "bodySmall"
  | "label"
  | "eyebrow"
  | "stat"
  | "italic";

const variantStyle: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: palette.ink,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.25,
    color: palette.ink,
  },
  title: {
    fontFamily: fonts.uiSemi,
    fontSize: 16,
    lineHeight: 22,
    color: palette.ink,
  },
  body: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    color: palette.inkSoft,
  },
  bodySmall: {
    fontFamily: fonts.ui,
    fontSize: 13,
    lineHeight: 18,
    color: palette.inkFaint,
  },
  label: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,
    color: palette.ink,
  },
  eyebrow: {
    fontFamily: fonts.uiSemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: palette.inkFaint,
  },
  stat: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: palette.ink,
    fontVariant: ["tabular-nums"],
  },
  italic: {
    fontFamily: fonts.displayItalic,
    fontSize: 17,
    lineHeight: 24,
    color: palette.inkSoft,
  },
};

type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({
  variant = "body",
  color,
  style,
  ...props
}: AppTextProps) {
  return (
    <RNText
      {...props}
      style={[variantStyle[variant], color ? { color } : null, style]}
    />
  );
}
