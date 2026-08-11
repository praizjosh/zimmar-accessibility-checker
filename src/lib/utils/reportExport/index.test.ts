import { beforeEach, describe, expect, it, vi } from "vitest";
import { DetectedIssue } from "@/lib/types";

const { saveAs } = vi.hoisted(() => ({ saveAs: vi.fn() }));

vi.mock("file-saver", () => ({ saveAs }));

beforeEach(() => {
	saveAs.mockClear();
});

import {
	formatIssuesForReport,
	generateCSVReport,
	generateJSONReport,
	generateMarkdownReport,
} from "./index";

const typographyIssue: DetectedIssue = {
	type: "TYPOGRAPHY",
	description: "Text size is too small for readability.",
	severity: "major",
	nodeData: { id: "t1", name: "Label", nodeType: "TEXT" },
};

const contrastFailIssue: DetectedIssue = {
	type: "CONTRAST",
	description: "Text contrast is below WCAG AA standard.",
	severity: "critical",
	nodeData: {
		id: "c1",
		name: "Text",
		nodeType: "TEXT",
		contrastScore: { compliance: "Fail", ratio: 2 },
	},
};

describe("formatIssuesForReport", () => {
	it("derives a target-level-aware contrast description instead of the raw scan-time one", () => {
		const passingAtAA: DetectedIssue = {
			...contrastFailIssue,
			nodeData: {
				...contrastFailIssue.nodeData,
				contrastScore: { compliance: "AA", ratio: 5 },
			},
		};

		const [formatted] = formatIssuesForReport([passingAtAA], "AAA");

		expect(formatted.description).toBe(
			"Text contrast meets WCAG AA but is below the stricter WCAG AAA standard.",
		);
	});

	it("reports 'N/A' for APCA fields on a non-CONTRAST issue", () => {
		const [formatted] = formatIssuesForReport([typographyIssue], "AA");

		expect(formatted.apcaLc).toBe("N/A");
		expect(formatted.apcaMeetsMinimum).toBe("N/A");
		expect(formatted.wcagApcaDisagree).toBe("N/A");
	});

	it("includes the WCAG SC citation and URL for the given target level", () => {
		const [formatted] = formatIssuesForReport([contrastFailIssue], "AA");

		expect(formatted.wcagCitation).toBe("WCAG 1.4.3 Contrast (Minimum) (AA)");
		expect(formatted.wcagCitationUrl).toBe(
			"https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
		);
	});
});

describe("generateCSVReport", () => {
	it("saves a CSV blob with a header row and one quoted row per issue", async () => {
		generateCSVReport(formatIssuesForReport([typographyIssue], "AA"));

		expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "accessibility-issues-report.csv");
		const blob = saveAs.mock.calls[0][0] as Blob;
		const [header, firstRow] = (await blob.text()).split("\n");

		expect(header).toContain("Element Type,Element Name,Issue Type");
		expect(firstRow).toContain('"Typography"');
	});
});

describe("generateJSONReport", () => {
	it("saves a JSON blob containing the formatted issues", async () => {
		generateJSONReport(formatIssuesForReport([typographyIssue], "AA"));

		expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "accessibility-issues-report.json");
		const blob = saveAs.mock.calls[0][0] as Blob;
		const content = JSON.parse(await blob.text());

		expect(content[0].description).toBe("Text size is too small for readability.");
	});
});

describe("generateMarkdownReport", () => {
	it("groups issues under a severity heading and links the WCAG citation", async () => {
		generateMarkdownReport(formatIssuesForReport([contrastFailIssue], "AA"), false);

		expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "accessibility-issues-report.md");
		const blob = saveAs.mock.calls[0][0] as Blob;
		const content = await blob.text();

		expect(content).toContain("## Critical");
		expect(content).toContain(
			"[WCAG 1.4.3 Contrast (Minimum) (AA)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)",
		);
	});

	it("says 'across this file' when isFileScan is true", async () => {
		generateMarkdownReport(formatIssuesForReport([typographyIssue], "AA"), true);

		const blob = saveAs.mock.calls[0][0] as Blob;
		const content = await blob.text();

		expect(content).toContain("across this file");
	});
});
