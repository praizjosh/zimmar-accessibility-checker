/* eslint-disable no-console */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { score, rgb, RGBColor } from "wcag-contrast";

export default function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Recursive function to collect all nodes
export const collectNodes = (node: SceneNode, collectedNodes: SceneNode[]) => {
  collectedNodes.push(node);
  if ("children" in node) {
    for (const child of node.children) {
      collectNodes(child, collectedNodes);
    }
  }
};

/**
 * Evaluate the WCAG contrast score between two colors.
 * @param foreground - The foreground color in hex (e.g., "#FFFFFF").
 * @param background - The background color in hex (e.g., "#000000").
 * @returns A string indicating the WCAG score ("AA", "AA Large", "AAA", etc.) or "Fail".
 */
export function getContrastScore(
  foreground: RGBColor,
  background: RGBColor,

  // foreground: string,
  // background: string,
): string {
  // const pairContrastScore = hex(foreground, background); // for hex
  const pairContrastRatio = rgb(foreground, background); // returns a number

  console.log("pairContrastRatio res: ", pairContrastRatio);
  return score(pairContrastRatio);
}

/**
 * Determines the WCAG compliance level for text contrast.
 *
 * @param foregroundColor - The foreground color in rgb format.
 * @param backgroundColor - The background color in rgb format.
 * @param fontSize - The font size in pixels.
 * @param isBold - Whether the text is bold. Defaults to `false`.
 * @returns The WCAG compliance level as one of "AAA", "AA", "AAA Large", "AA Large", or "Fail".
 */
export function getContrastCompliance(
  foregroundColor: RGBColor,
  backgroundColor: RGBColor,
  fontSize: number,
  isBold: boolean = false,
): "AAA" | "AA" | "AAA Large" | "AA Large" | "Fail" {
  const ratio: number = rgb(foregroundColor, backgroundColor); // returns a number

  // console.log("isBold?: ", isBold);
  // console.log("ratio res: ", ratio);

  // Check if the font qualifies as "large text" under WCAG standards
  const isLargeText: boolean = fontSize >= 18 || (isBold && fontSize >= 14);

  // Determine compliance level based on contrast ratio and text size
  if (isLargeText) {
    if (ratio >= 4.5) {
      return "AAA Large"; // Large text meeting AAA standards
    } else if (ratio >= 3) {
      return "AA Large"; // Large text meeting AA standards
    }
  } else {
    if (ratio >= 7) {
      return "AAA"; // Normal text meeting AAA standards
    } else if (ratio >= 4.5) {
      return "AA"; // Normal text meeting AA standards
    } else if (ratio >= 3) {
      return "AA Large"; // Normal text meeting AA Large standards
    }
  }

  return "Fail"; // Text does not meet any WCAG standards
}

// Example usage:
// const compliance = getContrastCompliance("#ffffff", "#333333", 16);
// console.log(`Compliance: ${compliance}`); // Outputs: "AA", "AA Large", etc.

export function getComputedBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { backgroundColor: any; backgroundImage: string } | null {
  if (!element) return null;

  // Get the computed style of the element
  const computedStyle = window.getComputedStyle(element);

  // Retrieve the background-related properties
  const backgroundColor = computedStyle.backgroundColor;

  console.log("what's bgcolor in fn:", backgroundColor);
  const backgroundImage = computedStyle.backgroundImage;

  return { backgroundColor, backgroundImage };
}

export /**
 * Utility function to get the background color of the selected node in Figma.
 * It checks the parent FRAME's background or the sibling RECTANGLE directly below the node.
 * @param {SceneNode} node - The node to check the background for.
 * @returns {RGBColor | null} The background color in rgb format, or null if not found.
 */
function getBackgroundColorOfNode(node: SceneNode): RGBColor | null {
  // Case 1: Parent FRAME's background
  if (node.parent && node.parent.type === "FRAME") {
    const frame = node.parent as FrameNode;
    console.log("isFrame: ", frame);

    if (frame.backgrounds.length > 0) {
      const background = frame.backgrounds[0];

      if (background.type === "SOLID") {
        const { r, g, b } = background.color;
        const frameColor: RGBColor = [
          Math.round(r * 255),
          Math.round(g * 255),
          Math.round(b * 255),
        ];

        console.log(`Parent frame background: ${frameColor}`);
        figma.notify(`Parent frame background: ${frameColor}`);
        return frameColor;
      }
    }
  }

  // Case 2: Background from sibling RECTANGLE layer
  const allNodes = figma.currentPage.children;
  const nodeIndex = allNodes.indexOf(node);
  // console.log("allNodes: ", allNodes);
  console.log("nodeIndex: ", nodeIndex);

  if (nodeIndex > 0) {
    const possibleBackgroundNode = allNodes[nodeIndex - 1];
    console.log("first possibleBackgroundNode:", possibleBackgroundNode);

    if (possibleBackgroundNode.type === "RECTANGLE") {
      const rect = possibleBackgroundNode as RectangleNode;
      const rectFills = rect.fills as Paint[];
      if (rectFills.length > 0 && rectFills[0].type === "SOLID") {
        const { r, g, b } = rectFills[0].color;
        const rectColor: RGBColor = [
          Math.round(r * 255),
          Math.round(g * 255),
          Math.round(b * 255),
        ];

        console.log(`Background rectangle color: ${rectColor}`);
        figma.notify(`Background rectangle color: ${rectColor}`);
        return rectColor;
      }
    }
  }

  console.log("No background color found for selection!");
  figma.notify("No background color found for selection!");
  return null;
}

/**
 * Recursively gets the background color of the nearest ancestor node with a valid background color.
 *
 * @param node The starting node (child node).
 * @returns The background color in hexadecimal format (e.g., "#RRGGBB"), or `null` if not found.
 */
export function getNearestBackgroundColor(node: SceneNode): RGBColor | null {
  let currentNode: BaseNode | null = node;

  while (currentNode && currentNode.parent) {
    currentNode = currentNode.parent;

    // Skip nodes that cannot have background colors
    if (
      currentNode.type === "GROUP" ||
      currentNode.type === "COMPONENT" ||
      currentNode.type === "INSTANCE"
    ) {
      continue;
    }

    if ("fills" in currentNode && Array.isArray(currentNode.fills)) {
      const fills = currentNode.fills as Paint[];
      const solidPaint = fills.find(
        (paint) => paint.type === "SOLID" && paint.visible !== false,
      ) as SolidPaint | undefined;

      if (solidPaint) {
        const { r, g, b } = solidPaint.color;
        const nearestBackgroundColor: RGBColor = [
          Math.round(r * 255),
          Math.round(g * 255),
          Math.round(b * 255),
        ];

        return nearestBackgroundColor;
        // const toHex = (value: number) =>
        //   Math.round(value * 255)
        //     .toString(16)
        //     .padStart(2, "0");
        // return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
    }
  }

  console.log("No valid background color found in ancestor nodes.");
  return null;
}

export const isBoldFont = (fontWeight: number | undefined): boolean => {
  if (!fontWeight) return false; // Default to false if undefined
  return fontWeight >= 700; // Bold is typically 700 or above
};
