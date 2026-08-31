import Svg, { Circle, Rect } from "react-native-svg";
import { palette } from "@/lib/theme";

type HaltereMarkProps = {
  size?: number;
  color?: string;
};

/** Ancient jumping-weight mark — the literal haltere. */
export function HaltereMark({
  size = 56,
  color = palette.blue,
}: HaltereMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="15" cy="33" r="13" fill={color} />
      <Circle cx="49" cy="31" r="13" fill={color} />
      <Rect x="14" y="27.5" width="36" height="8" rx="4" fill={color} />
      <Circle cx="15" cy="33" r="5" fill={palette.paper} opacity={0.35} />
      <Circle cx="49" cy="31" r="5" fill={palette.paper} opacity={0.35} />
    </Svg>
  );
}
