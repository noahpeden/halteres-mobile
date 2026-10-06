import { Platform } from "react-native";

/**
 * App Store guideline 4.8: a third-party login (Google) on iOS also requires
 * an equivalent privacy option. Sign in with Apple is not shipped yet, so
 * Google stays hidden on iOS. Flip this when Apple is ready — the Google
 * component and OAuth path remain in the tree.
 */
export const SIGN_IN_WITH_APPLE_READY = false;

export const SHOW_GOOGLE_SIGN_IN =
  Platform.OS !== "ios" || SIGN_IN_WITH_APPLE_READY;
