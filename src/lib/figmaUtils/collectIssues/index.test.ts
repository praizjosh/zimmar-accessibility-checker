import { describe, expect, it } from "vitest";
import { MIN_TOUCH_TARGET_SIZE_AA, MIN_TOUCH_TARGET_SIZE_AAA } from "@/lib/constants";
import fakeSceneNode from "@/lib/test-utils/fakeSceneNode";
import {
	collectIssues,
	collectTouchTargetIssues,
	detectIssuesInSelection,
	isScannable,
} from "./index";

function fakeTouchTargetNode(
	id: string,
	bounds: { x: number; y: number; width: number; height: number },
	name = "Button",
): SceneNode {
	return fakeSceneNode(id, bounds, { name });
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
});
