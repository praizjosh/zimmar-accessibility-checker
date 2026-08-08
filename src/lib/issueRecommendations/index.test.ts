import { describe, expect, it } from "vitest";
import { SIZE_LIMITS } from "../constants";
import getIssueRecommendations from "./index";

describe("getIssueRecommendations", () => {
	it("returns null when no issue type is given", () => {
		expect(getIssueRecommendations("", "AA")).toBeNull();
	});

	it("cites the AA contrast ratios when the target level is AA", () => {
		const recommendations = getIssueRecommendations("CONTRAST", "AA");

		expect(recommendations?.[0]).toContain("4.5:1 for normal text and 3:1 for large text");
		expect(recommendations?.[0]).toContain("WCAG AA");
	});

	it("cites the stricter AAA contrast ratios when the target level is AAA", () => {
		const recommendations = getIssueRecommendations("CONTRAST", "AAA");

		expect(recommendations?.[0]).toContain("7:1 for normal text and 4.5:1 for large text");
		expect(recommendations?.[0]).toContain("WCAG AAA");
	});

	it("cites the issue's actual required size for touch-target size, not a hardcoded value", () => {
		const recommendations = getIssueRecommendations("TOUCH_TARGET_SIZE", "AA", 24);

		expect(recommendations?.[0]).toContain("at least 24x24 pixels");
	});

	it("falls back to the AAA size for touch-target size when requiredSizePx is omitted", () => {
		const recommendations = getIssueRecommendations("TOUCH_TARGET_SIZE", "AAA");

		expect(recommendations?.[0]).toContain(
			`at least ${SIZE_LIMITS.MIN_TOUCH_TARGET_SIZE_AAA}x${SIZE_LIMITS.MIN_TOUCH_TARGET_SIZE_AAA} pixels`,
		);
	});

	it("returns the same static recommendation for typography regardless of target level", () => {
		expect(getIssueRecommendations("TYPOGRAPHY", "AA")).toEqual(
			getIssueRecommendations("TYPOGRAPHY", "AAA"),
		);
	});

	it("returns the same static recommendation for touch-target spacing regardless of target level", () => {
		expect(getIssueRecommendations("TOUCH_TARGET_SPACING", "AA")).toEqual(
			getIssueRecommendations("TOUCH_TARGET_SPACING", "AAA"),
		);
	});
});
