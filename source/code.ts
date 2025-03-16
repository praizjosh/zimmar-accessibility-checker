/* eslint-disable no-console */
import { IssueX } from "@/lib/types";
import {
  getContrastCompliance,
  getNearestBackgroundColor,
  isBoldFont,
} from "@/lib/utils";
import { RGBColor } from "wcag-contrast";

figma.showUI(__html__);
figma.ui.resize(450, 500);

// Helper: Extract foreground color
const extractForegroundColor = (nodeFills: Paint[]): RGBColor => {
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

// Helper: Create a typography issue
const createTypographyIssue = (node: TextNode): IssueX => ({
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

// Helper: Create a contrast issue
const createContrastIssue = (
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
    backgroundColor: backgroundColor || [255, 255, 255],
  },
});

// Constants
const MIN_TOUCH_TARGET_SIZE = 44;

// Helper: Check touch target size
const isTouchTargetTooSmall = (node: SceneNode): boolean => {
  return (
    "width" in node &&
    "height" in node &&
    (node.width < MIN_TOUCH_TARGET_SIZE || node.height < MIN_TOUCH_TARGET_SIZE)
  );
};

// Helper: Create a touch target issue
const createTouchTargetIssue = (node: SceneNode): IssueX => ({
  description: "Touch target size is too small for accessibility.",
  severity: "minor",
  type: "Touch Target Size",
  nodeData: {
    id: node.id,
    name: node.name,
    width: "width" in node ? node.width : undefined,
    height: "height" in node ? node.height : undefined,
    nodeType: node.type,
  },
});

// Handle messages from the UI
figma.ui.onmessage = async (message) => {
  try {
    if (message.type === "scan") {
      console.log("Starting scan...");

      const allNodes = figma.currentPage.findAll();
      const textNodes = figma.currentPage.findAll(
        (node) => node.type === "TEXT",
      ) as TextNode[];

      const issues: IssueX[] = [];

      for (const node of allNodes) {
        // Check touch target issues
        if (isTouchTargetTooSmall(node)) {
          issues.push(createTouchTargetIssue(node));
        }
      }

      for (const node of textNodes) {
        // Check typography issues
        if (typeof node.fontSize === "number" && node.fontSize < 11) {
          issues.push(createTypographyIssue(node));
        }

        // Check contrast issues
        if ("fills" in node) {
          const foregroundColor = extractForegroundColor(node.fills as Paint[]);
          const backgroundColor = getNearestBackgroundColor(node) || [
            255, 255, 255,
          ];
          const contrastScore = getContrastCompliance(
            foregroundColor,
            backgroundColor,
            node.fontSize as number,
            isBoldFont(node.fontWeight as number),
          );

          if (contrastScore === "Fail") {
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
      }

      console.log(`Scan completed. Total issues identified: ${issues.length}`);
      figma.ui.postMessage({ type: "loadIssues", issues });
    }

    if (message.type === "navigate") {
      const node = (await figma.getNodeByIdAsync(message.id)) as SceneNode;
      if (node) {
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
      } else {
        console.warn(`Node with ID ${message.id} not found.`);
      }
    }

    if (message.type === "updateFontSize") {
      const node = (await figma.getNodeByIdAsync(
        message.id,
      )) as TextNode | null;
      if (node && node.type === "TEXT") {
        await figma.loadFontAsync(node.fontName as FontName);
        node.fontSize = message.fontSize;
        console.log(
          `Updated font size for node ${node.id} to ${message.fontSize}`,
        );
      } else {
        console.warn(`Failed to update font size for node ${message.id}`);
      }
    }
  } catch (error) {
    console.error("An error occurred while processing the message:", error);
  }
};

// Handle selection change to provide dynamic feedback
figma.on("selectionchange", () => {
  const selectedNode = figma.currentPage.selection[0];
  console.log("Selected node:", selectedNode);

  if (selectedNode && selectedNode.type === "TEXT" && "fills" in selectedNode) {
    const foregroundColor = extractForegroundColor(
      selectedNode.fills as Paint[],
    );
    const backgroundColor = getNearestBackgroundColor(selectedNode);

    const compliance = getContrastCompliance(
      foregroundColor,
      backgroundColor || [255, 255, 255],
      selectedNode.fontSize as number,
      isBoldFont(selectedNode.fontWeight as number),
    );

    figma.ui.postMessage({ type: "single-issue", compliance });

    console.log(
      `Contrast compliance for node "${selectedNode.name}" (${selectedNode.id}): ${compliance}`,
    );

    if (selectedNode && isTouchTargetTooSmall(selectedNode)) {
      console.log(
        `Selected node "${selectedNode.name}" has a touch target issue.`,
      );
    }
  }
});