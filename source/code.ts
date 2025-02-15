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
figma.ui.resize(450, 500);

// Handle messages from the UI
figma.ui.onmessage = async (message) => {
  try {
    if (message.type === "scan") {
      console.log("Starting scan...");

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
        // const isTarget = await isTouchTarget(node);
        // console.log(`Node "${node.name}" for touch isTarget status:`, isTarget);

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
          console.log(
            `Node "${(node as SceneNode).name}" does not have absoluteBoundingBox.`,
          );
        }
      }

      console.log(`Scan completed. Total issues identified: ${issues.length}`);
      figma.ui.postMessage({ type: "loadIssues", issues });
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

    if (message.type === "navigate") {
      const node = (await figma.getNodeByIdAsync(message.id)) as SceneNode;
      if (node) {
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
      } else {
        console.warn(`Node with ID ${message.id} not found.`);
      }
    }
  } catch (error) {
    console.error("An error occurred while processing the message:", error);
  }
};

// Handle selection change to provide dynamic feedback
figma.on("selectionchange", async () => {
  const selectedNode = figma.currentPage.selection[0];
  console.log("Selected node:", selectedNode);

  const selectedNodes = figma.currentPage.selection;
  console.log("Selected nodes ==>: ", selectedNodes);

  selectedNodes.forEach((node) => {
    if (isTouchTargetTooSmall(node)) {
      // Check size
      const issue = createTouchTargetIssue(node, "Size");
      console.log(`Issue identified: ${issue.description}`);
      figma.notify(`Issue identified: ${issue.description}`);
    }
    if (isTouchTargetTooClose(node, [...figma.currentPage.children])) {
      // Check spacing
      const issue = createTouchTargetIssue(node, "Spacing");
      console.log(`Issue identified: ${issue.description}`);
      figma.notify(`Issue identified: ${issue.description}`);
    }
  });

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

    figma.notify(
      `Contrast compliance for node "${selectedNode.name}" (${selectedNode.id}): ${compliance}`,
    );
  }
});
