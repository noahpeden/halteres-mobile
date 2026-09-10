/**
 * Beta is free: never surface subscribe / upgrade / Stripe copy from APIs.
 * Real generation failures still pass through unchanged.
 */
const PAID_PLAN_COPY =
  /\b(subscribe|subscription required|upgrade to|upgrade your|pricing|checkout|stripe|paid plan|trial (has )?expired|no (active )?subscription|generations remaining)\b/i;

export function athleteFacingError(
  message: string | null | undefined,
  fallback = "Something went wrong. Please try again.",
): string {
  const text = (message || "").trim();
  if (!text) return fallback;
  if (PAID_PLAN_COPY.test(text)) {
    return "Generation is unavailable right now. Please try again.";
  }
  return text;
}
