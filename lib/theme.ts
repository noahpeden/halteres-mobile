import { configureFonts, MD3LightTheme } from "react-native-paper";

/**
 * Halteres mobile visual system — "training notebook"
 *
 * Same family as the web brand (Smart Blue / Helpful Orange / Thriving Green)
 * but rendered as a writer-first companion: warm paper, ink, literary serif
 * headlines, humanist sans UI. Not a gray iOS settings clone.
 */
export const palette = {
  ink: "#1A2332",
  inkSoft: "#3D4A5C",
  inkFaint: "#6B7787",
  paper: "#F4EFE6",
  paperElevated: "#FFFCF6",
  paperSunken: "#EBE4D6",
  rule: "#D9D0C0",
  margin: "#E8A07A",
  blue: "#1771DC",
  blueDeep: "#134E93",
  blueMid: "#1A61B5",
  blueLight: "#3682DE",
  blueWash: "#DEEBFD",
  orange: "#EA7F49",
  orangeDeep: "#A75932",
  orangeWash: "#FFF4ED",
  green: "#2F7A62",
  greenDeep: "#245C4A",
  greenWash: "#E4F3ED",
  peach: "#F4C27A",
  peachDeep: "#BF9147",
  peachWash: "#FFF8EB",
  error: "#C63B3B",
  errorWash: "#FDECEC",
  success: "#188038",
  white: "#FFFFFF",
};

/** Back-compat alias used across existing screens */
export const brandColors = {
  smartBlue: {
    DEFAULT: palette.blue,
    dark: palette.blueDeep,
    medium: palette.blueMid,
    light: palette.blueLight,
    lightest: "#A5CEFF",
    container: palette.blueWash,
  },
  helpfulOrange: {
    DEFAULT: palette.orange,
    dark: palette.orangeDeep,
    medium: "#C06E44",
    light: "#ED9264",
    lightest: "#FFD2BB",
    container: palette.orangeWash,
  },
  thrivingGreen: {
    DEFAULT: palette.green,
    dark: palette.greenDeep,
    medium: "#3D846C",
    light: "#65A790",
    lightest: "#BFE8D9",
    container: palette.greenWash,
  },
  peach: {
    DEFAULT: palette.peach,
    dark: palette.peachDeep,
    medium: "#DDAD61",
    light: "#FFD592",
    lightest: "#FFEED3",
    container: palette.peachWash,
  },
  practicalGray: {
    DEFAULT: palette.inkFaint,
    dark: palette.ink,
    medium: palette.inkSoft,
    light: "#8A94A1",
    lighter: palette.rule,
    lightest: palette.rule,
    container: palette.paperSunken,
  },
  error: palette.error,
  errorContainer: palette.errorWash,
  success: palette.success,
  successContainer: palette.greenWash,
  background: palette.paper,
  surface: palette.paperElevated,
  surfaceVariant: palette.paperSunken,
};

export const fonts = {
  display: "Fraunces-SemiBold",
  displayBold: "Fraunces-Bold",
  displayRegular: "Fraunces-Regular",
  displayItalic: "Fraunces-Italic",
  ui: "PlusJakartaSans-Regular",
  uiMedium: "PlusJakartaSans-Medium",
  uiSemi: "PlusJakartaSans-SemiBold",
  uiBold: "PlusJakartaSans-Bold",
};

export const fontAssets = {
  "Fraunces-Regular": require("../assets/fonts/Fraunces-Regular.ttf"),
  "Fraunces-Italic": require("../assets/fonts/Fraunces-Italic.ttf"),
  "Fraunces-SemiBold": require("../assets/fonts/Fraunces-SemiBold.ttf"),
  "Fraunces-Bold": require("../assets/fonts/Fraunces-Bold.ttf"),
  "PlusJakartaSans-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
  "PlusJakartaSans-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
  "PlusJakartaSans-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  "PlusJakartaSans-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  screen: 22,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  float: {
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  soft: {
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
};

const paperFonts = configureFonts({
  config: {
    displayLarge: {
      fontFamily: fonts.displayBold,
      fontWeight: "700",
      fontSize: 40,
      lineHeight: 46,
      letterSpacing: -0.6,
    },
    displayMedium: {
      fontFamily: fonts.displayBold,
      fontWeight: "700",
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.4,
    },
    displaySmall: {
      fontFamily: fonts.display,
      fontWeight: "600",
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.3,
    },
    headlineLarge: {
      fontFamily: fonts.displayBold,
      fontWeight: "700",
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.3,
    },
    headlineMedium: {
      fontFamily: fonts.display,
      fontWeight: "600",
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.2,
    },
    headlineSmall: {
      fontFamily: fonts.display,
      fontWeight: "600",
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.1,
    },
    titleLarge: {
      fontFamily: fonts.display,
      fontWeight: "600",
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: fonts.uiSemi,
      fontWeight: "600",
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: 0,
    },
    titleSmall: {
      fontFamily: fonts.uiSemi,
      fontWeight: "600",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    bodyLarge: {
      fontFamily: fonts.ui,
      fontWeight: "400",
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontFamily: fonts.ui,
      fontWeight: "400",
      fontSize: 14,
      lineHeight: 21,
      letterSpacing: 0,
    },
    bodySmall: {
      fontFamily: fonts.ui,
      fontWeight: "400",
      fontSize: 12,
      lineHeight: 18,
      letterSpacing: 0,
    },
    labelLarge: {
      fontFamily: fonts.uiSemi,
      fontWeight: "600",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.15,
    },
    labelMedium: {
      fontFamily: fonts.uiMedium,
      fontWeight: "500",
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.3,
    },
    labelSmall: {
      fontFamily: fonts.uiMedium,
      fontWeight: "500",
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.4,
    },
  },
});

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 16,
  fonts: paperFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.blue,
    primaryContainer: palette.blueWash,
    onPrimary: palette.white,
    onPrimaryContainer: palette.blueDeep,
    secondary: palette.orange,
    secondaryContainer: palette.orangeWash,
    onSecondary: palette.white,
    onSecondaryContainer: palette.orangeDeep,
    tertiary: palette.green,
    tertiaryContainer: palette.greenWash,
    onTertiary: palette.white,
    onTertiaryContainer: palette.greenDeep,
    surface: palette.paperElevated,
    surfaceVariant: palette.paperSunken,
    background: palette.paper,
    onSurface: palette.ink,
    onSurfaceVariant: palette.inkSoft,
    onBackground: palette.ink,
    error: palette.error,
    errorContainer: palette.errorWash,
    onError: palette.white,
    onErrorContainer: "#7F1D1D",
    outline: palette.rule,
    outlineVariant: palette.rule,
    inverseSurface: palette.ink,
    inverseOnSurface: palette.paper,
    inversePrimary: palette.blueLight,
    shadow: palette.ink,
    scrim: palette.ink,
    backdrop: "rgba(26, 35, 50, 0.45)",
    warning: palette.peach,
    warningContainer: palette.peachWash,
    success: palette.success,
    successContainer: palette.greenWash,
  },
};

export const SUPPORT_EMAIL = "noah@halteres.ai";
export const SUPPORT_MAILTO = "mailto:noah@halteres.ai";
