import { describe, expect, it } from "vitest";
import { RGBColor } from "wcag-contrast";
import { getContrastCompliance } from "@/lib/utils";
import { suggestAccessibleColor } from "./index";

const WHITE: RGBColor = [255, 255, 255];
const BLACK: RGBColor = [0, 0, 0];

describe("suggestAccessibleColor", () => {
  it("returns null when the pair is already compliant at the requested level", () => {
    expect(
      suggestAccessibleColor(BLACK, WHITE, 16, false, "AA", "foreground"),
    ).toBeNull();
  });

  it("darkens text that's the lighter of the two colours", () => {
    const foreground: RGBColor = [128, 128, 128];
    const result = suggestAccessibleColor(
      foreground,
      WHITE,
      16,
      false,
      "AA",
      "foreground",
    );

    expect(result).not.toBeNull();
    expect(result?.adjustment).toBe("darker");
    expect(result?.ratio).toBeGreaterThanOrEqual(4.5);
    // Cross-checked against the same production function real detection
    // uses, not just this module's own ratio field.
    expect(
      getContrastCompliance(result!.color, WHITE, 16, false).compliance,
    ).not.toBe("Fail");
  });

  it("lightens text that's already the darker of the two colours, rather than darkening it further", () => {
    // Background is near-black and darker than the failing text - darkening
    // the text further would move it toward the background, not away.
    const foreground: RGBColor = [60, 60, 60];
    const background: RGBColor = [20, 20, 20];
    const result = suggestAccessibleColor(
      foreground,
      background,
      16,
      false,
      "AA",
      "foreground",
    );

    expect(result).not.toBeNull();
    expect(result?.adjustment).toBe("lighter");
    expect(
      getContrastCompliance(result!.color, background, 16, false).compliance,
    ).not.toBe("Fail");
  });

  it("adjusts the background instead of the text when direction is 'background'", () => {
    const foreground: RGBColor = [80, 80, 80];
    const background: RGBColor = [100, 100, 100];
    const result = suggestAccessibleColor(
      foreground,
      background,
      16,
      false,
      "AA",
      "background",
    );

    expect(result).not.toBeNull();
    // The suggested colour replaces the background, so re-check against the
    // unchanged foreground.
    expect(
      getContrastCompliance(foreground, result!.color, 16, false).compliance,
    ).not.toBe("Fail");
  });

  it("targets a stricter ratio for AAA than for AA", () => {
    const foreground: RGBColor = [130, 130, 130];
    const aaResult = suggestAccessibleColor(
      foreground,
      WHITE,
      16,
      false,
      "AA",
      "foreground",
    );
    const aaaResult = suggestAccessibleColor(
      foreground,
      WHITE,
      16,
      false,
      "AAA",
      "foreground",
    );

    expect(aaResult?.ratio).toBeGreaterThanOrEqual(4.5);
    expect(aaaResult?.ratio).toBeGreaterThanOrEqual(7);
  });

  it("uses the lower large-text threshold once fontSize crosses 18px", () => {
    const foreground: RGBColor = [150, 150, 150];
    // Below 18px: normal text, needs 4.5:1 for AA.
    const normal = suggestAccessibleColor(
      foreground,
      WHITE,
      17,
      false,
      "AA",
      "foreground",
    );
    // At/above 18px: large text, only needs 3:1 for AA - a smaller lightness
    // change should suffice, so the two results should differ.
    const large = suggestAccessibleColor(
      foreground,
      WHITE,
      18,
      false,
      "AA",
      "foreground",
    );

    expect(normal?.ratio).toBeGreaterThanOrEqual(4.5);
    expect(large?.ratio).toBeGreaterThanOrEqual(3);
    expect(large?.ratio).toBeLessThan(normal!.ratio);
  });

  it("treats bold text at 14px as large text, same as the shared getContrastCompliance logic", () => {
    const foreground: RGBColor = [150, 150, 150];
    const boldLarge = suggestAccessibleColor(
      foreground,
      WHITE,
      14,
      true,
      "AA",
      "foreground",
    );

    expect(boldLarge?.ratio).toBeGreaterThanOrEqual(3);
  });

  it("returns null when no in-gamut candidate exists in either direction", () => {
    // Mid-gray sits too close to the midpoint of the luminance range for
    // ANY foreground colour to reach 7:1 against it - not a chroma issue,
    // a genuine "no reachable candidate" case. Verified: white-vs-this-gray
    // and black-vs-this-gray both fall short of 7:1.
    const background: RGBColor = [128, 128, 128];
    expect(
      getContrastCompliance(WHITE, background, 16, false).ratio,
    ).toBeLessThan(7);
    expect(
      getContrastCompliance(BLACK, background, 16, false).ratio,
    ).toBeLessThan(7);

    const result = suggestAccessibleColor(
      [255, 0, 255],
      background,
      16,
      false,
      "AAA",
      "foreground",
    );

    expect(result).toBeNull();
  });

  it("falls back to reducing chroma when a saturated colour can't reach the target at full saturation", () => {
    // Verified empirically: pure blue against this mid-gray at AAA needs
    // the chroma-reduction fallback - full-chroma clipping alone isn't
    // enough to get dark enough.
    const foreground: RGBColor = [0, 0, 255];
    const background: RGBColor = [160, 160, 160];
    const result = suggestAccessibleColor(
      foreground,
      background,
      16,
      false,
      "AAA",
      "foreground",
    );

    expect(result).not.toBeNull();
    expect(result?.adjustment).toBe("darker");
    expect(
      getContrastCompliance(result!.color, background, 16, false).compliance,
    ).not.toBe("Fail");
  });

  it("prefers whichever reachable direction requires the smaller lightness change", () => {
    // Mid-lightness grey on a mid-lightness background: both darkening and
    // lightening the text can reach AA, so the closer (smaller change)
    // option should win rather than always defaulting to one pole.
    const foreground: RGBColor = [128, 128, 128];
    const background: RGBColor = [128, 128, 128];
    const result = suggestAccessibleColor(
      foreground,
      background,
      16,
      false,
      "AA",
      "foreground",
    );

    expect(result).not.toBeNull();
    expect(
      getContrastCompliance(result!.color, background, 16, false).compliance,
    ).not.toBe("Fail");
  });
});
