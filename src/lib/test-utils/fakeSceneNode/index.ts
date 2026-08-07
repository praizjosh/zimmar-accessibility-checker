export type FakeSceneNodeBounds = { x: number; y: number; width: number; height: number };

export type FakeSceneNodeOverrides = {
	name?: string;
	type?: SceneNode["type"];
};

/**
 * Fake SceneNode for tests that only need id/geometry (touch-target
 * size/spacing, spatial-index) and/or name/type (touch-target eligibility,
 * issue builders) - not the full Figma node shape. Omitting `bounds`
 * omits width/height/absoluteBoundingBox entirely, for tests covering a
 * node type that doesn't support them.
 */
export default function fakeSceneNode(
	id: string,
	bounds?: FakeSceneNodeBounds,
	overrides: FakeSceneNodeOverrides = {},
): SceneNode {
	const { name = "Node", type = "FRAME" } = overrides;

	return {
		id,
		name,
		type,
		...(bounds
			? { width: bounds.width, height: bounds.height, absoluteBoundingBox: bounds }
			: {}),
	} as unknown as SceneNode;
}
