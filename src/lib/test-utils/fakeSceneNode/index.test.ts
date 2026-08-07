import { describe, expect, it } from "vitest";
import fakeSceneNode from "./index";

describe("fakeSceneNode", () => {
	it("builds a node with id, default name/type, null parent, and no geometry when bounds is omitted", () => {
		const node = fakeSceneNode("a");

		expect(node).toEqual({ id: "a", name: "Node", type: "FRAME", parent: null });
	});

	it("includes width/height/absoluteBoundingBox when bounds is given", () => {
		const bounds = { x: 0, y: 0, width: 44, height: 44 };

		const node = fakeSceneNode("a", bounds);

		expect(node).toEqual({
			id: "a",
			name: "Node",
			type: "FRAME",
			parent: null,
			width: 44,
			height: 44,
			absoluteBoundingBox: bounds,
		});
	});

	it("supports overriding name and type", () => {
		const node = fakeSceneNode("a", undefined, { name: "Icon button", type: "GROUP" });

		expect(node).toEqual({ id: "a", name: "Icon button", type: "GROUP", parent: null });
	});
});
