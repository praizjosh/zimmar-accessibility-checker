import { contrastScore, IssueX } from "@/lib/types";
import { RGBColor } from "wcag-contrast";
import {
  MESSAGE_TYPES,
  MIN_TOUCH_TARGET_SIZE_AAA,
  MIN_TOUCH_TARGET_SPACING,
  TOUCH_TARGET_KEYWORDS,
} from "../constants";
import {
  BackgroundColorResult,
  figmaRGBtoRGBColor,
  getBackgroundColorForNode,
  getContrastCompliance,
  isBoldFont,
} from "../utils";

/**
 * Sends a message to the Figma UI.
 *
 * @param {string} type - The type of the message.
 * @param {unknown} data - The data to be sent with the message.
 */
export function postMessageToUI(type: string, data: unknown) {
  figma.ui.postMessage({ type, data });
}

/**
 * Sends a message to the backend using the Figma plugin API.
 *
 * @param type - The type of the message to be sent.
 * @param payload - An optional object containing additional data to be sent with the message.
 */
export function postMessageToBackend(
  type: string,
  payload: Record<string, unknown> = {},
) {
  parent.postMessage({ pluginMessage: { type, ...payload } }, "*");
}

/**
 * Finds the index of the topmost visible SOLID fill in a Paint array.
 *
 * Figma's fills array is ordered back-to-front — the last entry is
 * rendered on top of the others — so this scans from the end to find
 * the topmost visible SOLID fill, which is what's actually rendered.
 *
 * @param {Paint[]} fills - Array of Paint objects from a Figma node.
 * @returns {number} The index of the topmost visible solid fill, or -1 if
 * none exists (e.g. gradient/image-only fills).
 */
function findTopmostVisibleSolidFillIndex(fills: Paint[]): number {
  for (let i = fills.length - 1; i >= 0; i--) {
    const fill = fills[i];
    if (fill.type === "SOLID" && fill.visible !== false) {
      return i;
    }
  }
  return -1;
}

/**
 * Extracts the foreground color from the given Paint array.
 *
 * @param {Paint[]} nodeFills - Array of Paint objects from a Figma node.
 * @returns {RGBColor | null} The rendered foreground color, or null if
 * no visible solid fill exists (e.g. gradient/image-only fills).
 */
export const extractForegroundColor = (nodeFills: Paint[]): RGBColor | null => {
  const index = findTopmostVisibleSolidFillIndex(nodeFills);
  if (index === -1) return null;
  return figmaRGBtoRGBColor((nodeFills[index] as SolidPaint).color);
};

/**
 * Returns a copy of `fills` with the topmost visible SOLID fill's colour
 * replaced by `color` — the same fill `extractForegroundColor` would report
 * as "what's actually rendered" — so a suggested fix touches exactly the
 * fill that was measured, rather than overwriting the whole fills array and
 * losing other paints/gradients underneath it.
 *
 * @param {Paint[]} fills - Array of Paint objects from a Figma node.
 * @param {RGB} color - The replacement colour, in Figma's 0-1 RGB format.
 * @returns {Paint[] | null} The updated fills array, or null if there was
 * no visible solid fill to replace.
 */
export function replaceTopmostVisibleSolidFillColor(
  fills: Paint[],
  color: RGB,
): Paint[] | null {
  const index = findTopmostVisibleSolidFillIndex(fills);
  if (index === -1) return null;

  return fills.map((fill, i) => (i === index ? { ...fill, color } : fill));
}

/**
 * Creates a typography issue object for the given TextNode.
 *
 * @param {TextNode} node - The Figma TextNode to analyze.
 * @returns {IssueX} An issue object detailing the typography issue.
 */
export const createTypographyIssue = (node: TextNode): IssueX => ({
  description: "Text size is too small for readability.",
  severity: "major",
  type: "TYPOGRAPHY",
  nodeData: {
    id: node.id,
    characters: node.characters,
    fontSize: node.fontSize as number,
    height: node.height,
    lineHeight: node.lineHeight,
    name: node.name,
    nodeType: node.type,
  },
});

/**
 * Determines if a SceneNode is a touch target based on its properties.
 *
 * @param {SceneNode} node - The node to analyze.
 * @returns {Promise<boolean>} True if the node is a touch target, otherwise false.
 */
export const isTouchTarget = async (node: SceneNode): Promise<boolean> => {
  if (!node) return false;
  // if (node.type === "TextNode") return false;

  if ("name" in node && node.type !== "TEXT") {
    const lowerCaseName = node.name.toLowerCase();
    if (
      TOUCH_TARGET_KEYWORDS.some((keyword) => lowerCaseName.includes(keyword))
    ) {
      return true;
    }
  }

  if (node.type === "INSTANCE" && "getMainComponentAsync" in node) {
    const mainComponent = await node.getMainComponentAsync();
    if (
      mainComponent &&
      TOUCH_TARGET_KEYWORDS.some((keyword) =>
        mainComponent.name.toLowerCase().includes(keyword),
      )
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Checks if a SceneNode's size is below the minimum touch target size.
 *
 * @param {SceneNode} node - The node to analyze.
 * @param {number} [minSize] - The minimum size in px to check against; defaults to the WCAG 2.5.5 (AAA) value. Pass TOUCH_TARGET_MIN_SIZE[targetLevel] (constants.ts) to check against the caller's selected WCAG level instead.
 * @returns {boolean} True if the node is too small, otherwise false.
 */
export const isTouchTargetTooSmall = (
  node: SceneNode,
  minSize: number = MIN_TOUCH_TARGET_SIZE_AAA,
): boolean => {
  return (
    "width" in node &&
    "height" in node &&
    (node.width < minSize || node.height < minSize)
  );
};

/**
 * Checks if a SceneNode is too close to other nodes, violating touch target spacing.
 *
 * @param {SceneNode} node - The node to analyze.
 * @param {SceneNode[]} allNodes - The list of all nodes to compare against.
 * @returns {boolean} True if the node is too close to another node, otherwise false.
 */
export const isTouchTargetTooClose = (
  node: SceneNode,
  allNodes: SceneNode[],
): boolean => {
  const nodeBounds = node.absoluteBoundingBox;
  if (!nodeBounds) return false; // Skip if no bounding box

  return allNodes.some((otherNode) => {
    if (node.id === otherNode.id) return false; // Skip the same node

    const otherBounds = otherNode.absoluteBoundingBox;
    if (!otherBounds) return false;

    // Calculate overlap or distance between elements
    const overlapHorizontal = Math.max(
      0,
      Math.min(
        nodeBounds.x + nodeBounds.width,
        otherBounds.x + otherBounds.width,
      ) - Math.max(nodeBounds.x, otherBounds.x),
    );

    const overlapVertical = Math.max(
      0,
      Math.min(
        nodeBounds.y + nodeBounds.height,
        otherBounds.y + otherBounds.height,
      ) - Math.max(nodeBounds.y, otherBounds.y),
    );

    // If they overlap in one dimension, check spacing in the other dimension
    if (overlapVertical > 0) {
      const horizontalDistance = Math.min(
        Math.abs(nodeBounds.x - (otherBounds.x + otherBounds.width)),
        Math.abs(otherBounds.x - (nodeBounds.x + nodeBounds.width)),
      );
      if (horizontalDistance < MIN_TOUCH_TARGET_SPACING) return true;
    }

    if (overlapHorizontal > 0) {
      const verticalDistance = Math.min(
        Math.abs(nodeBounds.y - (otherBounds.y + otherBounds.height)),
        Math.abs(otherBounds.y - (nodeBounds.y + nodeBounds.height)),
      );
      if (verticalDistance < MIN_TOUCH_TARGET_SPACING) return true;
    }

    return false;
  });
};

/**
 * Creates a touch target issue object for the given node.
 *
 * @param {SceneNode} node - The Figma SceneNode to analyze.
 * @param {"Size" | "Spacing"} issueType - The type of issue ("Size" or "Spacing").
 * @param {number} [minSize] - The minimum size in px this node was checked against; defaults to the WCAG 2.5.5 (AAA) value. Only affects the "Size" issue's description/requiredSize text - spacing isn't level-dependent.
 * @returns {IssueX} An issue object detailing the touch target issue.
 */
export const createTouchTargetIssue = (
  node: SceneNode,
  issueType: "Size" | "Spacing",
  minSize: number = MIN_TOUCH_TARGET_SIZE_AAA,
): IssueX | null => {
  if (!node || typeof node !== "object" || !node.id || !node.name) {
    console.error("Invalid node passed to createTouchTargetIssue:", node);
    return null;
  }

  // Ensure width and height are only added if the node supports them
  const hasDimensions = "width" in node && "height" in node;

  return {
    description:
      issueType === "Size"
        ? `Touch target size is too small for accessibility. Should be at least ${minSize}x${minSize} pixels.`
        : "Spacing between touch targets is too small for accessibility. Should be at least 8px to the nearest element in all directions.",
    severity: "minor",
    type: issueType === "Size" ? "TOUCH_TARGET_SIZE" : "TOUCH_TARGET_SPACING",
    nodeData: {
      id: node.id,
      name: node.name,
      width: hasDimensions ? node.width : undefined,
      height: hasDimensions ? node.height : undefined,
      nodeType: node.type,
      requiredSize: `${minSize} x ${minSize}px`,
      requiredSizePx: minSize,
    },
  };
};

/**
 * Creates a contrast issue object for the given TextNode.
 *
 * @param {TextNode} node - The Figma TextNode to analyze.
 * @param {string} contrastScore - The WCAG contrast score.
 * @param {RGBColor} foregroundColor - The text's foreground color in RGB.
 * @param {BackgroundColorResult | null} background - The resolved background colour plus which node contributed it, or null.
 * @param {boolean} isBold - Whether the text is bold, for the large-text contrast threshold.
 * @returns {IssueX} An issue object detailing the contrast issue.
 */
export const createContrastIssue = (
  node: TextNode,
  contrastScore: contrastScore,
  foregroundColor: RGBColor,
  background: BackgroundColorResult | null,
  isBold: boolean,
): IssueX => ({
  description: "Text contrast is below WCAG AA standard.",
  severity: "critical",
  type: "CONTRAST",
  nodeData: {
    id: node.id,
    contrastScore,
    characters: node.characters,
    fontSize: node.fontSize as number,
    height: node.height,
    lineHeight: node.lineHeight,
    name: node.name,
    nodeType: node.type,
    foregroundColor,
    backgroundColor: background?.color,
    backgroundNodeId: background?.nodeId,
    backgroundNodeName: background?.nodeName,
    backgroundSharedWithCount: background?.sharedWithCount,
    isBold,
  },
});

export async function analyzeTextNodeForContrastIssue(
  node: TextNode,
  issues: IssueX[],
) {
  await figma.loadFontAsync(node.fontName as FontName);

  if ("fills" in node) {
    const foregroundColor = extractForegroundColor(node.fills as Paint[]);
    const backgroundResult = getBackgroundColorForNode(node);
    const backgroundColor = backgroundResult?.color;
    const fontWeight: number | symbol = node.fontWeight;
    const fontSize: number | symbol = node.fontSize;

    // Skip nodes with mixed font sizes
    if (fontSize === figma.mixed) return;

    if (!foregroundColor) {
      postMessageToUI(
        MESSAGE_TYPES.NO_FOREGROUND,
        `No solid foreground color detected for the selected layer. Please check the layer's properties.`,
      );
      return;
    }

    if (!backgroundColor) {
      postMessageToUI(
        MESSAGE_TYPES.NO_BACKGROUND,
        `No background elements detected for the selected layer. Please check the layer's properties.`,
      );
      return;
    }

    try {
      if (fontSize != null) {
        const isBold = isBoldFont(fontWeight, node, 0, node.characters.length);
        const contrastScore = getContrastCompliance(
          foregroundColor,
          backgroundColor,
          fontSize,
          isBold,
        );

        if (contrastScore) {
          issues.push(
            createContrastIssue(
              node,
              contrastScore,
              foregroundColor,
              backgroundResult,
              isBold,
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error processing contrast compliance:", error);
    }
  }
}
