import { describe, expect, it } from "vitest";
import getWcagCitation from "./index";

describe("getWcagCitation", () => {
	it("cites SC 1.4.3 Contrast (Minimum) for CONTRAST at AA", () => {
		const result = getWcagCitation("CONTRAST", "AA");

		expect(result.exact).toBe(true);
		expect(result.citation).toContain("1.4.3");
		expect(result.url).toBe(
			"https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
		);
	});

	it("cites SC 1.4.6 Contrast (Enhanced) for CONTRAST at AAA", () => {
		const result = getWcagCitation("CONTRAST", "AAA");

		expect(result.exact).toBe(true);
		expect(result.citation).toContain("1.4.6");
		expect(result.url).toBe(
			"https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html",
		);
	});

	it("cites SC 2.5.8 Target Size (Minimum) for TOUCH_TARGET_SIZE at AA", () => {
		const result = getWcagCitation("TOUCH_TARGET_SIZE", "AA");

		expect(result.exact).toBe(true);
		expect(result.citation).toContain("2.5.8");
		expect(result.url).toBe(
			"https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
		);
	});

	it("cites SC 2.5.5 Target Size (Enhanced) for TOUCH_TARGET_SIZE at AAA", () => {
		const result = getWcagCitation("TOUCH_TARGET_SIZE", "AAA");

		expect(result.exact).toBe(true);
		expect(result.citation).toContain("2.5.5");
		expect(result.url).toBe(
			"https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html",
		);
	});

	it("cites the same SC number and URL as TOUCH_TARGET_SIZE for TOUCH_TARGET_SPACING at AA", () => {
		const spacing = getWcagCitation("TOUCH_TARGET_SPACING", "AA");
		const size = getWcagCitation("TOUCH_TARGET_SIZE", "AA");

		expect(spacing.citation).toContain("2.5.8");
		expect(spacing.citation).toContain("spacing exception");
		expect(spacing.url).toBe(size.url);
	});

	it("cites the same SC number and URL as TOUCH_TARGET_SIZE for TOUCH_TARGET_SPACING at AAA", () => {
		const spacing = getWcagCitation("TOUCH_TARGET_SPACING", "AAA");
		const size = getWcagCitation("TOUCH_TARGET_SIZE", "AAA");

		expect(spacing.citation).toContain("2.5.5");
		expect(spacing.citation).toContain("spacing exception");
		expect(spacing.url).toBe(size.url);
	});

	it("returns an explicit 'no exact SC' citation for TYPOGRAPHY, not a fabricated number", () => {
		const result = getWcagCitation("TYPOGRAPHY", "AA");

		expect(result.exact).toBe(false);
		expect(result.citation).toContain("No exact WCAG SC");
		expect(result.citation).toContain("1.4.4");
	});

	it("still returns a working, real URL for TYPOGRAPHY despite having no exact SC", () => {
		const result = getWcagCitation("TYPOGRAPHY", "AA");

		expect(result.url).toBe("https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html");
	});

	it("returns the same typography citation regardless of target level", () => {
		expect(getWcagCitation("TYPOGRAPHY", "AA")).toEqual(getWcagCitation("TYPOGRAPHY", "AAA"));
	});

	it("returns a real w3.org URL for every issue type and level, never a placeholder", () => {
		const issueTypes: Array<Parameters<typeof getWcagCitation>[0]> = [
			"CONTRAST",
			"TYPOGRAPHY",
			"TOUCH_TARGET_SIZE",
			"TOUCH_TARGET_SPACING",
		];
		const levels: Array<Parameters<typeof getWcagCitation>[1]> = ["AA", "AAA"];

		issueTypes.forEach((issueType) => {
			levels.forEach((level) => {
				expect(getWcagCitation(issueType, level).url).toMatch(/^https:\/\/www\.w3\.org\//);
			});
		});
	});
});
