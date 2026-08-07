import { isLocked, isVisible } from "@create-figma-plugin/utilities";
import { MIN_FONT_SIZE, TOUCH_TARGET_MIN_SIZE } from "@/lib/constants";
import { DeviceType, IssueX, TargetLevel } from "@/lib/types";
import {
	analyzeTextNodeForContrastIssue,
	buildTouchTargetSpatialIndex,
	createTouchTargetIssue,
	createTypographyIssue,
	getNearbyNodes,
	isTouchTarget,
	isTouchTargetTooClose,
	isTouchTargetTooSmall,
} from "../index";

/**
 * Whether a node should be considered during a scan at all - hidden or
 * locked layers are skipped regardless of issue type.
 */
export function isScannable(node: SceneNode): boolean {
	return isVisible(node) && !isLocked(node);
}

/**
 * Touch target size/spacing (WCAG 2.5.5/2.5.8) checks for every eligible
 * node in `allPageNodes`. Assumes the caller has already gated this on
 * `deviceType === "touch"` - WCAG defines no separate desktop threshold, so
 * there's nothing meaningful to check for "pointer" designs.
 *
 * No direct `figma.*` references - `isTouchTarget`'s only async call is
 * `node.getMainComponentAsync()`, a method on the node itself, so this is
 * fully unit-testable with plain fake `SceneNode` objects.
 */
export async function collectTouchTargetIssues(
	allPageNodes: SceneNode[],
	targetLevel: TargetLevel,
): Promise<IssueX[]> {
	const issues: IssueX[] = [];
	const minSize = TOUCH_TARGET_MIN_SIZE[targetLevel];

	// Building the spatial index and resolving touch-target eligibility are
	// both independent of the per-node checks below, so they're done as one
	// upfront pass instead of inline inside a sequential loop - see
	// buildTouchTargetSpatialIndex/getNearbyNodes (figmaUtils) for why the
	// naive all-pairs distance check doesn't scale to large pages.
	const spatialIndex = buildTouchTargetSpatialIndex(allPageNodes);
	const eligibilityResults = await Promise.all(
		allPageNodes.map(async (node) => ({
			node,
			eligible: "absoluteBoundingBox" in node && (await isTouchTarget(node)),
		})),
	);

	for (const { node, eligible } of eligibilityResults) {
		if (!eligible) continue;

		if (isTouchTargetTooSmall(node, minSize)) {
			const issue = createTouchTargetIssue(node, "Size", minSize);
			if (issue) {
				issues.push(issue);
			}
		}
		if (isTouchTargetTooClose(node, getNearbyNodes(node, spatialIndex))) {
			const issue = createTouchTargetIssue(node, "Spacing", minSize);
			if (issue) {
				issues.push(issue);
			}
		}
	}

	return issues;
}

/**
 * Typography (WCAG 1.4.4-adjacent min font size) and contrast (1.4.3/1.4.6)
 * checks for every text node in `allTextNodes`. Genuinely Figma-runtime-only
 * - `figma.loadFontAsync`/`figma.mixed` (via `analyzeTextNodeForContrastIssue`)
 * have no vitest equivalent, so this needs manual verification in Figma dev
 * mode rather than unit tests.
 */
async function collectTextNodeIssues(allTextNodes: TextNode[]): Promise<IssueX[]> {
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

				if (typeof textNode.fontSize === "number" && textNode.fontSize < MIN_FONT_SIZE) {
					issues.push(createTypographyIssue(textNode));
				}

				await analyzeTextNodeForContrastIssue(textNode, issues);
			} catch (error) {
				console.error(`Failed to load font for text node "${textNode.name}":`, error);
			}
		}),
	);

	return issues;
}

/**
 * Full-page-scan orchestrator: combines the text-node checks with the
 * touch-target checks (skipped entirely for "pointer" designs, since WCAG
 * defines no separate desktop threshold for 2.5.5/2.5.8 - they exist because
 * of touch/finger imprecision specifically).
 *
 * Callable with `allTextNodes: []` without touching the `figma` global at
 * all (`Promise.all([])` resolves trivially) - that's what lets the
 * `deviceType`/touch-target wiring below be integration-tested without a
 * `figma` mock.
 */
export async function collectIssues(
	allTextNodes: TextNode[],
	allPageNodes: SceneNode[],
	deviceType: DeviceType,
	targetLevel: TargetLevel,
): Promise<IssueX[]> {
	const [textNodeIssues, touchTargetIssues] = await Promise.all([
		collectTextNodeIssues(allTextNodes),
		deviceType === "touch" ? collectTouchTargetIssues(allPageNodes, targetLevel) : [],
	]);

	return [...textNodeIssues, ...touchTargetIssues];
}

/**
 * Selection-scoped scan (used by quick-check mode): same checks as
 * `collectIssues`, but only against the nodes actually selected.
 * `candidateNodesForSpacing` is the pool touch-target spacing is checked
 * against - passed in explicitly (callers use `figma.currentPage.children`)
 * instead of read from `figma.currentPage` internally, so this function has
 * no direct `figma.*` references itself.
 */
export async function detectIssuesInSelection(
	selectedNodes: readonly SceneNode[],
	deviceType: DeviceType,
	targetLevel: TargetLevel,
	candidateNodesForSpacing: SceneNode[],
): Promise<IssueX[]> {
	const issues: IssueX[] = [];
	const minSize = TOUCH_TARGET_MIN_SIZE[targetLevel];

	await Promise.all(
		selectedNodes.map(async (node) => {
			if (deviceType === "touch") {
				if (isTouchTargetTooSmall(node, minSize)) {
					const issue = createTouchTargetIssue(node, "Size", minSize);
					if (issue) {
						issues.push(issue);
					}
				}
				if (isTouchTargetTooClose(node, candidateNodesForSpacing)) {
					const issue = createTouchTargetIssue(node, "Spacing", minSize);
					if (issue) {
						issues.push(issue);
					}
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
