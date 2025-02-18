import { MIN_FONT_SIZE } from "@/lib/constants";
import {
  createContrastIssue,
  createTouchTargetIssue,
  createTypographyIssue,
  extractForegroundColor,
  isTouchTarget,
  isTouchTargetTooClose,
  isTouchTargetTooSmall,
  postMessageToUI,
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
      // console.log("Is Quickcheck mode activated in init? ", isQuickCheckActive);

      postMessageToUI("quickcheck-active", isQuickCheckActive);

      // console.log("quickcheck-active Message sent:", {
      //   type: "quickcheck-active",
      //   data: isQuickCheckActive,
      // });
    }

    if (message.type === "cancel-quickcheck") {
      isQuickCheckActive = false;
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

          try {
            if (isBoldFont(fontWeight)) {
              // Process bold font node
              const contrastScore = getContrastCompliance(
                foregroundColor,
                backgroundColor,
                node.fontSize as number,
                // isBoldFont(fontWeight, node, 0, node.characters.length),
                isBoldFont(fontWeight),
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
          } catch (error) {
            console.error("Error processing contrast compliance:", error);
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
              if (issue) {
                issues.push(issue);
              }
            }
            if (isTouchTargetTooClose(node, [...allPageNodes])) {
              // Check touch target spacing
              const issue = createTouchTargetIssue(node, "Spacing");
              // console.log("Touch Target Spacing Issue Created:", issue);
              if (issue) {
                issues.push(issue);
              }
            }
          }
        } else {
          console.warn(
            `Node "${(node as SceneNode).name}" does not have absoluteBoundingBox.`,
          );
        }
      }

      postMessageToUI("loadIssues", issues);
    }

    if (message.type === "updateFontSize") {
      const node = (await figma.getNodeByIdAsync(
        message.id,
      )) as TextNode | null;
      if (node && node.type === "TEXT") {
        await figma.loadFontAsync(node.fontName as FontName);
        node.fontSize = message.fontSize;
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
    // Log the error to the console, but don't stop execution
    console.error("An error occurred while processing the message:", error);
  }
};

figma.on("selectionchange", async () => {
  // console.log("Selection change detected.");

  if (!isQuickCheckActive) {
    // console.log(
    //   "Quickcheck is not active. Skipping single selection change logic.",
    //   isQuickCheckActive,
    // );
    return;
  }

  // console.log(
  //   "Is Quickcheck mode activated in selectionchange fn? ",
  //   isQuickCheckActive,
  // );

  try {
    // console.log("quickcheck started and waiting for user selection...");
    const selectedNodes = figma.currentPage.selection;
    const detectedIssues: IssueX[] = []; // Collect all issues

    if (!selectedNodes.length) {
      detectedIssues.length = 0; // Clear detectedIssues if no nodes are selected
      return;
    }

    selectedNodes.forEach((node) => {
      // console.log("Processing node:", node.name);

      // Size Check
      if (isTouchTargetTooSmall(node)) {
        const issue = createTouchTargetIssue(node, "Size");
        if (issue) {
          detectedIssues.push(issue);
        }
      }

      // Spacing Check
      if (isTouchTargetTooClose(node, [...figma.currentPage.children])) {
        const issue = createTouchTargetIssue(node, "Spacing");
        // detectedIssues.push(issue);
        if (issue) {
          detectedIssues.push(issue);
        }
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

        try {
          if (isBoldFont(fontWeight)) {
            const contrastScore = getContrastCompliance(
              foregroundColor,
              backgroundColor,
              node.fontSize as number,
              isBoldFont(fontWeight),
            );

            if (contrastScore === "Fail") {
              detectedIssues.push(
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
    });

    if (detectedIssues.length) {
      // console.log("Detected issues being sent to UI:", detectedIssues);
      postMessageToUI("detected-issue", detectedIssues);
    }
  } catch (error) {
    console.error("Error in quickcheck selection change handler:", error);
  }
});
