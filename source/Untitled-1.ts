/* eslint-disable no-console */

// BEFORE ZUSTAND

import { Issue } from "@/lib/types";
import { getBackgroundColorOfNode, getContrastScore } from "@/lib/utils";
import { RGBColor } from "wcag-contrast";

// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// Constants for easier configuration and readability
// const MAX_LIKES = 400;
// const MAX_COMMENTS = 50;

// Utility function to get variant based on name
// const getVariant = (node: any, variantName: string) => {
//   console.log("typeof node ==> ", node);
//   return node.type === "COMPONENT" && node.name === variantName ? node : null;
// };

// This shows the HTML page in "ui.html".
// figma.showUI(__html__, {
//   height: 500,
//   width: 500,
// });

figma.showUI(__html__);

figma.ui.resize(450, 500);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the posted message.

// Listen for actions from the UI
figma.ui.onmessage = async (message) => {
  console.log("message received from frontend: ", message);

  if (message.type === "scan") {
    const issues: Issue[] = [];
    let currentIndex = 0;

    // Get all nodes in the current page
    const nodes: SceneNode[] = figma.currentPage.findAll(
      (node) => node.type === "TEXT",
    );

    // const nodes: SceneNode[] = [];
    // for (const node of figma.currentPage.children) {
    //   collectNodes(node, nodes);
    // }

    // Analyze collected nodes
    for (const node of nodes) {
      if (
        node.type === "TEXT" &&
        typeof node.fontSize === "number" &&
        node.fontSize < 12
      ) {
        // console.log("TEXT node properties ==> ", node);

        issues.push({
          type: "Typography",
          description: "Text size is too small",
          severity: "High",
          id: node.id,
          fontSize: node.fontSize,
          nodeType: node.type,
          node, // Save the entire node object
        });
      }
    }

    // figma.ui.postMessage({
    //   type: "loadIssues",
    //   issues,
    //   // issues: issues.map((node, index) => ({ id: node.id, index })),
    // });

    // Function to highlight the current issue
    const highlightIssue = () => {
      if (issues.length > 0) {
        const currentNode = issues[currentIndex] as unknown as SceneNode;
        if (currentNode) {
          figma.currentPage.selection = [currentNode];
          figma.viewport.scrollAndZoomIntoView([currentNode]);
          figma.notify(
            `Showing issue ${currentIndex + 1} of ${issues.length} | Desc: ${issues[currentIndex].description}`,
          );
        }
      }
    };

    // Highlight the first issue if available
    if (issues.length > 0) {
      highlightIssue();
    } else {
      figma.notify("No issues found!");
    }

    // Listen for messages from the UI frontend
    figma.ui.onmessage = (message) => {
      console.log("further message received from frontend: ", message);
      if (issues.length === 0) {
        figma.notify("No issues found!");
        return;
      }

      if (message.type === "next") {
        currentIndex = (currentIndex + 1) % issues.length;
        highlightIssue();
      } else if (message.type === "previous") {
        currentIndex = (currentIndex - 1 + issues.length) % issues.length;
        highlightIssue();
      }
    };

    figma.on("selectionchange", () => {
      const selectedNode = figma.currentPage.selection[0];
      console.log("selectedNode", selectedNode);
      // console.log("selection", figma.currentPage.selection);

      if (
        selectedNode &&
        selectedNode.type === "TEXT" &&
        "fills" in selectedNode
      ) {
        const nodeFills = selectedNode.fills as Paint[];

        let foregroundColor: RGBColor = [0, 0, 0];

        if (nodeFills.length > 0 && nodeFills[0].type === "SOLID") {
          const { r, g, b } = nodeFills[0].color;
          foregroundColor = [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255),
          ];
        }

        // console.log("nodeFills", nodeFills);
        // console.log("foregroundColor", foregroundColor);

        const backgroundColor = getBackgroundColorOfNode(selectedNode);

        // if (backgroundColor) {
        //   console.log(`Background color: ${backgroundColor}`);
        // } else {
        //   console.log("No background color found!");
        // }

        const contrastScore = getContrastScore(
          foregroundColor,
          backgroundColor ? backgroundColor : [255, 255, 255],
        );

        figma.notify(`Contrast score result: ${contrastScore}.`);
      }
    });

    // send issues to the frontend
    figma.ui.postMessage({ type: "results", issues });

    // Highlight the first issue node using selection
    // if (issues.length > 0) {
    //   // const issueNode = nodes.find((n) => n.id === issues[0].id); // Find node by ID

    //   const issueNode = await figma.getNodeByIdAsync(issues[0].id);

    //   if (issueNode) {
    //     // Set the node as the current selection
    //     figma.currentPage.selection = [issueNode as SceneNode];

    //     // Scroll to the node
    //     figma.viewport.scrollAndZoomIntoView([issueNode]);

    //     // Notify the user
    //     figma.notify(`Highlighted issue: ${issues[0].description}`);
    //   }
    // } else {
    //   console.log("No issues found!");
    // }
  }
};

// Handle selection change to provide dynamic feedback
// figma.on("selectionchange", async () => {
//   // if (!isQuickCheckActive) return; // Exit if quickcheck is not active
//   if (!isQuickCheckActive) {
//     console.log(
//       "Quickcheck is not active. Skipping selection change logic.",
//       isQuickCheckActive,
//     );
//     return;
//   }

//   try {
//     console.log("quickcheck started...");
//     const selectedNode = figma.currentPage.selection[0];
//     console.log("Selected node:", selectedNode);

//     const selectedNodes = figma.currentPage.selection;
//     console.log("Selected nodes ==>: ", selectedNodes);

//     selectedNodes.forEach((node) => {
//       if (isTouchTargetTooSmall(node)) {
//         // Issue found: touch target size is too small
//         const issue = createTouchTargetIssue(node, "Size");
//         figma.ui.postMessage({ type: "single-issue", data: issue }); // Send issue data to UI
//       } else {
//         // Passed the touch target size check
//         const issue = createTouchTargetIssue(node, "Size");
//         figma.ui.postMessage({
//           type: "passed",
//           data: Object.assign({ status: "passed" }, issue),
//         });
//       }

//       if (isTouchTargetTooClose(node, [...figma.currentPage.children])) {
//         // Check spacing
//         const issue = createTouchTargetIssue(node, "Spacing");
//         console.log(`Spacing Issue identified: ${issue.description}`);
//         figma.ui.postMessage({ type: "single-issue", data: issue });
//       } else {
//         // Passed the touch target spacing check
//         const issue = createTouchTargetIssue(node, "Spacing");
//         figma.ui.postMessage({
//           type: "passed",
//           data: Object.assign({ status: "passed" }, issue),
//         });
//       }

//       // if (node.type === "TEXT") {
//       //   if (
//       //     typeof node.fontSize === "number" &&
//       //     node.fontSize < MIN_FONT_SIZE
//       //   ) {
//       //     // Check typography issue
//       //     const issue = createTypographyIssue(node);
//       //     console.log("created single typographyIssue: ", issue);
//       //     figma.ui.postMessage({ type: "single-issue", data: issue }); // Send issue data to UI
//       //   } else {
//       //     console.warn(
//       //       "Font size check skipped: Font size is undefined or valid.",
//       //     );
//       //   }
//       // }
//     });

//     if (
//       selectedNode &&
//       selectedNode.type === "TEXT" &&
//       "fills" in selectedNode
//     ) {
//       const foregroundColor = extractForegroundColor(
//         selectedNode.fills as Paint[],
//       );
//       const backgroundColor = getNearestBackgroundColor(selectedNode) || [
//         255, 255, 255,
//       ];
//       const fontWeight: number | typeof figma.mixed = selectedNode.fontWeight;

//       const contrastScore = getContrastCompliance(
//         foregroundColor,
//         backgroundColor,
//         selectedNode.fontSize as number,
//         isBoldFont(fontWeight, selectedNode, 0, selectedNode.characters.length),
//       );

//       const issue = createContrastIssue(
//         selectedNode,
//         contrastScore,
//         foregroundColor,
//         backgroundColor,
//       );

//       if (contrastScore === "Fail") {
//         figma.ui.postMessage({ type: "single-issue", data: issue });
//       } else {
//         figma.ui.postMessage({
//           type: "passed",
//           data: Object.assign({ status: "passed" }, issue),
//         });
//       }

//       figma.notify(
//         `Contrast compliance for node "${selectedNode.name}" (${selectedNode.id}): ${contrastScore}`,
//       );
//     }
//   } catch (error) {
//     console.error("Error in quickcheck selection change handler:", error);
//   }
// });
