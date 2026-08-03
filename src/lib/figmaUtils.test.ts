import { describe, expect, it } from "vitest";
import { extractForegroundColor } from "./figmaUtils";

function solidFill(
  r: number,
  g: number,
  b: number,
  visible: boolean = true,
): Paint {
  return { type: "SOLID", visible, color: { r, g, b } } as Paint;
}

describe("extractForegroundColor", () => {
  it("returns the color of a single visible solid fill", () => {
    const fills = [solidFill(1, 0, 0)];

    expect(extractForegroundColor(fills)).toEqual([255, 0, 0]);
  });

  it("returns the topmost (last) visible solid fill, not the first", () => {
    const fills = [solidFill(1, 0, 0), solidFill(0, 0, 1)];

    expect(extractForegroundColor(fills)).toEqual([0, 0, 255]);
  });

  it("skips an invisible fill on top and falls back to the visible solid beneath it", () => {
    const fills = [solidFill(1, 0, 0), solidFill(0, 0, 1, false)];

    expect(extractForegroundColor(fills)).toEqual([255, 0, 0]);
  });

  it("skips non-solid fills (e.g. gradients) when scanning for the topmost solid", () => {
    const gradient = { type: "GRADIENT_LINEAR", visible: true } as Paint;
    const fills = [solidFill(0, 1, 0), gradient];

    expect(extractForegroundColor(fills)).toEqual([0, 255, 0]);
  });

  it("returns null when there are no fills", () => {
    expect(extractForegroundColor([])).toBeNull();
  });

  it("returns null when no fill is a visible solid", () => {
    const gradient = { type: "GRADIENT_LINEAR", visible: true } as Paint;
    const invisibleSolid = solidFill(1, 1, 1, false);

    expect(extractForegroundColor([gradient, invisibleSolid])).toBeNull();
  });
});
