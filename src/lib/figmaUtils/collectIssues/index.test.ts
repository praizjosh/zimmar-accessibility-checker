import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MIN_TOUCH_TARGET_SIZE_AA, MIN_TOUCH_TARGET_SIZE_AAA } from "@/lib/constants";
import fakeSceneNode from "@/lib/test-utils/fakeSceneNode";
import { DetectedIssue } from "@/lib/types";
import {
	collectIssues,
	collectTouchTargetIssues,
	detectIssuesInSelection,
	expandSelectionWithDescendants,
	isScannable,
	tagIssuesWithPage,
} from "./index";

function fakeTouchTargetNode(
	id: string,
	bounds: { x: number; y: number; width: number; height: number },
	name = "Button",
): SceneNode {
	return fakeSceneNode(id, bounds, { name });
}

/** A fake container node whose `findAll` returns the given descendants, filtered by the callback. */
function fakeContainerNode(
	id: string,
	descendants: SceneNode[],
	name = "Frame",
): SceneNode & { findAll: (callback?: (node: SceneNode) => boolean) => SceneNode[] } {
	const node = fakeSceneNode(id, undefined, { name, type: "FRAME" }) as SceneNode & {
		findAll: (callback?: (node: SceneNode) => boolean) => SceneNode[];
	};
	node.findAll = (callback) => (callback ? descendants.filter(callback) : descendants);
	return node;
}

describe("isScannable", () => {
	it("returns true for a visible, unlocked node", () => {
		const node = { visible: true, locked: false, parent: null } as unknown as SceneNode;

		expect(isScannable(node)).toBe(true);
	});

	it("returns false for a hidden node", () => {
		const node = { visible: false, locked: false, parent: null } as unknown as SceneNode;

		expect(isScannable(node)).toBe(false);
	});

	it("returns false for a locked node", () => {
		const node = { visible: true, locked: true, parent: null } as unknown as SceneNode;

		expect(isScannable(node)).toBe(false);
	});
});

describe("collectTouchTargetIssues", () => {
	it("flags an eligible node smaller than the given target level's minimum", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 20, height: 20 });

		const issues = await collectTouchTargetIssues([node], "AAA");

		expect(issues).toHaveLength(1);
		expect(issues[0].type).toBe("TOUCH_TARGET_SIZE");
		expect(issues[0].nodeData.requiredSizePx).toBe(MIN_TOUCH_TARGET_SIZE_AAA);
	});

	it("does not flag an ineligible node even when it's too small", async () => {
		const node = fakeTouchTargetNode(
			"bg",
			{ x: 0, y: 0, width: 20, height: 20 },
			"Background rectangle",
		);

		const issues = await collectTouchTargetIssues([node], "AAA");

		expect(issues).toHaveLength(0);
	});

	it("flags spacing violations between two eligible nodes closer than the minimum spacing", async () => {
		const nodeA = fakeTouchTargetNode("a", { x: 0, y: 0, width: 44, height: 44 });
		const nodeB = fakeTouchTargetNode("b", { x: 49, y: 0, width: 44, height: 44 });

		const issues = await collectTouchTargetIssues([nodeA, nodeB], "AAA");

		const spacingIssues = issues.filter((issue) => issue.type === "TOUCH_TARGET_SPACING");
		expect(spacingIssues).toHaveLength(2);
	});

	it("does not flag spacing for eligible nodes far enough apart", async () => {
		const nodeA = fakeTouchTargetNode("a", { x: 0, y: 0, width: 44, height: 44 });
		const nodeB = fakeTouchTargetNode("b", { x: 5000, y: 5000, width: 44, height: 44 });

		const issues = await collectTouchTargetIssues([nodeA, nodeB], "AAA");

		expect(issues.filter((issue) => issue.type === "TOUCH_TARGET_SPACING")).toHaveLength(0);
	});

	it("uses the AA minimum instead of AAA when given targetLevel AA", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 30, height: 30 });

		const aaaIssues = await collectTouchTargetIssues([node], "AAA");
		const aaIssues = await collectTouchTargetIssues([node], "AA");

		expect(aaaIssues.some((issue) => issue.type === "TOUCH_TARGET_SIZE")).toBe(true);
		expect(aaIssues.some((issue) => issue.type === "TOUCH_TARGET_SIZE")).toBe(false);
		expect(MIN_TOUCH_TARGET_SIZE_AA).toBe(24);
	});
});

describe("expandSelectionWithDescendants", () => {
	it("returns just the node itself when it has no findAll (not a container)", () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 44, height: 44 });

		expect(expandSelectionWithDescendants([node])).toEqual([{ node, isDirectSelection: true }]);
	});

	it("includes scannable descendants of a selected container, marked as not directly selected", () => {
		const child = fakeTouchTargetNode("child", { x: 0, y: 0, width: 20, height: 20 });
		const container = fakeContainerNode("frame", [child]);

		expect(expandSelectionWithDescendants([container])).toEqual([
			{ node: container, isDirectSelection: true },
			{ node: child, isDirectSelection: false },
		]);
	});

	it("excludes hidden or locked descendants", () => {
		const hiddenChild = {
			id: "hidden",
			name: "Button",
			visible: false,
			locked: false,
			parent: null,
		} as unknown as SceneNode;
		const lockedChild = {
			id: "locked",
			name: "Button",
			visible: true,
			locked: true,
			parent: null,
		} as unknown as SceneNode;
		const container = fakeContainerNode("frame", [hiddenChild, lockedChild]);

		expect(expandSelectionWithDescendants([container])).toEqual([
			{ node: container, isDirectSelection: true },
		]);
	});

	it("flattens descendants across multiple selected containers", () => {
		const childA = fakeTouchTargetNode("a-child", { x: 0, y: 0, width: 20, height: 20 });
		const childB = fakeTouchTargetNode("b-child", { x: 0, y: 0, width: 20, height: 20 });
		const containerA = fakeContainerNode("a", [childA]);
		const containerB = fakeContainerNode("b", [childB]);

		const entries = expandSelectionWithDescendants([containerA, containerB]);

		expect(entries.map((entry) => entry.node.id)).toEqual(["a", "a-child", "b", "b-child"]);
	});
});

describe("tagIssuesWithPage", () => {
	function fakeIssue(id: string): DetectedIssue {
		return {
			type: "TYPOGRAPHY",
			severity: "major",
			nodeData: { id, name: "Label", nodeType: "TEXT" },
		};
	}

	it("merges pageId/pageName into every issue's nodeData", () => {
		const tagged = tagIssuesWithPage([fakeIssue("a"), fakeIssue("b")], "page-1", "Home");

		expect(tagged.map((issue) => issue.nodeData.pageId)).toEqual(["page-1", "page-1"]);
		expect(tagged.map((issue) => issue.nodeData.pageName)).toEqual(["Home", "Home"]);
	});

	it("preserves the rest of each issue's fields unchanged", () => {
		const issue = fakeIssue("a");

		const [tagged] = tagIssuesWithPage([issue], "page-1", "Home");

		expect(tagged.type).toBe("TYPOGRAPHY");
		expect(tagged.severity).toBe("major");
		expect(tagged.nodeData.id).toBe("a");
		expect(tagged.nodeData.name).toBe("Label");
	});

	it("returns an empty array unchanged", () => {
		expect(tagIssuesWithPage([], "page-1", "Home")).toEqual([]);
	});

	it("does not mutate the original issues", () => {
		const issue = fakeIssue("a");

		tagIssuesWithPage([issue], "page-1", "Home");

		expect(issue.nodeData.pageId).toBeUndefined();
	});
});

describe("collectIssues", () => {
	it("skips figma.loadFontAsync entirely and still runs touch-target checks when allTextNodes is empty", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 20, height: 20 });

		const issues = await collectIssues([], [node], "touch", "AAA");

		expect(issues).toHaveLength(1);
		expect(issues[0].type).toBe("TOUCH_TARGET_SIZE");
	});

	it("skips touch-target checks entirely for pointer device type", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 20, height: 20 });

		const issues = await collectIssues([], [node], "pointer", "AAA");

		expect(issues).toHaveLength(0);
	});
});

describe("detectIssuesInSelection", () => {
	it("flags a too-small selected node using the given target level", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 20, height: 20 });

		const issues = await detectIssuesInSelection([node], "touch", "AAA", []);

		expect(issues.some((issue) => issue.type === "TOUCH_TARGET_SIZE")).toBe(true);
	});

	it("checks spacing against the given candidate pool, not the selection itself", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 44, height: 44 });
		const candidate = fakeTouchTargetNode("neighbour", { x: 49, y: 0, width: 44, height: 44 });

		const withCandidate = await detectIssuesInSelection([node], "touch", "AAA", [
			node,
			candidate,
		]);
		const withoutCandidate = await detectIssuesInSelection([node], "touch", "AAA", [node]);

		expect(withCandidate.some((issue) => issue.type === "TOUCH_TARGET_SPACING")).toBe(true);
		expect(withoutCandidate.some((issue) => issue.type === "TOUCH_TARGET_SPACING")).toBe(false);
	});

	it("skips touch-target checks entirely for pointer device type", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 20, height: 20 });

		const issues = await detectIssuesInSelection([node], "pointer", "AAA", []);

		expect(issues).toHaveLength(0);
	});

	it("does not evaluate typography/contrast for a non-TEXT node", async () => {
		const node = fakeTouchTargetNode("btn", { x: 0, y: 0, width: 44, height: 44 }, "Icon only");

		const issues = await detectIssuesInSelection([node], "pointer", "AAA", []);

		expect(
			issues.some((issue) => issue.type === "TYPOGRAPHY" || issue.type === "CONTRAST"),
		).toBe(false);
	});

	it("checks a directly selected node unconditionally, even without a touch-target keyword name", async () => {
		const node = fakeTouchTargetNode(
			"weird-icon",
			{ x: 0, y: 0, width: 20, height: 20 },
			"Decorative icon",
		);

		const issues = await detectIssuesInSelection([node], "touch", "AAA", []);

		expect(issues.some((issue) => issue.type === "TOUCH_TARGET_SIZE")).toBe(true);
	});

	describe("a directly selected TEXT node", () => {
		// A text label can never legitimately be a touch target (WCAG
		// 2.5.5/2.5.8 govern interactive controls, not static text) - regression
		// guard for a bug where multi-selecting a text layer alongside real
		// buttons (e.g. "ORBITO" swept up with "btn"/"icon button") got it
		// flagged too, because direct selection otherwise overrides eligibility
		// unconditionally. Needs a minimal figma stub since a TEXT node also
		// runs through the (figma-runtime-only) contrast-analysis path.
		beforeAll(() => {
			vi.stubGlobal("figma", { loadFontAsync: vi.fn().mockResolvedValue(undefined) });
		});

		afterAll(() => {
			vi.unstubAllGlobals();
		});

		it("is not flagged as a touch target, unlike a same-size non-text node", async () => {
			const textNode = fakeSceneNode(
				"orbito",
				{ x: 0, y: 0, width: 20, height: 20 },
				{ name: "ORBITO", type: "TEXT" },
			);

			const issues = await detectIssuesInSelection([textNode], "touch", "AAA", []);

			expect(issues.some((issue) => issue.type === "TOUCH_TARGET_SIZE")).toBe(false);
			expect(issues.some((issue) => issue.type === "TOUCH_TARGET_SPACING")).toBe(false);
		});
	});

	it("recurses into a selected container and flags an eligible descendant", async () => {
		const child = fakeTouchTargetNode("child-btn", { x: 0, y: 0, width: 20, height: 20 });
		const container = fakeContainerNode("frame", [child]);

		const issues = await detectIssuesInSelection([container], "touch", "AAA", []);

		expect(
			issues.some(
				(issue) => issue.type === "TOUCH_TARGET_SIZE" && issue.nodeData.id === "child-btn",
			),
		).toBe(true);
	});

	it("does not flag an ineligible descendant, unlike a direct selection", async () => {
		const child = fakeTouchTargetNode(
			"decorative",
			{ x: 0, y: 0, width: 20, height: 20 },
			"Background rectangle",
		);
		const container = fakeContainerNode("frame", [child]);

		const issues = await detectIssuesInSelection([container], "touch", "AAA", []);

		expect(issues.some((issue) => issue.type === "TOUCH_TARGET_SIZE")).toBe(false);
	});

	it("checks descendants of a selected container against each other for spacing", async () => {
		const childA = fakeTouchTargetNode("child-a", { x: 0, y: 0, width: 44, height: 44 });
		const childB = fakeTouchTargetNode("child-b", { x: 49, y: 0, width: 44, height: 44 });
		const container = fakeContainerNode("frame", [childA, childB]);

		const issues = await detectIssuesInSelection([container], "touch", "AAA", []);

		expect(issues.some((issue) => issue.type === "TOUCH_TARGET_SPACING")).toBe(true);
	});
});
