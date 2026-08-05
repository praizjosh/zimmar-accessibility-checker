import { describe, expect, it, vi } from "vitest";
import solidFill from "@/lib/test-utils/solidFill";
import {
  createContrastIssue,
  createTouchTargetIssue,
  createTypographyIssue,
  extractForegroundColor,
  isTouchTarget,
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

describe("isTouchTarget", () => {
  function fakeSceneNode(
    name: string,
    type: SceneNode["type"] = "FRAME",
  ): SceneNode {
    return { id: "n", name, type } as unknown as SceneNode;
  }

  function fakeInstanceNode(
    name: string,
    mainComponentName: string | null,
  ): SceneNode {
    return {
      id: "n",
      name,
      type: "INSTANCE",
      getMainComponentAsync: vi.fn(() =>
        Promise.resolve(mainComponentName ? { name: mainComponentName } : null),
      ),
    } as unknown as SceneNode;
  }

  it("returns false for a falsy node", async () => {
    expect(await isTouchTarget(null as unknown as SceneNode)).toBe(false);
  });

  it("returns true when the node's own name matches a touch-target keyword", async () => {
    expect(await isTouchTarget(fakeSceneNode("Primary Button"))).toBe(true);
  });

  it("matches keywords case-insensitively", async () => {
    expect(await isTouchTarget(fakeSceneNode("PRIMARY BTN"))).toBe(true);
  });

  it("returns false when the name matches a keyword but the node is a TEXT node", async () => {
    expect(await isTouchTarget(fakeSceneNode("Button label", "TEXT"))).toBe(
      false,
    );
  });

  it("returns false when neither the name nor the type matches anything", async () => {
    expect(
      await isTouchTarget(fakeSceneNode("Background rectangle", "RECTANGLE")),
    ).toBe(false);
  });

  it("falls back to the main component's name for an INSTANCE whose own name doesn't match", async () => {
    const node = fakeInstanceNode("Icon 24", "Button/Primary");

    expect(await isTouchTarget(node)).toBe(true);
  });

  it("returns false for an INSTANCE when neither its name nor its main component's name matches", async () => {
    const node = fakeInstanceNode("Icon 24", "Icon/Chevron");

    expect(await isTouchTarget(node)).toBe(false);
  });

  it("returns false for an INSTANCE with no resolvable main component", async () => {
    const node = fakeInstanceNode("Icon 24", null);

    expect(await isTouchTarget(node)).toBe(false);
  });
});

describe("createTypographyIssue", () => {
  it("builds a TYPOGRAPHY issue from a TextNode", () => {
    const node = {
      id: "text-1",
      characters: "Hello",
      fontSize: 10,
      height: 12,
      lineHeight: { unit: "AUTO" },
      name: "Label",
      type: "TEXT",
    } as unknown as TextNode;

    expect(createTypographyIssue(node)).toEqual({
      description: "Text size is too small for readability.",
      severity: "major",
      type: "TYPOGRAPHY",
      nodeData: {
        id: "text-1",
        characters: "Hello",
        fontSize: 10,
        height: 12,
        lineHeight: { unit: "AUTO" },
        name: "Label",
        nodeType: "TEXT",
      },
    });
  });
});

describe("createContrastIssue", () => {
  function fakeTextNode(): TextNode {
    return {
      id: "text-2",
      characters: "Hi",
      fontSize: 16,
      height: 20,
      lineHeight: { unit: "AUTO" },
      name: "Body",
      type: "TEXT",
    } as unknown as TextNode;
  }

  it("builds a CONTRAST issue with the given colours and score", () => {
    const contrastScore = { compliance: "Fail" as const, ratio: 2.1 };

    expect(
      createContrastIssue(
        fakeTextNode(),
        contrastScore,
        [0, 0, 0],
        [255, 255, 255],
      ),
    ).toEqual({
      description: "Text contrast is below WCAG AA standard.",
      severity: "critical",
      type: "CONTRAST",
      nodeData: {
        id: "text-2",
        contrastScore,
        characters: "Hi",
        fontSize: 16,
        height: 20,
        lineHeight: { unit: "AUTO" },
        name: "Body",
        nodeType: "TEXT",
        foregroundColor: [0, 0, 0],
        backgroundColor: [255, 255, 255],
      },
    });
  });

  it("leaves backgroundColor undefined instead of defaulting to white when none was detected", () => {
    const issue = createContrastIssue(
      fakeTextNode(),
      { compliance: "Fail", ratio: 2.1 },
      [0, 0, 0],
      undefined,
    );

    expect(issue.nodeData.backgroundColor).toBeUndefined();
  });
});

describe("createTouchTargetIssue", () => {
  it("returns null and logs an error for an invalid node", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      createTouchTargetIssue(null as unknown as SceneNode, "Size"),
    ).toBeNull();
    expect(createTouchTargetIssue({} as SceneNode, "Size")).toBeNull();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("builds a TOUCH_TARGET_SIZE issue with dimensions when the node has them", () => {
    const node = {
      id: "n1",
      name: "Icon button",
      type: "FRAME",
      width: 20,
      height: 20,
    } as unknown as SceneNode;

    expect(createTouchTargetIssue(node, "Size")).toEqual({
      description:
        "Touch target size is too small for accessibility. Should be at least 44x44 pixels.",
      severity: "minor",
      type: "TOUCH_TARGET_SIZE",
      nodeData: {
        id: "n1",
        name: "Icon button",
        width: 20,
        height: 20,
        nodeType: "FRAME",
        requiredSize: "44 x 44px",
      },
    });
  });

  it("builds a TOUCH_TARGET_SPACING issue", () => {
    const node = {
      id: "n2",
      name: "Icon button",
      type: "FRAME",
      width: 44,
      height: 44,
    } as unknown as SceneNode;

    const issue = createTouchTargetIssue(node, "Spacing");

    expect(issue?.type).toBe("TOUCH_TARGET_SPACING");
    expect(issue?.description).toBe(
      "Spacing between touch targets is too small for accessibility. Should be at least 8px to the nearest element in all directions.",
    );
  });

  it("omits width/height when the node doesn't support them", () => {
    const node = {
      id: "n3",
      name: "Group",
      type: "GROUP",
    } as unknown as SceneNode;

    const issue = createTouchTargetIssue(node, "Size");

    expect(issue?.nodeData.width).toBeUndefined();
    expect(issue?.nodeData.height).toBeUndefined();
  });
});
