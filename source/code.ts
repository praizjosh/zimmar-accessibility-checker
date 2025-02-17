/* eslint-disable no-console */
import { MIN_FONT_SIZE } from "@/lib/constants";
import {
  createContrastIssue,
  createTouchTargetIssue,
  createTypographyIssue,
  extractForegroundColor,
  isTouchTarget,
  isTouchTargetTooClose,
  isTouchTargetTooSmall,
} from "@/lib/figmaUtils";
import { IssueX } from "@/lib/types";
import {
  collectNodes,
  getContrastCompliance,
  getNearestBackgroundColor,
  isBoldFont,
} from "@/lib/utils";

figma.showUI(__html__);
figma.ui.resize(425, 500);

// Global state to track quickcheck mode
let isQuickCheckActive = false;

// Handle messages from the UI
figma.ui.onmessage = async (message) => {
  try {
    if (message.type === "start-quickcheck") {
      isQuickCheckActive = true;
      // console.log("Quickcheck mode activated", isQuickCheckActive);
    }

    if (message.type === "scan") {
      const allTextNodes = figma.currentPage.findAll(
        (node) => node.type === "TEXT",
      ) as TextNode[];

      const allPageNodes: SceneNode[] = [];
      for (const node of figma.currentPage.children) {
        collectNodes(node, allPageNodes);
      }

      const issues: IssueX[] = [];

      for (const node of allTextNodes) {
        if (
          typeof node.fontSize === "number" &&
          node.fontSize < MIN_FONT_SIZE
        ) {
          // Check typography issues
          issues.push(createTypographyIssue(node));
        }

        if ("fills" in node) {
          // Check contrast issues
          const foregroundColor = extractForegroundColor(node.fills as Paint[]);
          const backgroundColor = getNearestBackgroundColor(node) || [
            255, 255, 255,
          ];

          const fontWeight: number | typeof figma.mixed = node.fontWeight;

          const contrastScore = getContrastCompliance(
            foregroundColor,
            backgroundColor,
            node.fontSize as number,
            isBoldFont(fontWeight, node, 0, node.characters.length),
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

      for (const node of allPageNodes) {
        if ("absoluteBoundingBox" in node) {
          const isTarget = await isTouchTarget(node);

          if (isTarget) {
            // console.log(`Node "${node.name}" is identified as a touch target.`);

            if (isTouchTargetTooSmall(node)) {
              // Check touch target size
              const issue = createTouchTargetIssue(node, "Size");
              // console.log("Issue identified:", issue);
              issues.push(issue);
            }
            if (isTouchTargetTooClose(node, [...allPageNodes])) {
              // Check touch target spacing
              const issue = createTouchTargetIssue(node, "Spacing");
              // console.log("Touch Target Spacing Issue Created:", issue);
              issues.push(issue);
            }
          }
          // else {
          //   console.log(
          //     `Node "${node.name}" is NOT identified as a touch target.`,
          //   );
          // }
        } else {
          console.warn(
            `Node "${(node as SceneNode).name}" does not have absoluteBoundingBox.`,
          );
        }
      }

      // console.log(`Scan completed. Total issues identified: ${issues.length}`);
      figma.ui.postMessage({ type: "loadIssues", issues });
    }

    if (message.type === "updateFontSize") {
      const node = (await figma.getNodeByIdAsync(
        message.id,
      )) as TextNode | null;
      if (node && node.type === "TEXT") {
        await figma.loadFontAsync(node.fontName as FontName);
        node.fontSize = message.fontSize;
        // console.log(
        //   `Updated font size for node ${node.id} to ${message.fontSize}`,
        // );
      } else {
        console.warn(`Failed to update font size for node ${message.id}`);
      }
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

    if (message.type === "cancel-quickcheck") {
      isQuickCheckActive = false;
      // console.log("Quickcheck mode deactivated");
    }
  } catch (error) {
    console.error("An error occurred while processing the message:", error);
  }
};

figma.on("selectionchange", async () => {
  if (!isQuickCheckActive) {
    // console.log(
    //   "Quickcheck is not active. Skipping selection change logic.",
    //   isQuickCheckActive,
    // );
    return;
  }

  try {
    // console.log("quickcheck started...");
    const selectedNodes = figma.currentPage.selection;
    const detectedIssues: IssueX[] = []; // Collect all issues

    if (!selectedNodes.length) {
      detectedIssues.length = 0; // Clear detectedIssues if no nodes are selected
      return;
    }

    selectedNodes.forEach((node) => {
      // Size Check
      if (isTouchTargetTooSmall(node)) {
        const issue = createTouchTargetIssue(node, "Size");
        detectedIssues.push(issue);
      }

      // Spacing Check
      if (isTouchTargetTooClose(node, [...figma.currentPage.children])) {
        const issue = createTouchTargetIssue(node, "Spacing");
        detectedIssues.push(issue);
      }

      // Typography Check
      if (node.type === "TEXT" && typeof node.fontSize === "number") {
        if (node.fontSize < MIN_FONT_SIZE) {
          const issue = createTypographyIssue(node);
          detectedIssues.push(issue);
        }
      }

      // Contrast Check
      if (node.type === "TEXT" && "fills" in node) {
        const foregroundColor = extractForegroundColor(node.fills as Paint[]);
        const backgroundColor = getNearestBackgroundColor(node) || [
          255, 255, 255,
        ];
        const fontWeight = node.fontWeight;

        const contrastScore = getContrastCompliance(
          foregroundColor,
          backgroundColor,
          node.fontSize as number,
          isBoldFont(fontWeight, node, 0, node.characters.length),
        );

        const issue = createContrastIssue(
          node,
          contrastScore,
          foregroundColor,
          backgroundColor,
        );

        if (contrastScore === "Fail") {
          detectedIssues.push(issue);
        }
      }
    });

    // Set a single issue for immediate feedback (e.g., the first one)
    if (detectedIssues.length > 0) {
      figma.ui.postMessage({ type: "single-issue", data: detectedIssues });
    }
  } catch (error) {
    console.error("Error in quickcheck selection change handler:", error);
  }
});
