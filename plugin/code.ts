// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { isLocked, isVisible } from "@create-figma-plugin/utilities";

import { MESSAGE_TYPES, MIN_FONT_SIZE } from "@/lib/constants";
import {
  analyzeTextNodeForContrastIssue,
  createTouchTargetIssue,
  createTypographyIssue,
  isTouchTarget,
  isTouchTargetTooClose,
  isTouchTargetTooSmall,
  postMessageToUI,
} from "@/lib/figmaUtils";
import generateAltTextForLayer from "@/lib/helpers/generateAltTextForLayer";
import { IssueX } from "@/lib/types";
import {
  getIsQuickCheckModeActive,
  setIsQuickCheckModeActive,
} from "@/lib/utils";

figma.showUI(__html__);
figma.ui.resize(375, 550);

figma.ui.onmessage = async (message) => {
  try {
    switch (message.type) {
      case MESSAGE_TYPES.START_QUICKCHECK:
        handleStartQuickCheck();
        break;

      case MESSAGE_TYPES.CANCEL_QUICKCHECK:
        handleCancelQuickCheck();
        break;

      case MESSAGE_TYPES.SCAN:
        await handleScan();
        break;

      case MESSAGE_TYPES.UPDATE_FONT_SIZE:
        await handleUpdateFontSize(message);
        break;

      case MESSAGE_TYPES.NAVIGATE:
        await handleNavigate(message);
        break;

      case MESSAGE_TYPES.GET_IMAGE_DATA:
        await generateAltTextForLayer();
        break;

      case MESSAGE_TYPES.NOTIFY:
        handleNotify(message);
        break;

      default:
        console.warn(
          `Unhandled request. Message type does not exist: ${message.type}`,
        );
    }
  } catch (error) {
    figma.notify("An error occurred while executing task.");
    console.error("Error in onmessage handler:", error);
  }
};

figma.on("selectionchange", async () => {
  const isQuickCheckModeActive = getIsQuickCheckModeActive();
  if (!isQuickCheckModeActive) return;

  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    postMessageToUI(MESSAGE_TYPES.NO_SELECTION, true);
    return;
  }

  if (selection.length > 0) {
    postMessageToUI(MESSAGE_TYPES.LAYER_SELECTED, true);
  }

  try {
    const detectedIssues = await detectIssuesInSelection(selection);
    if (detectedIssues.length) {
      postMessageToUI(MESSAGE_TYPES.DETECTED_ISSUE, detectedIssues);
    }
  } catch (error) {
    console.error("Error in selectionchange handler:", error);
  }
});

async function handleStartQuickCheck() {
  setIsQuickCheckModeActive(true);

  postMessageToUI(MESSAGE_TYPES.QUICKCHECK_ACTIVE, getIsQuickCheckModeActive());

  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    postMessageToUI(MESSAGE_TYPES.NO_SELECTION, true);
    return;
  }

  try {
    const detectedIssues = await detectIssuesInSelection(selection);
    if (detectedIssues.length) {
      postMessageToUI(MESSAGE_TYPES.DETECTED_ISSUE, detectedIssues);
    }
  } catch (error) {
    console.error("Error in selectionchange handler:", error);
  }
}

function handleCancelQuickCheck() {
  setIsQuickCheckModeActive(false);
}

function isScannable(node: SceneNode): boolean {
  return isVisible(node) && !isLocked(node);
}

async function handleScan() {
  const allTextNodes = figma.currentPage.findAll(
    (node) => node.type === "TEXT" && isScannable(node),
  ) as TextNode[];
  // const allVectorNodes = figma.currentPage.findAll(
  //   (node) => node.type === "VECTOR",
  // ) as VectorNode[];
  const allPageNodes = figma.currentPage.findAll((node) =>
    isScannable(node),
  ) as SceneNode[];

  const issues: IssueX[] = await collectIssues(allTextNodes, allPageNodes);
  postMessageToUI(MESSAGE_TYPES.LOAD_ISSUES, issues);
}

async function handleUpdateFontSize(message: { id: string; fontSize: number }) {
  const node = (await figma.getNodeByIdAsync(message.id)) as TextNode | null;
  if (node && node.type === "TEXT") {
    await figma.loadFontAsync(node.fontName as FontName);
    node.fontSize = message.fontSize;
  } else {
    console.warn(`Failed to update font size for node ${message.id}`);
  }
}

function handleNotify(message: { message: string }) {
  figma.notify(message.message);
}

async function handleNavigate(message: { id: string }) {
  const node = (await figma.getNodeByIdAsync(message.id)) as SceneNode;
  if (node) {
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  } else {
    console.warn(`Node with ID ${message.id} not found.`);
  }
}

async function collectIssues(
  allTextNodes: TextNode[],
  allPageNodes: SceneNode[],
): Promise<IssueX[]> {
  const issues: IssueX[] = [];

  await Promise.all(
    allTextNodes.map(async (textNode) => {
      // Safeguard font loading
      try {
        if (textNode.fontName === figma.mixed) {
          return;
        }

        // Ensure fontName is of the correct format
        const fontName = textNode.fontName as FontName;
        await figma.loadFontAsync(fontName);

        if (
          typeof textNode.fontSize === "number" &&
          textNode.fontSize < MIN_FONT_SIZE
        ) {
          issues.push(createTypographyIssue(textNode));
        }

        await analyzeTextNodeForContrastIssue(textNode, issues);
      } catch (error) {
        console.error(
          `Failed to load font for text node "${textNode.name}":`,
          error,
        );
      }
    }),
  );

  for (const node of allPageNodes) {
    if ("absoluteBoundingBox" in node && (await isTouchTarget(node))) {
      // eslint-disable-next-line no-console
      if (isTouchTargetTooSmall(node)) {
        const issue = createTouchTargetIssue(node, "Size");
        if (issue) {
          issues.push(issue);
        }
      }
      if (isTouchTargetTooClose(node, allPageNodes)) {
        const issue = createTouchTargetIssue(node, "Spacing");
        if (issue) {
          issues.push(issue);
        }
      }
    }
  }

  return issues;
}

async function detectIssuesInSelection(
  selectedNodes: readonly SceneNode[],
): Promise<IssueX[]> {
  const issues: IssueX[] = [];

  await Promise.all(
    selectedNodes.map(async (node) => {
      if (isTouchTargetTooSmall(node)) {
        const issue = createTouchTargetIssue(node, "Size");
        if (issue) {
          issues.push(issue);
        }
      }
      if (isTouchTargetTooClose(node, [...figma.currentPage.children])) {
        const issue = createTouchTargetIssue(node, "Spacing");
        if (issue) {
          issues.push(issue);
        }
      }

      if (
        node.type === "TEXT" &&
        node.fontSize &&
        typeof node.fontSize === "number" &&
        node.fontSize < MIN_FONT_SIZE
      ) {
        issues.push(createTypographyIssue(node));
      }
      if (node.type === "TEXT") {
        await analyzeTextNodeForContrastIssue(node, issues);
      }
    }),
  );

  return issues;
}
