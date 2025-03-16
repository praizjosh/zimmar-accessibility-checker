// PERFECT!

/* eslint-disable no-console */

import { Issue } from "@/components/ui/accessibilityValidator";

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

figma.ui.resize(450, 450);

// type NodeType =
//   | "BOOLEAN_OPERATION"
//   | "CODE_BLOCK"
//   | "COMPONENT"
//   | "COMPONENT_SET"
//   | "CONNECTOR"
//   | "DOCUMENT"
//   | "ELLIPSE"
//   | "EMBED"
//   | "FRAME"
//   | "GROUP"
//   | "INSTANCE"
//   | "LINE"
//   | "LINK_UNFURL"
//   | "MEDIA"
//   | "PAGE"
//   | "POLYGON"
//   | "RECTANGLE"
//   | "SHAPE_WITH_TEXT"
//   | "SLICE"
//   | "STAMP"
//   | "STAR"
//   | "STICKY"
//   | "TABLE"
//   | "TABLE_CELL"
//   | "TEXT"
//   | "VECTOR"
//   | "WIDGET";

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the posted message.

// Listen for actions from the UI
figma.ui.onmessage = async (message) => {
  console.log("message sent to backend: ", message);

  if (message.type === "scan") {
    const issues: Issue[] = [];

    // Recursive function to collect all nodes
    const collectNodes = (node: SceneNode, collectedNodes: SceneNode[]) => {
      collectedNodes.push(node);
      if ("children" in node) {
        for (const child of node.children) {
          collectNodes(child, collectedNodes);
        }
      }
    };

    // Collect all nodes in the current page
    const nodes: SceneNode[] = [];

    for (const node of figma.currentPage.children) {
      collectNodes(node, nodes);
    }

    // Analyze collected nodes
    for (const node of nodes) {
      if (node.type === "TEXT") {
        // console.log("TEXT node properties ==> ", node);

        const fontSize = node.fontSize as number;

        if (typeof fontSize === "number" && fontSize < 12) {
          issues.push({
            type: "Typography",
            description: "Text size is too small",
            id: node.id,
            // id: Number(node.id),
          });
        }
      }
    }

    figma.ui.postMessage({ type: "results", issues });

    // Highlight the first issue node using selection
    if (issues.length > 0) {
      // const issueNode = nodes.find((n) => n.id === issues[0].id); // Find node by ID

      const issueNode = await figma.getNodeByIdAsync(issues[0].id);

      if (issueNode) {
        // Set the node as the current selection
        figma.currentPage.selection = [issueNode as SceneNode];

        // Scroll to the node
        figma.viewport.scrollAndZoomIntoView([issueNode]);

        // Notify the user
        figma.notify(`Highlighted issue: ${issues[0].description}`);
      }
    } else {
      console.log("No issues found!");
    }
  }

  if (message.type === "create-rectangles") {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < message.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }
};
