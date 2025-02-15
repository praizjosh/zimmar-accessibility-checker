/* eslint-disable no-console */
import { IssueX } from "@/lib/types";
import { RGBColor } from "wcag-contrast";

// Constants
const MIN_TOUCH_TARGET_SIZE = 48; // Minimum touch target size (48x48)
const MIN_TOUCH_TARGET_SPACING = 8; // Minimum spacing between touch targets

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
    const { r, g, b } = nodeFills[0].color;
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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
  contrastScore: string,
  foregroundColor: RGBColor,
  backgroundColor: RGBColor | null,
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
    backgroundColor: backgroundColor || [255, 255, 255], // Default white
  },
});

/**
 * Determines if a SceneNode is a touch target based on its properties.
 *
 * @param {SceneNode} node - The node to analyze.
 * @returns {Promise<boolean>} True if the node is a touch target, otherwise false.
 */
export const isTouchTarget = async (node: SceneNode): Promise<boolean> => {
  const touchTargetKeywords = ["btn", "button", "link", "touch"];

  if ("name" in node) {
    const lowerCaseName = node.name.toLowerCase();
    if (
      touchTargetKeywords.some((keyword) => lowerCaseName.includes(keyword))
    ) {
      return true;
    }
  }

  if (node.type === "INSTANCE" && "getMainComponentAsync" in node) {
    const mainComponent = await node.getMainComponentAsync();
    if (
      mainComponent &&
      touchTargetKeywords.some((keyword) =>
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

    // Check horizontal and vertical proximity
    const isTooCloseHorizontally =
      Math.abs(nodeBounds.x - otherBounds.x) < MIN_TOUCH_TARGET_SPACING ||
      Math.abs(nodeBounds.x + nodeBounds.width - otherBounds.x) <
        MIN_TOUCH_TARGET_SPACING;

    const isTooCloseVertically =
      Math.abs(nodeBounds.y - otherBounds.y) < MIN_TOUCH_TARGET_SPACING ||
      Math.abs(nodeBounds.y + nodeBounds.height - otherBounds.y) <
        MIN_TOUCH_TARGET_SPACING;

    console.log(`Node 1 Bounds:`, nodeBounds);
    console.log(`Node 2 Bounds:`, otherBounds);
    console.log(
      `Horizontal Proximity:`,
      Math.abs(nodeBounds.x - otherBounds.x),
    );
    console.log(`Vertical Proximity:`, Math.abs(nodeBounds.y - otherBounds.y));
    console.log(
      `Is Too Close:`,
      isTooCloseHorizontally && isTooCloseVertically,
    );

    return isTooCloseHorizontally && isTooCloseVertically;
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
): IssueX => ({
  description:
    issueType === "Size"
      ? "Touch target size is too small for accessibility. Should be at least 48x48 pixels."
      : "Spacing between touch targets is too small for accessibility. Should be at least 8px to the nearest element in all directions.",
  severity: "minor",
  type: issueType === "Size" ? "Touch Target Size" : "Touch Target Spacing",
  nodeData: {
    id: node.id,
    name: node.name,
    width: "width" in node ? node.width : undefined,
    height: "height" in node ? node.height : undefined,
    nodeType: node.type,
  },
});
