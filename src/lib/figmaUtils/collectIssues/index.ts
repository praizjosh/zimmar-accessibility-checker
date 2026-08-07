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

export type ExpandedSelectionEntry = {
	node: SceneNode;
	/** False for a node discovered by recursing into a selected container's descendants. */
	isDirectSelection: boolean;
};

/**
 * Expands a selection into itself plus every scannable descendant, for
 * containers (frame/group/section/instance/etc. - anything exposing
 * `findAll`). Selecting a frame previously only checked the frame node
 * itself, not the text/touch-target layers inside it - close to useless for
 * accessibility checking, since a frame rarely has its own contrast/
 * touch-target issues.
 *
 * `isDirectSelection` distinguishes a node the user actually selected from
 * one discovered by recursion - `detectIssuesInSelection` uses it to decide
 * whether touch-target eligibility (`isTouchTarget`'s name/component
 * matching) should gate the check. A directly selected node is checked
 * unconditionally (the user picked it deliberately), but an auto-discovered
 * descendant needs the same eligibility gate the full-page scan uses -
 * otherwise expanding a frame would flag every small decorative icon or
 * background rectangle inside it as a touch-target issue.
 *
 * No direct `figma.*` references - `findAll` is a method on the node
 * itself, so this is fully unit-testable with plain fake `SceneNode`
 * objects exposing a `findAll` function.
 */
export function expandSelectionWithDescendants(
	selectedNodes: readonly SceneNode[],
): ExpandedSelectionEntry[] {
	return selectedNodes.flatMap((node) => {
		const entries: ExpandedSelectionEntry[] = [{ node, isDirectSelection: true }];

		if ("findAll" in node && typeof node.findAll === "function") {
			const descendants = node.findAll((descendant) =>
				isScannable(descendant),
			) as SceneNode[];
			entries.push(
				...descendants.map((descendant) => ({
					node: descendant,
					isDirectSelection: false,
				})),
			);
		}

		return entries;
	});
}

/**
 * Selection-scoped scan (used by quick-check mode): same checks as
 * `collectIssues`, but only against the nodes actually selected and their
 * descendants (see `expandSelectionWithDescendants`). `candidateNodesForSpacing`
 * is the additional pool touch-target spacing is checked against - passed in
 * explicitly (callers use `figma.currentPage.children`) instead of read from
 * `figma.currentPage` internally, so this function has no direct `figma.*`
 * references itself. The expanded selection is also included in that pool,
 * so descendants get checked against each other (e.g. two buttons inside
 * the same selected frame), not just against top-level page siblings.
 */
export async function detectIssuesInSelection(
	selectedNodes: readonly SceneNode[],
	deviceType: DeviceType,
	targetLevel: TargetLevel,
	candidateNodesForSpacing: SceneNode[],
): Promise<IssueX[]> {
	const issues: IssueX[] = [];
	const minSize = TOUCH_TARGET_MIN_SIZE[targetLevel];

	const expandedEntries = expandSelectionWithDescendants(selectedNodes);
	const spacingCandidates = [
		...candidateNodesForSpacing,
		...expandedEntries.map((entry) => entry.node),
	];

	await Promise.all(
		expandedEntries.map(async ({ node, isDirectSelection }) => {
			if (deviceType === "touch") {
				const eligible = isDirectSelection || (await isTouchTarget(node));
				if (eligible) {
					if (isTouchTargetTooSmall(node, minSize)) {
						const issue = createTouchTargetIssue(node, "Size", minSize);
						if (issue) {
							issues.push(issue);
						}
					}
					if (isTouchTargetTooClose(node, spacingCandidates)) {
						const issue = createTouchTargetIssue(node, "Spacing", minSize);
						if (issue) {
							issues.push(issue);
						}
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
