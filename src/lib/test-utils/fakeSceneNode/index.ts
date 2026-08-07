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
 * node type that doesn't support them. `parent: null` defaults in so
 * `isVisible`/`isLocked` (`@create-figma-plugin/utilities`, which walk up
 * the parent chain) terminate immediately instead of crashing on an
 * `undefined` parent - matches how a real top-level/root-adjacent node
 * behaves.
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
		parent: null,
		...(bounds
			? { width: bounds.width, height: bounds.height, absoluteBoundingBox: bounds }
			: {}),
	} as unknown as SceneNode;
}
