import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { RGBColor, rgb } from "wcag-contrast";
import solidFill from "@/lib/test-utils/solidFill";
import {
  copyToClipboard,
  getBackgroundColorForNode,
  getContrastCompliance,
  getRouteForIssueType,
  getSeverityStyles,
  isBoldFont,
} from "./index";

const WHITE: RGBColor = [255, 255, 255];
const BLACK: RGBColor = [0, 0, 0];

function expectedCompliance(
  ratio: number,
  isLargeText: boolean,
): "AAA" | "AA" | "AAA Large" | "AA Large" | "Fail" {
  if (isLargeText) {
    if (ratio >= 4.5) return "AAA Large";
    if (ratio >= 3) return "AA Large";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

async function invokeCopyToClipboard(text = "hello") {
  const onSuccess = vi.fn();
  const onError = vi.fn();
  await copyToClipboard({ text, onSuccess, onError });
  return { onSuccess, onError };
}

describe("copyToClipboard", () => {
  const originalClipboard = navigator.clipboard;
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    setClipboard(originalClipboard);
    document.execCommand = originalExecCommand;
    vi.restoreAllMocks();
  });

  it("uses navigator.clipboard.writeText when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    document.execCommand = vi.fn();

    const { onSuccess, onError } = await invokeCopyToClipboard();

    expect(writeText).toHaveBeenCalledWith("hello");
    expect(document.execCommand).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("falls back to document.execCommand when navigator.clipboard.writeText rejects", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    document.execCommand = vi.fn().mockReturnValue(true);

    const { onSuccess, onError } = await invokeCopyToClipboard();

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("falls back to document.execCommand when navigator.clipboard is unavailable (Figma plugin iframe)", async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn().mockReturnValue(true);

    const { onSuccess, onError } = await invokeCopyToClipboard();

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError when document.execCommand fails", async () => {
    setClipboard(undefined);
    document.execCommand = vi.fn().mockReturnValue(false);

    const { onSuccess, onError } = await invokeCopyToClipboard();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});

describe("getContrastCompliance", () => {
  it("reports AAA for black-on-white normal text (max ratio)", () => {
    const result = getContrastCompliance(BLACK, WHITE, 16, false);

    expect(result.ratio).toBeCloseTo(21, 0);
    expect(result.compliance).toBe("AAA");
  });

  it("reports AAA Large (not plain AAA) for large text at the same max ratio", () => {
    const result = getContrastCompliance(BLACK, WHITE, 24, false);

    expect(result.compliance).toBe("AAA Large");
  });

  it("treats fontSize >= 18 as large text", () => {
    const large = getContrastCompliance(BLACK, WHITE, 18, false);
    const normal = getContrastCompliance(BLACK, WHITE, 17, false);

    expect(large.compliance).toBe("AAA Large");
    expect(normal.compliance).toBe("AAA");
  });

  it("treats bold fontSize >= 14 as large text, but not bold fontSize 13", () => {
    const boldLarge = getContrastCompliance(BLACK, WHITE, 14, true);
    const boldNotLarge = getContrastCompliance(BLACK, WHITE, 13, true);

    expect(boldLarge.compliance).toBe("AAA Large");
    expect(boldNotLarge.compliance).toBe("AAA");
  });

  it("matches the WCAG threshold spec for a mid-contrast gray-on-white pair", () => {
    const gray: RGBColor = [118, 118, 118];
    const ratio = rgb(gray, WHITE);

    const normalResult = getContrastCompliance(gray, WHITE, 16, false);
    const largeResult = getContrastCompliance(gray, WHITE, 24, false);

    expect(normalResult.ratio).toBeCloseTo(ratio);
    expect(normalResult.compliance).toBe(expectedCompliance(ratio, false));
    expect(largeResult.compliance).toBe(expectedCompliance(ratio, true));
  });

  it("reports Fail for near-identical low-contrast colors", () => {
    const result = getContrastCompliance(
      [128, 128, 128],
      [140, 140, 140],
      16,
      false,
    );

    expect(result.compliance).toBe("Fail");
    expect(result.ratio).toBeLessThan(3);
  });

  it("falls back to Fail/0 for an invalid fontSize", () => {
    const nanResult = getContrastCompliance(BLACK, WHITE, NaN, false);
    const mixedResult = getContrastCompliance(
      BLACK,
      WHITE,
      Symbol("mixed"),
      false,
    );

    expect(nanResult).toEqual({ compliance: "Fail", ratio: 0 });
    expect(mixedResult).toEqual({ compliance: "Fail", ratio: 0 });
  });
});

type Bounds = { x: number; y: number; width: number; height: number };

function nodeWithEarlierSibling(
  nodeBounds: Bounds,
  siblingBounds: Bounds,
  siblingFills: Paint[],
): SceneNode {
  const sibling = {
    id: "sibling",
    fills: siblingFills,
    absoluteBoundingBox: siblingBounds,
  };
  const node: Record<string, unknown> = {
    id: "node",
    absoluteBoundingBox: nodeBounds,
  };
  node.parent = { fills: [], children: [sibling, node] };
  return node as unknown as SceneNode;
}

describe("getBackgroundColorForNode", () => {
  it("returns null when the node has no parent", () => {
    const node = { parent: null } as unknown as SceneNode;

    expect(getBackgroundColorForNode(node)).toBeNull();
  });

  it("returns the parent's solid fill color", () => {
    const node = {
      parent: { fills: [solidFill(1, 0, 0)] },
    } as unknown as SceneNode;

    expect(getBackgroundColorForNode(node)).toEqual([255, 0, 0]);
  });

  it("skips an invisible parent fill and returns null when no sibling covers it", () => {
    const node = {
      parent: { fills: [solidFill(1, 0, 0, false)], children: [] },
    } as unknown as SceneNode;

    expect(getBackgroundColorForNode(node)).toBeNull();
  });

  it("falls back to an overlapping earlier sibling's fill when the parent has no fill", () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };
    const node = nodeWithEarlierSibling(bounds, bounds, [solidFill(0, 1, 0)]);

    expect(getBackgroundColorForNode(node)).toEqual([0, 255, 0]);
  });

  it("ignores a non-overlapping earlier sibling and returns null", () => {
    const node = nodeWithEarlierSibling(
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 500, y: 500, width: 10, height: 10 },
      [solidFill(0, 1, 0)],
    );

    expect(getBackgroundColorForNode(node)).toBeNull();
  });
});

describe("getSeverityStyles", () => {
  it("returns the base text colour for each severity", () => {
    expect(getSeverityStyles("critical")).toBe("text-rose-500");
    expect(getSeverityStyles("major")).toBe("text-orange-500");
    expect(getSeverityStyles("minor")).toBe("text-amber-500");
  });

  it("returns an empty string for an unrecognised or missing severity", () => {
    expect(getSeverityStyles(undefined)).toBe("");
    expect(getSeverityStyles("not-a-severity")).toBe("");
  });

  it("adds font-bold when isBold is set", () => {
    expect(getSeverityStyles("critical", { isBold: true })).toBe(
      "text-rose-500 font-bold",
    );
  });

  it("returns the filled circular icon treatment when isIcon is set, overriding the base text colour", () => {
    expect(getSeverityStyles("major", { isIcon: true })).toBe(
      "mr-3 size-5 rounded-full bg-orange-600 p-1 text-dark-shade",
    );
  });

  it("returns a solid badge (background colour, dark text) when isBadge is set, overriding the base text colour", () => {
    // Regression guard for the bug this replaced: IssuesOverviewList.tsx used
    // to hardcode its own bg-{severity}-500 classes inline, independently of
    // this helper, which is exactly the kind of drift a single source of
    // truth is meant to prevent (it had drifted to a different red for
    // "critical": bg-red-500 here vs text-rose-500 in this helper).
    expect(getSeverityStyles("critical", { isBadge: true })).toBe(
      "bg-rose-500 text-dark-shade",
    );
    expect(getSeverityStyles("major", { isBadge: true })).toBe(
      "bg-orange-500 text-dark-shade",
    );
    expect(getSeverityStyles("minor", { isBadge: true })).toBe(
      "bg-amber-500 text-dark-shade",
    );
  });
});

describe("getRouteForIssueType", () => {
  it("routes touch target issues to TOUCH_TARGET_ISSUE_LIST_VIEW", () => {
    expect(getRouteForIssueType("TOUCH_TARGET_SIZE")).toBe(
      "TOUCH_TARGET_ISSUE_LIST_VIEW",
    );
    expect(getRouteForIssueType("TOUCH_TARGET_SPACING")).toBe(
      "TOUCH_TARGET_ISSUE_LIST_VIEW",
    );
  });

  it("routes everything else to ISSUE_LIST_VIEW", () => {
    expect(getRouteForIssueType("CONTRAST")).toBe("ISSUE_LIST_VIEW");
    expect(getRouteForIssueType("TYPOGRAPHY")).toBe("ISSUE_LIST_VIEW");
  });
});

describe("isBoldFont", () => {
  // isBoldFont reads figma.mixed unconditionally (even for the plain-number
  // path), so it needs a minimal figma global — real code gets this from
  // Figma's plugin sandbox at runtime, which isn't present under vitest.
  const FIGMA_MIXED = Symbol("figma.mixed");

  beforeAll(() => {
    vi.stubGlobal("figma", { mixed: FIGMA_MIXED });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  function fakeTextNode(
    characters: string,
    rangeWeights: (number | typeof FIGMA_MIXED)[],
  ): TextNode {
    return {
      characters,
      getRangeFontWeight: vi.fn((start: number) => rangeWeights[start]),
    } as unknown as TextNode;
  }

  it("returns false for a falsy fontWeight", () => {
    expect(isBoldFont(0, {} as TextNode)).toBe(false);
  });

  it("returns false for a fontWeight below 700", () => {
    expect(isBoldFont(699, {} as TextNode)).toBe(false);
  });

  it("returns true for a fontWeight of 700 or more", () => {
    expect(isBoldFont(700, {} as TextNode)).toBe(true);
  });

  it("returns false and warns for a non-numeric, non-mixed fontWeight", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(isBoldFont("garbage" as unknown as number, {} as TextNode)).toBe(
      false,
    );
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("returns false and warns when fontWeight is mixed but no start/end range is given", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(isBoldFont(FIGMA_MIXED, fakeTextNode("ab", []))).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("returns false and warns for an invalid range (start >= end)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const node = fakeTextNode("hello", [400, 400, 400, 400, 400]);

    expect(isBoldFont(FIGMA_MIXED, node, 3, 1)).toBe(false);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("returns true when any character in a mixed-weight range is bold", () => {
    const node = fakeTextNode("hello", [400, 400, 700, 400, 400]);

    expect(isBoldFont(FIGMA_MIXED, node, 0, 5)).toBe(true);
  });

  it("returns false when no character in a mixed-weight range is bold", () => {
    const node = fakeTextNode("hello", [400, 400, 400, 400, 400]);

    expect(isBoldFont(FIGMA_MIXED, node, 0, 5)).toBe(false);
  });

  it("skips a mixed (non-numeric) per-character weight and keeps scanning the range", () => {
    const node = fakeTextNode("hi", [FIGMA_MIXED, 700]);

    expect(isBoldFont(FIGMA_MIXED, node, 0, 2)).toBe(true);
  });

  it("returns false and logs an error when getRangeFontWeight throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const node = {
      characters: "hi",
      getRangeFontWeight: vi.fn(() => {
        throw new Error("boom");
      }),
    } as unknown as TextNode;

    expect(isBoldFont(FIGMA_MIXED, node, 0, 2)).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
