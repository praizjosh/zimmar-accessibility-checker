/* eslint-disable no-console */
import { IssueX } from "@/lib/types";
import {
  getContrastCompliance,
  getNearestBackgroundColor,
  isBoldFont,
} from "@/lib/utils";
import { RGBColor } from "wcag-contrast";

figma.showUI(__html__, { width: 400, height: 550 });

// const issues: IssueX[] = [];

// Handle navigation
figma.ui.onmessage = async (message) => {
  console.log("Message received from frontend:", message);

  if (message.type === "scan") {
    console.log("Starting scan...");
    const issues: IssueX[] = [];
    // Collect issues (example logic) FIGMA API
    const nodes = figma.currentPage.findAll((node) => node.type === "TEXT");

    for (const node of nodes) {
      if (
        node.type === "TEXT" &&
        typeof node.fontSize === "number" &&
        node.fontSize < 11
      ) {
        issues.push({
          description: "Text size is too small for readability.",
          severity: "major",
          type: "Typography",
          nodeData: {
            id: node.id,
            characters: (node as TextNode).characters,
            fontSize: node.fontSize,
            height: node.height.toString(),
            lineHeight: (node as TextNode).lineHeight,
            name: node.name,
            nodeType: node.type,
          },
        });
      }

      if (node.type === "TEXT" && "fills" in node) {
        const nodeFills = node.fills as Paint[];

        let foregroundColor: RGBColor = [0, 0, 0]; // Default to black

        if (
          nodeFills.length > 0 &&
          nodeFills[0].type === "SOLID" &&
          nodeFills[0].visible !== false
        ) {
          const { r, g, b } = nodeFills[0].color;
          foregroundColor = [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255),
          ];
        }
        // const backgroundColor = getBackgroundColorOfNode(node);
        const backgroundColor = getNearestBackgroundColor(node) || [
          255, 255, 255,
        ]; // Default to white if no background is found

        const contrastScore = getContrastCompliance(
          foregroundColor,
          backgroundColor ? backgroundColor : [255, 255, 255],
          node.fontSize as number,
          isBoldFont(node.fontWeight as number),
        );

        if (contrastScore === "Fail") {
          issues.push({
            description: "Text contrast is below WCAG AA standard.",
            severity: "critical",
            type: "Contrast",
            nodeData: {
              id: node.id,
              contrastScore,
              characters: (node as TextNode).characters,
              fontSize: node.fontSize as number,
              height: node.height.toString(),
              lineHeight: (node as TextNode).lineHeight,
              name: node.name,
              nodeType: node.type,
            },
          });
        }

        // issues.push({
        //   contrastScore,
        //   severity: "critical",
        //   type: "Contrast",
        //   nodeData: {
        //     id: node.id,
        //     characters: (node as TextNode).characters,
        //     height: node.height.toString(),
        //     lineHeight: (node as TextNode).lineHeight,
        //     name: node.name,
        //     nodeType: node.type,
        //   },
        // });
      }
    }

    console.log("Total issues identified:", issues.length);
    // Send issues to the frontend
    figma.ui.postMessage({ type: "loadIssues", issues });
  }

  if (message.type === "navigate") {
    const node = (await figma.getNodeByIdAsync(message.id)) as SceneNode;
    if (node) {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
  }

  if (message.type === "updateFontSize") {
    const node = (await figma.getNodeByIdAsync(message.id)) as TextNode | null;
    if (node && node.type === "TEXT") {
      await figma.loadFontAsync(node.fontName as FontName);
      node.fontSize = message.fontSize;
    }
  }

  // figma.on("selectionchange", () => {
  //   const selectedNode = figma.currentPage.selection[0];
  //   console.log("selectedNode", selectedNode);

  //   if (
  //     selectedNode &&
  //     selectedNode.type === "TEXT" &&
  //     "fills" in selectedNode
  //   ) {
  //     const nodeFills = selectedNode.fills as Paint[];

  //     let foregroundColor: RGBColor = [0, 0, 0];

  //     if (nodeFills.length > 0 && nodeFills[0].type === "SOLID") {
  //       const { r, g, b } = nodeFills[0].color;
  //       foregroundColor = [
  //         Math.round(r * 255),
  //         Math.round(g * 255),
  //         Math.round(b * 255),
  //       ];
  //     }

  //     // const backgroundColor = getBackgroundColorOfNode(selectedNode);
  //     const backgroundColor = getNearestBackgroundColor(selectedNode);

  //     if (backgroundColor) {
  //       console.log(`Background color: ${backgroundColor}`);
  //     } else {
  //       console.log("No background color found!");
  //     }

  //     const contrastScore = getContrastScore(
  //       foregroundColor,
  //       backgroundColor ? backgroundColor : [255, 255, 255],
  //     );

  //     console.log(`Contrast score result: ${contrastScore}.`);

  //     const compliance = getContrastCompliance(
  //       foregroundColor,
  //       backgroundColor ? backgroundColor : [255, 255, 255],
  //       selectedNode.fontSize as number,
  //       isBoldFont(selectedNode.fontWeight as number),
  //     );

  //     console.log(`Node compliance score result: ${compliance}.`);

  //     issues.push({
  //       description: "Text contrast is below WCAG AA standard.",
  //       severity: "critical",
  //       type: "Contrast",
  //       nodeData: {
  //         id: selectedNode.id,
  //         contrastScore,
  //         characters: (selectedNode as TextNode).characters,
  //         height: selectedNode.height.toString(),
  //         lineHeight: (selectedNode as TextNode).lineHeight,
  //         name: selectedNode.name,
  //         nodeType: selectedNode.type,
  //       },
  //     });

  //     // // NEW 12 FEB
  //     // if ("fills" in selectedNode && Array.isArray(selectedNode.fills)) {
  //     //   const fills = selectedNode.fills as Paint[]; // Ensure fills is of type Paint[]

  //     //   // Find the first solid paint
  //     //   const solidPaint = fills.find(
  //     //     (paint) => paint.type === "SOLID" && !paint.visible === false,
  //     //   ) as SolidPaint | undefined;

  //     //   if (solidPaint) {
  //     //     const { r, g, b } = solidPaint.color;
  //     //     // Convert RGB values (0-1) to hexadecimal

  //     //     console.log("solidPaint", [
  //     //       Math.round(r * 255),
  //     //       Math.round(g * 255),
  //     //       Math.round(b * 255),
  //     //     ]);

  //     //     const toHex = (value: number) =>
  //     //       Math.round(value * 255)
  //     //         .toString(16)
  //     //         .padStart(2, "0");

  //     //     console.log(`solidPaint hex : #${toHex(r)}${toHex(g)}${toHex(b)}`);
  //     //     return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  //     //   }
  //     // }

  //     // const parentBackgroundColor = getNearestBackgroundColor(selectedNode);

  //     // if (parentBackgroundColor) {
  //     //   console.log(
  //     //     `Nearest parentBackgroundColor Color: ${parentBackgroundColor}`,
  //     //   );
  //     //   figma.notify(
  //     //     `Nearest parentBackgroundColor Color: ${parentBackgroundColor}`,
  //     //   );
  //     // } else {
  //     //   console.log("No background color found in ancestor.");
  //     // }
  //   }
  // });
};
