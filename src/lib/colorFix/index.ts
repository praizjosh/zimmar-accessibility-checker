import { rgb, RGBColor } from "wcag-contrast";

export type ColorFixDirection = "foreground" | "background";

export type ColorFixSuggestion = {
  color: RGBColor;
  ratio: number;
  /**
   * Which way the suggested colour actually moved from the original. Not
   * assumed from `direction` - if the foreground happens to already be the
   * darker of the two colours, darkening it further would move it toward
   * the background and make contrast worse, not better; lightening it is
   * the correct fix in that case. The UI label ("Darken text" vs "Lighten
   * text") should reflect this field, not a hardcoded direction-to-label map.
   */
  adjustment: "darker" | "lighter";
};

const AA_NORMAL_RATIO = 4.5;
const AA_LARGE_RATIO = 3;
const AAA_NORMAL_RATIO = 7;
const AAA_LARGE_RATIO = 4.5;

// Survives rounding when the suggested hex is re-measured after being
// rendered back to an integer RGB triple.
const RATIO_BUFFER = 0.05;

// Binary search over CIELAB L* (range 0-100): 20 iterations gives ~0.0001
// precision, far finer than perceptible - cheap, so no reason to cut corners.
const MAX_ITERATIONS = 20;

function isLargeText(fontSize: number, isBold: boolean): boolean {
  return fontSize >= 18 || (isBold && fontSize >= 14);
}

function getRequiredRatio(targetLevel: "AA" | "AAA", large: boolean): number {
  if (targetLevel === "AAA") return large ? AAA_LARGE_RATIO : AAA_NORMAL_RATIO;
  return large ? AA_LARGE_RATIO : AA_NORMAL_RATIO;
}

// --- sRGB <-> CIELAB (D65 illuminant) ---
// Plain HSL lightness was considered and rejected: it isn't perceptually
// uniform, so darkening a saturated blue in HSL can visibly shift toward
// purple. CIELAB's L* axis holds perceived hue/chroma steady while lightness
// changes, which is what "here's a good suggestion" actually requires.

const D65 = { x: 0.95047, y: 1.0, z: 1.08883 };

function srgbChannelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(channel: number): number {
  const value =
    channel <= 0.0031308
      ? channel * 12.92
      : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, value)) * 255);
}

type Xyz = { x: number; y: number; z: number };

function rgbToXyz([r, g, b]: RGBColor): Xyz {
  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);

  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175,
    z: rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041,
  };
}

function xyzToRgb({ x, y, z }: Xyz): RGBColor {
  const rl = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const gl = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const bl = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return [
    linearChannelToSrgb(rl),
    linearChannelToSrgb(gl),
    linearChannelToSrgb(bl),
  ];
}

function labForwardTransform(t: number): number {
  const delta = 6 / 29;
  return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29;
}

function labInverseTransform(t: number): number {
  const delta = 6 / 29;
  return t > delta ? t ** 3 : 3 * delta ** 2 * (t - 4 / 29);
}

type Lab = { l: number; a: number; b: number };

function rgbToLab(color: RGBColor): Lab {
  const { x, y, z } = rgbToXyz(color);
  const fx = labForwardTransform(x / D65.x);
  const fy = labForwardTransform(y / D65.y);
  const fz = labForwardTransform(z / D65.z);

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function labToRgb({ l, a, b }: Lab): RGBColor {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;

  return xyzToRgb({
    x: D65.x * labInverseTransform(fx),
    y: D65.y * labInverseTransform(fy),
    z: D65.z * labInverseTransform(fz),
  });
}

function withChroma(lab: Lab, scale: number): Lab {
  return { l: lab.l, a: lab.a * scale, b: lab.b * scale };
}

/**
 * Binary-searches a colour's CIELAB lightness toward `targetPole` (0 or
 * 100), returning the candidate closest to the original lightness that
 * still clears `requiredRatio` against `fixed`, or null if even the pole
 * itself can't reach it (at either full or reduced chroma).
 */
function walkLightnessToward(
  original: RGBColor,
  fixed: RGBColor,
  targetPole: 0 | 100,
  requiredRatio: number,
): RGBColor | null {
  const originalLab = rgbToLab(original);
  const achieves = (lab: Lab) => rgb(labToRgb(lab), fixed);

  const searchAtChroma = (chromaScale: number): RGBColor | null => {
    const atPole = achieves(
      withChroma({ ...originalLab, l: targetPole }, chromaScale),
    );
    if (atPole < requiredRatio + RATIO_BUFFER) return null;

    // lo starts as a confirmed "doesn't clear the target" point (the
    // original lightness - if it already cleared it, suggestAccessibleColor
    // would have returned null before ever calling this), hi as a confirmed
    // "clears it" point (the pole, just checked above). Standard bisection
    // narrows both toward the boundary regardless of which is numerically
    // larger, so this works whether targetPole is 0 or 100.
    let lo: number = originalLab.l;
    let hi: number = targetPole;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const mid = (lo + hi) / 2;
      const midRatio = achieves(
        withChroma({ ...originalLab, l: mid }, chromaScale),
      );

      if (midRatio >= requiredRatio + RATIO_BUFFER) {
        hi = mid;
      } else {
        lo = mid;
      }
    }

    return labToRgb(withChroma({ ...originalLab, l: hi }, chromaScale));
  };

  // Pass 1: pure lightness walk, hue/chroma unchanged.
  const pureLightness = searchAtChroma(1);
  if (pureLightness) return pureLightness;

  // Pass 2 (rare): very saturated colours can't reach some targets at full
  // saturation while staying in-gamut. Reduce chroma too and try again.
  // Verified reachable, not just theoretical: e.g. pure blue [0,0,255]
  // against mid-gray [160,160,160] at AAA needs this pass - full-chroma
  // clipping alone doesn't get dark enough, chroma-reduced does.
  return searchAtChroma(0.5);
}

/**
 * Suggests an accessible replacement for either the foreground or the
 * background colour of a failing contrast pair, walking CIELAB lightness
 * toward whichever pole (darker or lighter) actually increases contrast -
 * see the `adjustment` field on the result, which isn't assumed from
 * `direction` alone. Returns null if the pair is already compliant at the
 * requested level, or if no in-gamut candidate exists in either direction.
 */
export function suggestAccessibleColor(
  foreground: RGBColor,
  background: RGBColor,
  fontSize: number,
  isBold: boolean,
  targetLevel: "AA" | "AAA",
  direction: ColorFixDirection,
): ColorFixSuggestion | null {
  const requiredRatio = getRequiredRatio(
    targetLevel,
    isLargeText(fontSize, isBold),
  );
  const currentRatio = rgb(foreground, background);

  if (currentRatio >= requiredRatio) return null;

  const adjustable = direction === "foreground" ? foreground : background;
  const fixed = direction === "foreground" ? background : foreground;
  const originalL = rgbToLab(adjustable).l;

  const darker = walkLightnessToward(adjustable, fixed, 0, requiredRatio);
  const lighter = walkLightnessToward(adjustable, fixed, 100, requiredRatio);

  const candidates: Array<{
    color: RGBColor;
    adjustment: "darker" | "lighter";
  }> = [];
  if (darker) candidates.push({ color: darker, adjustment: "darker" });
  if (lighter) candidates.push({ color: lighter, adjustment: "lighter" });

  if (candidates.length === 0) return null;

  // Prefer whichever reachable pole required the smaller lightness change -
  // closer to the designer's original colour, not the most extreme option.
  const best = candidates.reduce((closest, candidate) => {
    const candidateDelta = Math.abs(rgbToLab(candidate.color).l - originalL);
    const closestDelta = Math.abs(rgbToLab(closest.color).l - originalL);
    return candidateDelta < closestDelta ? candidate : closest;
  });

  return {
    color: best.color,
    ratio: rgb(best.color, fixed),
    adjustment: best.adjustment,
  };
}
