/* eslint-disable no-console */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { score, rgb, RGBColor } from "wcag-contrast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSeverityStylesa = (
  severity: string | undefined,
  isCritical: boolean = false,
  isMajor: boolean = false,
  isMinor: boolean = false,
  isIcon: boolean = false,
) =>
  cn(
    severity === "critical" && "text-rose-600",
    isCritical && severity === "critical" && "text-rose-600 font-bold",
    isIcon &&
      isCritical &&
      severity === "critical" &&
      "mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade",

    severity === "major" && "text-orange-500",
    isMajor && severity === "major" && "text-orange-500 font-bold",
    isIcon &&
      isMajor &&
      severity === "major" &&
      "mr-3 size-5 rounded-full bg-orange-600 p-1 text-dark-shade",

    severity === "minor" && "text-amber-500",
    isMinor && severity === "minor" && "text-amber-500 font-bold",
    isIcon &&
      isMinor &&
      severity === "minor" &&
      "mr-3 size-5 rounded-full bg-amber-600 p-1 text-dark-shade",
  );

export const getSeverityStyles = (
  severity: string | undefined,
  {
    isIcon = false,
    isBold = false,
  }: { isIcon?: boolean; isBold?: boolean } = {},
) => {
  const baseStyles = {
    critical: "text-rose-500",
    major: "text-orange-500",
    minor: "text-amber-500",
  };

  const boldStyles = {
    critical: "font-bold",
    major: "font-bold",
    minor: "font-bold",
  };

  const iconStyles = {
    critical: "mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade",
    major: "mr-3 size-5 rounded-full bg-orange-600 p-1 text-dark-shade",
    minor: "mr-3 size-5 rounded-full bg-amber-500 p-1 text-dark-shade",
  };

  return cn(
    baseStyles[(severity as keyof typeof baseStyles) ?? ""] || "",
    isBold && boldStyles[(severity as keyof typeof baseStyles) ?? ""],
    isIcon && iconStyles[(severity as keyof typeof baseStyles) ?? ""],
  );
};

/**
 * Recursively collects all nodes in a scene graph starting from the given node.
 *
 * @param node - The starting node from which to begin collecting nodes.
 * @param collectedNodes - An array to store the collected nodes.
 */
export const collectNodes = (node: SceneNode, collectedNodes: SceneNode[]) => {
  collectedNodes.push(node);
  if ("children" in node) {
    for (const child of node.children) {
      collectNodes(child, collectedNodes);
    }
  }
};

/**
 * Determines if the specified font weight or range of font weights is bold.
 *
 * @param {number | symbol} fontWeight - The font weight to evaluate.
 * @param {TextNode} [node] - The Figma TextNode, required for mixed font weight ranges.
 * @param {number} [start] - The start of the range to check (inclusive).
 * @param {number} [end] - The end of the range to check (exclusive).
 * @returns {boolean} True if the font or range contains bold font weight, otherwise false.
 */
export const isBoldFont = (
  fontWeight: number | symbol,
  node: TextNode,
  start?: number,
  end?: number,
): boolean => {
  // Default to false if fontWeight is falsy
  if (!fontWeight) return false;

  // Handle mixed font weight
  if (
    fontWeight === figma.mixed &&
    node &&
    typeof start === "number" &&
    typeof end === "number"
  ) {
    const textLength = node.characters.length;

    // Ensure valid range
    if (start < 0 || end > textLength || start >= end) {
      console.warn("Invalid range:", { start, end, textLength });
      return false;
    }

    for (let i = start; i < end; i++) {
      try {
        const rangeFontWeight = node.getRangeFontWeight(i, i + 1);
        if (typeof rangeFontWeight === "number" && rangeFontWeight >= 700) {
          return true; // Found bold within the range
        }
      } catch (error) {
        console.error("Error getting font weight for range:", { i, error });
        return false;
      }
    }
    return false; // No bold font found in the range
  }

  // Validate and evaluate single font weight
  if (typeof fontWeight !== "number") {
    console.warn("Invalid fontWeight value:", fontWeight);
    return false;
  }

  // Return true if fontWeight is bold
  return fontWeight >= 700;
};

// export const isBoldFont = (fontWeight: number | symbol): boolean => {
//   // Skip processing if fontWeight is figma.mixed
//   if (fontWeight === figma.mixed) {
//     console.warn("Skipping node with figma.mixed fontWeight.");
//     return false;
//   }

//   // Validate fontWeight type
//   if (typeof fontWeight !== "number") {
//     console.warn("Invalid fontWeight type:", fontWeight);
//     return false;
//   }

//   // Check if fontWeight is bold
//   return fontWeight >= 700;
// };

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

  // console.log("pairContrastRatio res: ", pairContrastRatio);
  return score(pairContrastRatio);
}

/**
 * Determines the WCAG compliance level for text contrast.
 *
 * @param foregroundColor - The foreground color in rgb format.
 * @param backgroundColor - The background color in rgb format.
 * @param fontSize - The font size in pixels.
 * @param isBold - Whether the text is bold. Defaults to `false`.
 * @returns The WCAG compliance level as one of "AAA", "AA", "AAA Large", "AA Large", or "Fail" and the contrast ratio.
 */
export function getContrastCompliance(
  foregroundColor: RGBColor,
  backgroundColor: RGBColor,
  fontSize: number | symbol,
  isBold: boolean = false,
): {
  compliance: "AAA" | "AA" | "AAA Large" | "AA Large" | "Fail";
  ratio: number;
} {
  if (
    typeof fontSize !== "number" ||
    isNaN(fontSize) ||
    typeof fontSize === "symbol"
  ) {
    console.error("Invalid fontSize:", fontSize);
    return { compliance: "Fail", ratio: 0 }; // Fallback for invalid inputs
  }

  const ratio: number = rgb(foregroundColor, backgroundColor); // Ensure `rgb` handles errors gracefully

  // Check if the font qualifies as "large text" under WCAG standards
  const isLargeText: boolean = fontSize >= 18 || (isBold && fontSize >= 14);

  // Determine compliance level based on contrast ratio and text size
  if (isLargeText) {
    if (ratio >= 4.5) {
      return { compliance: "AAA Large", ratio }; // Large text meeting AAA standards
    } else if (ratio >= 3) {
      return { compliance: "AA Large", ratio }; // Large text meeting AA standards
    }
  } else {
    if (ratio >= 7) {
      return { compliance: "AAA", ratio }; // Normal text meeting AAA standards
    } else if (ratio >= 4.5) {
      return { compliance: "AA", ratio }; // Normal text meeting AA standards
    }
  }

  return { compliance: "Fail", ratio }; // Text does not meet any WCAG standards
}

/**
 * Recursively gets the background color of the nearest ancestor node with a valid background color.
 *
 * @param node The starting node (child node).
 * @returns {RGBColor | null} The background color in rgb format, or null if not found.
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
      }
    }
  }

  // console.log("No valid background color found in ancestor nodes.");
  return null;
}

/**
 * Utility function to get the background color of the selected node in Figma.
 * It checks the parent FRAME's background or the sibling RECTANGLE directly below the node.
 * @param {SceneNode} node - The node to check the background for.
 * @returns {RGBColor | null} The background color in rgb format, or null if not found.
 */
export function getBackgroundColorOfNode(node: SceneNode): RGBColor | null {
  // Case 1: Parent FRAME's background
  if (node.parent && node.parent.type === "FRAME") {
    const frame = node.parent as FrameNode;
    // console.log("isFrame: ", frame);

    if (frame.backgrounds.length > 0) {
      const background = frame.backgrounds[0];

      if (background.type === "SOLID") {
        const { r, g, b } = background.color;
        const frameColor: RGBColor = [
          Math.round(r * 255),
          Math.round(g * 255),
          Math.round(b * 255),
        ];

        // console.log(`Parent frame background: ${frameColor}`);
        figma.notify(`Parent frame background: ${frameColor}`);
        return frameColor;
      }
    }
  }

  // Case 2: Background from sibling RECTANGLE layer
  const allNodes = figma.currentPage.children;
  const nodeIndex = allNodes.indexOf(node);
  // console.log("allNodes: ", allNodes);
  // console.log("nodeIndex: ", nodeIndex);

  if (nodeIndex > 0) {
    const possibleBackgroundNode = allNodes[nodeIndex - 1];
    // console.log("first possibleBackgroundNode:", possibleBackgroundNode);

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

        // console.log(`Background rectangle color: ${rectColor}`);
        figma.notify(`Background rectangle color: ${rectColor}`);
        return rectColor;
      }
    }
  }

  // console.log("No background color found for selection!");
  figma.notify("No background color found for selection!");
  return null;
}

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

  const backgroundImage = computedStyle.backgroundImage;

  return { backgroundColor, backgroundImage };
}

// Helper function to check if two nodes overlap
function overlaps(node1: SceneNode, node2: SceneNode): boolean {
  const bounds1 = node1.absoluteBoundingBox;
  const bounds2 = node2.absoluteBoundingBox;

  if (!bounds1 || !bounds2) return false;

  return !(
    bounds1.x > bounds2.x + bounds2.width ||
    bounds1.x + bounds1.width < bounds2.x ||
    bounds1.y > bounds2.y + bounds2.height ||
    bounds1.y + bounds1.height < bounds2.y
  );
}

export function getBackgroundColorForTextNode(
  textNode: TextNode | undefined,
): RGBColor | null {
  if (!textNode) return null;
  // Check if the text node has a parent
  if (!textNode.parent) return null;

  const parent = textNode.parent;

  // Case 1: Parent has fills (most common case)
  if ("fills" in parent && parent.fills && Array.isArray(parent.fills)) {
    const nodeFills: Paint[] = parent.fills;
    const solidFill = nodeFills.find(
      (fill) => fill.type === "SOLID" && fill.visible,
    );
    if (solidFill && "color" in solidFill) {
      // return solidFill.color;
      const { r, g, b } = solidFill.color;
      const rectColor: RGBColor = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
      ];
      return rectColor;
    }
  }

  // Case 2: Look for frame/rectangle siblings that might be positioned behind the text
  if ("children" in parent) {
    // Get the index of our text node
    const textNodeIndex = parent.children.indexOf(textNode);

    // Look at nodes before our text node (they would be behind the text in z-order)
    for (let i = 0; i < textNodeIndex; i++) {
      const sibling = parent.children[i];
      if ("fills" in sibling && sibling.fills && Array.isArray(sibling.fills)) {
        // Check if this sibling is positioned under our text node
        if (overlaps(sibling, textNode)) {
          const solidFill = sibling.fills.find(
            (fill) => fill.type === "SOLID" && fill.visible,
          );
          if (solidFill && "color" in solidFill) {
            const { r, g, b } = solidFill.color;
            const rectColor: RGBColor = [
              Math.round(r * 255),
              Math.round(g * 255),
              Math.round(b * 255),
            ];
            return rectColor;
          }
        }
      }
    }
  }

  // Case 3: Recursively check parent's parent
  if (parent.parent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getBackgroundColorForTextNode(parent as any);
  }

  return null;
}
