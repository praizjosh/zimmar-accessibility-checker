import { contrastScore, IssueX } from "@/lib/types";
import { RGBColor } from "wcag-contrast";
import {
  MIN_TOUCH_TARGET_SIZE,
  MIN_TOUCH_TARGET_SPACING,
  TOUCH_TARGET_KEYWORDS,
} from "./constants";
import {
  figmaRGBtoRGBColor,
  getBackgroundColorForNode,
  getContrastCompliance,
  isBoldFont,
} from "./utils";

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
 * Extracts the foreground color from the given Paint array.
 *
 * @param {Paint[]} nodeFills - Array of Paint objects from a Figma node.
 * @returns {RGBColor} An RGB array representing the foreground color.
 */
export const extractForegroundColor = (nodeFills: Paint[]): RGBColor => {
  if (
    nodeFills.length > 0 &&
    nodeFills[0].type === "SOLID" &&
    nodeFills[0].visible !== false
  ) {
    return figmaRGBtoRGBColor(nodeFills[0].color);
  }
  return [0, 0, 0]; // Default black
};

/**
 * Creates a typography issue object for the given TextNode.
 *
 * @param {TextNode} node - The Figma TextNode to analyze.
 * @returns {IssueX} An issue object detailing the typography issue.
 */
export const createTypographyIssue = (node: TextNode): IssueX => ({
  description: "Text size is too small for readability.",
  severity: "major",
  type: "Typography",
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
 * @returns {boolean} True if the node is too small, otherwise false.
 */
export const isTouchTargetTooSmall = (node: SceneNode): boolean => {
  return (
    "width" in node &&
    "height" in node &&
    (node.width < MIN_TOUCH_TARGET_SIZE || node.height < MIN_TOUCH_TARGET_SIZE)
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
 * @returns {IssueX} An issue object detailing the touch target issue.
 */
export const createTouchTargetIssue = (
  node: SceneNode,
  issueType: "Size" | "Spacing",
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
        ? "Touch target size is too small for accessibility. Should be at least 44x44 pixels."
        : "Spacing between touch targets is too small for accessibility. Should be at least 8px to the nearest element in all directions.",
    severity: "minor",
    type: issueType === "Size" ? "Touch Target Size" : "Touch Target Spacing",
    nodeData: {
      id: node.id,
      name: node.name,
      width: hasDimensions ? node.width : undefined,
      height: hasDimensions ? node.height : undefined,
      nodeType: node.type,
      requiredSize: `${MIN_TOUCH_TARGET_SIZE} x ${MIN_TOUCH_TARGET_SIZE}px`,
    },
  };
};

/**
 * Creates a contrast issue object for the given TextNode.
 *
 * @param {TextNode} node - The Figma TextNode to analyze.
 * @param {string} contrastScore - The WCAG contrast score.
 * @param {RGBColor} foregroundColor - The text's foreground color in RGB.
 * @param {RGBColor | null} backgroundColor - The background color in RGB or null.
 * @returns {IssueX} An issue object detailing the contrast issue.
 */
export const createContrastIssue = (
  node: TextNode,
  contrastScore: contrastScore,
  foregroundColor: RGBColor,
  backgroundColor: RGBColor | undefined,
): IssueX => ({
  description: "Text contrast is below WCAG AA standard.",
  severity: "critical",
  type: "Contrast",
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
    backgroundColor: backgroundColor, // || [255, 255, 255]
  },
});

export async function analyzeTextNodeForContrastIssue(
  node: TextNode,
  issues: IssueX[],
) {
  await figma.loadFontAsync(node.fontName as FontName);

  if ("fills" in node) {
    const foregroundColor = extractForegroundColor(node.fills as Paint[]);
    const backgroundColor = getBackgroundColorForNode(node);
    const fontWeight: number | symbol = node.fontWeight;
    const fontSize: number | symbol = node.fontSize;

    // Skip nodes with mixed font sizes
    if (fontSize === figma.mixed) return;

    if (!backgroundColor) {
      postMessageToUI(
        "no-background",
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
              backgroundColor,
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error processing contrast compliance:", error);
    }
  }
}
