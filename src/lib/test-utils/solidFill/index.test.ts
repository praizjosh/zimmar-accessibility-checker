import { describe, expect, it } from "vitest";
import solidFill from "./index";

describe("solidFill", () => {
  it("builds a visible solid Paint from RGB values", () => {
    expect(solidFill(1, 0, 0)).toEqual({
      type: "SOLID",
      visible: true,
      color: { r: 1, g: 0, b: 0 },
    });
  });

  it("supports marking the fill as invisible", () => {
    expect(solidFill(0, 1, 0, false)).toEqual({
      type: "SOLID",
      visible: false,
      color: { r: 0, g: 1, b: 0 },
    });
  });
});
