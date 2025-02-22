import { MESSAGE_TYPES, MIN_FONT_SIZE } from "@/lib/constants";
import {
  analyzeTextNode,
  createTouchTargetIssue,
  createTypographyIssue,
  isTouchTarget,
  isTouchTargetTooClose,
  isTouchTargetTooSmall,
  postMessageToUI,
} from "@/lib/figmaUtils";
import { IssueX } from "@/lib/types";

figma.showUI(__html__);
figma.ui.resize(410, 500);

// Global state for quickcheck mode
let isQuickCheckActive = false;

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
  if (!isQuickCheckActive) return;

  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    postMessageToUI("no-selection", true);
    return;
  }

  try {
    const detectedIssues = await detectIssuesInSelection(selection);
    if (detectedIssues.length) {
      postMessageToUI("detected-issue", detectedIssues);
    }
  } catch (error) {
    console.error("Error in selectionchange handler:", error);
  }
});

async function handleStartQuickCheck() {
  isQuickCheckActive = true;
  postMessageToUI("quickcheck-active", isQuickCheckActive);
}

function handleCancelQuickCheck() {
  isQuickCheckActive = false;
}

async function handleScan() {
  const allTextNodes = figma.currentPage.findAll(
    (node) => node.type === "TEXT",
  ) as TextNode[];
  const allPageNodes = figma.currentPage.findAll(() => true) as SceneNode[];

  const issues: IssueX[] = await collectIssues(allTextNodes, allPageNodes);
  postMessageToUI("loadIssues", issues);
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
          // console.warn(`Text node "${textNode.name}" has mixed fonts.`);
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

        await analyzeTextNode(textNode, issues);
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
      if (node.type === "TEXT" && "fills" in node) {
        await analyzeTextNode(node, issues);
      }
    }),
  );

  return issues;
}
