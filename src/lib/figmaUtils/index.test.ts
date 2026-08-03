import { describe, expect, it } from "vitest";
import solidFill from "@/lib/test-utils/solidFill";
import {
  extractForegroundColor,
  isTouchTargetTooClose,
  isTouchTargetTooSmall,
} from "./index";

function fakeNode(
  id: string,
  bounds: { x: number; y: number; width: number; height: number },
): SceneNode {
  return {
    id,
    width: bounds.width,
    height: bounds.height,
    absoluteBoundingBox: bounds,
  } as unknown as SceneNode;
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

describe("isTouchTargetTooSmall", () => {
  it("returns false when both dimensions meet the 44px minimum", () => {
    const node = fakeNode("a", { x: 0, y: 0, width: 44, height: 44 });

    expect(isTouchTargetTooSmall(node)).toBe(false);
  });

  it("returns true when width is below the minimum", () => {
    const node = fakeNode("a", { x: 0, y: 0, width: 43, height: 44 });

    expect(isTouchTargetTooSmall(node)).toBe(true);
  });

  it("returns true when height is below the minimum", () => {
    const node = fakeNode("a", { x: 0, y: 0, width: 44, height: 43 });

    expect(isTouchTargetTooSmall(node)).toBe(true);
  });

  it("returns false for a node without width/height properties", () => {
    const node = { id: "a" } as unknown as SceneNode;

    expect(isTouchTargetTooSmall(node)).toBe(false);
  });
});

describe("isTouchTargetTooClose", () => {
  const node = fakeNode("a", { x: 0, y: 0, width: 44, height: 44 });

  it("returns false when there is no bounding box", () => {
    const boundsless = { id: "a" } as unknown as SceneNode;

    expect(isTouchTargetTooClose(boundsless, [])).toBe(false);
  });

  it("excludes the node itself from the comparison", () => {
    expect(isTouchTargetTooClose(node, [node])).toBe(false);
  });

  it("returns false when nodes are far apart", () => {
    const other = fakeNode("b", { x: 500, y: 500, width: 44, height: 44 });

    expect(isTouchTargetTooClose(node, [node, other])).toBe(false);
  });

  it("returns true when vertically overlapping nodes are closer than 8px horizontally", () => {
    const other = fakeNode("b", { x: 49, y: 0, width: 44, height: 44 });

    expect(isTouchTargetTooClose(node, [node, other])).toBe(true);
  });

  it("returns true when horizontally overlapping nodes are closer than 8px vertically", () => {
    const other = fakeNode("b", { x: 0, y: 49, width: 44, height: 44 });

    expect(isTouchTargetTooClose(node, [node, other])).toBe(true);
  });

  it("returns false when overlapping nodes have at least 8px of spacing", () => {
    const other = fakeNode("b", { x: 52, y: 0, width: 44, height: 44 });

    expect(isTouchTargetTooClose(node, [node, other])).toBe(false);
  });
});
