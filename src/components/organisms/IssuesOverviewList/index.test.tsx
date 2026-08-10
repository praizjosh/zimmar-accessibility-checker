import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_TYPES } from "@/lib/constants";
import { DetectedIssue } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";

const { postMessageToBackend } = vi.hoisted(() => ({
	postMessageToBackend: vi.fn(),
}));

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend }));

const { saveAs } = vi.hoisted(() => ({ saveAs: vi.fn() }));

vi.mock("file-saver", () => ({ saveAs }));

import IssuesOverviewList from "./index";

async function goToReportTab(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("tab", { name: "Report" }));
}

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

const contrastPassIssue: DetectedIssue = {
	...contrastFailIssue,
	nodeData: {
		...contrastFailIssue.nodeData,
		id: "c2",
		contrastScore: { compliance: "AA", ratio: 5 },
	},
};

const contrastFailIssueWithApca: DetectedIssue = {
	...contrastFailIssue,
	nodeData: {
		...contrastFailIssue.nodeData,
		id: "c3",
		apcaScore: { lc: -80, tier: "body", requiredLc: 75, maxLc: null, meetsMinimum: true },
	},
};

const defaultState = {
	detectedIssues: [] as DetectedIssue[],
	scanning: false,
	currentRoute: "INDEX" as const,
	selectedType: "" as const,
	targetLevel: "AA" as const,
	deviceType: "touch" as const,
	fileScanProgress: null,
	isFileScan: false,
	fileScanCancelled: false,
	pageScanCancelled: false,
};

describe("IssuesOverviewList", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		saveAs.mockClear();
		useIssuesStore.setState(defaultState);
	});

	it("shows a loading screen instead of the tabs while scanning", () => {
		useIssuesStore.setState({ scanning: true });
		render(<IssuesOverviewList />);

		expect(screen.getByText("Scanning for issues...")).toBeVisible();
		expect(screen.queryByRole("tablist")).toBeNull();
		expect(screen.queryByRole("button", { name: "Rescan for issues" })).toBeNull();
	});

	it("shows a cancel button during a plain single-page scan", () => {
		useIssuesStore.setState({ scanning: true });
		render(<IssuesOverviewList />);

		expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
	});

	it("cancels the page scan when the cancel button is clicked during a plain scan", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ scanning: true });
		render(<IssuesOverviewList />);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(useIssuesStore.getState().pageScanCancelled).toBe(true);
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.CANCEL_SCAN);
	});

	it("shows a partial-results banner after a cancelled single-page scan's results arrive", () => {
		useIssuesStore.setState({ pageScanCancelled: true, detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		expect(screen.getByText(/Scan cancelled/)).toBeVisible();
	});

	it("shows a blocking loading screen (not the results view) before the first page of a file scan finishes", () => {
		useIssuesStore.setState({
			scanning: true,
			isFileScan: true,
			fileScanProgress: null,
			pageCount: 5,
		});
		render(<IssuesOverviewList />);

		expect(screen.getByText("Scanning page 1 of 5...")).toBeVisible();
		expect(screen.queryByText("Scanning for issues...")).toBeNull();
		expect(screen.queryByRole("tablist")).toBeNull();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
	});

	it("shows the results view with an in-progress banner once the first page of a file scan lands", () => {
		useIssuesStore.setState({
			scanning: true,
			isFileScan: true,
			fileScanProgress: { pageIndex: 2, pageCount: 5, pageName: "About" },
			detectedIssues: [typographyIssue],
		});
		render(<IssuesOverviewList />);

		expect(
			screen.getByText(/Scanning page 2 of 5: About\. Results below update/),
		).toBeVisible();
		expect(screen.getByRole("tablist")).toBeVisible();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
	});

	it("cancels the file scan when the cancel button is clicked", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			scanning: true,
			isFileScan: true,
			fileScanProgress: { pageIndex: 1, pageCount: 3, pageName: "Home" },
		});
		render(<IssuesOverviewList />);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(useIssuesStore.getState().fileScanCancelled).toBe(true);
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.CANCEL_SCAN_FILE);
	});

	it("shows a 'Finishing up' banner with no cancel button once the scan is cancelled but the last page hasn't landed yet", () => {
		useIssuesStore.setState({
			scanning: true,
			isFileScan: true,
			fileScanCancelled: true,
			fileScanProgress: { pageIndex: 3, pageCount: 5, pageName: "Contact" },
			detectedIssues: [typographyIssue],
		});
		render(<IssuesOverviewList />);

		expect(screen.getByText("Finishing up - page 3 of 5...")).toBeVisible();
		expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
		expect(screen.queryByText(/Scan cancelled/)).toBeNull();
	});

	it("shows a partial-results banner after a cancelled file scan's results arrive", () => {
		useIssuesStore.setState({ fileScanCancelled: true, detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		expect(screen.getByText(/Scan cancelled/)).toBeVisible();
	});

	it("does not show the partial-results banner when the last scan wasn't cancelled", () => {
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		expect(screen.queryByText(/Scan cancelled/)).toBeNull();
	});

	it("returns to the index and clears issues when the back button is clicked", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await user.click(screen.getByRole("button", { name: "Back" }));

		expect(useIssuesStore.getState().currentRoute).toBe("INDEX");
		expect(useIssuesStore.getState().detectedIssues).toEqual([]);
	});

	it("disables the back button while a scan is in progress", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			scanning: true,
			currentRoute: "ISSUE_OVERVIEW_LIST_VIEW",
			detectedIssues: [typographyIssue],
		});
		render(<IssuesOverviewList />);

		const backButton = screen.getByRole("button", { name: "Back" });
		expect(backButton).toBeDisabled();

		await user.click(backButton);

		expect(useIssuesStore.getState().currentRoute).toBe("ISSUE_OVERVIEW_LIST_VIEW");
		expect(useIssuesStore.getState().detectedIssues).toEqual([typographyIssue]);
	});

	it("re-enables the back button once scanning finishes", () => {
		useIssuesStore.setState({ scanning: false });
		render(<IssuesOverviewList />);

		expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
	});

	it("rescans by clearing issues and starting a new scan", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await user.click(screen.getByRole("button", { name: "Rescan for issues" }));

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN, {
			deviceType: "touch",
			targetLevel: "AA",
		});
		expect(useIssuesStore.getState().scanning).toBe(true);
	});

	it("rescans with a file scan, not a plain page scan, when the current results came from a file scan", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ isFileScan: true, detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await user.click(screen.getByRole("button", { name: "Rescan for issues" }));

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN_FILE, {
			deviceType: "touch",
			targetLevel: "AA",
		});
		expect(postMessageToBackend).not.toHaveBeenCalledWith(
			MESSAGE_TYPES.SCAN,
			expect.anything(),
		);
		expect(useIssuesStore.getState().scanning).toBe(true);
	});

	it("shows 'No issues found' when there are no issues", () => {
		render(<IssuesOverviewList />);

		expect(screen.getByText("No issues found")).toBeVisible();
	});

	it("lists each present issue type with its count and only counts failing contrast issues", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			detectedIssues: [typographyIssue, contrastFailIssue, contrastPassIssue],
		});
		render(<IssuesOverviewList />);

		expect(screen.getByText("There are 2 issues detected on this page.")).toBeVisible();

		const contrastRow = screen.getByRole("button", { name: "Contrast" });
		expect(contrastRow).toHaveTextContent("1");

		await user.click(screen.getByRole("button", { name: "Typography" }));

		expect(useIssuesStore.getState().selectedType).toBe("TYPOGRAPHY");
		expect(useIssuesStore.getState().currentRoute).toBe("ISSUE_LIST_VIEW");
	});

	it("says 'across this file', not 'on this page', when the issues came from a file scan", () => {
		useIssuesStore.setState({
			isFileScan: true,
			detectedIssues: [typographyIssue, contrastFailIssue],
		});
		render(<IssuesOverviewList />);

		expect(screen.getByText("There are 2 issues detected across this file.")).toBeVisible();
		expect(screen.queryByText(/on this page/)).toBeNull();
	});

	it("does not show the WCAG target toggle when there are no contrast issues", () => {
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		expect(screen.queryByText("WCAG target")).toBeNull();
	});

	it("shows the WCAG target toggle when there are contrast issues, defaulting to AA", () => {
		useIssuesStore.setState({
			detectedIssues: [contrastFailIssue, contrastPassIssue],
		});
		render(<IssuesOverviewList />);

		expect(screen.getByText("WCAG target")).toBeVisible();
		expect(screen.getByRole("radio", { name: "AA" })).toHaveAttribute("aria-checked", "true");
	});

	it("counts an AA-passing contrast issue as failing once the target level is switched to AAA", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			detectedIssues: [contrastFailIssue, contrastPassIssue],
		});
		render(<IssuesOverviewList />);

		expect(screen.getByText("There are 1 issues detected on this page.")).toBeVisible();

		await user.click(screen.getByRole("radio", { name: "AAA" }));

		expect(useIssuesStore.getState().targetLevel).toBe("AAA");
		expect(screen.getByText("There are 2 issues detected on this page.")).toBeVisible();
	});

	it("shows the category breakdown chart on the Report tab only when there are counted issues", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await goToReportTab(user);

		expect(screen.getByText("Issues by category")).toBeVisible();
	});

	it("does not show the breakdown chart when there are no counted issues", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [contrastPassIssue] });
		render(<IssuesOverviewList />);

		await goToReportTab(user);

		expect(screen.queryByText("Issues by category")).toBeNull();
	});

	it("downloads a CSV report when 'Download CSV' is clicked", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await goToReportTab(user);
		await user.click(screen.getByRole("button", { name: "Download CSV" }));

		expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "accessibility-issues-report.csv");
	});

	it("downloads a JSON report when 'Download JSON' is clicked", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await goToReportTab(user);
		await user.click(screen.getByRole("button", { name: "Download JSON" }));

		expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), "accessibility-issues-report.json");
	});

	it("exports a target-level-aware contrast description, not the stale 'below WCAG AA standard' text", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [contrastPassIssue], targetLevel: "AAA" });
		render(<IssuesOverviewList />);

		await goToReportTab(user);
		await user.click(screen.getByRole("button", { name: "Download JSON" }));

		const blob = saveAs.mock.calls[0][0] as Blob;
		const content = JSON.parse(await blob.text());

		expect(content[0].description).toBe(
			"Text contrast meets WCAG AA but is below the stricter WCAG AAA standard.",
		);
	});

	it("includes APCA Lc, meets-minimum, and disagreement columns in the CSV export", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			detectedIssues: [contrastFailIssueWithApca],
			targetLevel: "AA",
		});
		render(<IssuesOverviewList />);

		await goToReportTab(user);
		await user.click(screen.getByRole("button", { name: "Download CSV" }));

		const blob = saveAs.mock.calls[0][0] as Blob;
		const content = await blob.text();
		const [header, firstRow] = content.split("\n");

		expect(header).toContain("APCA Lc,APCA Meets Minimum,WCAG/APCA Disagree");
		// WCAG fails ("Fail") but APCA meets its minimum (lc: -80, magnitude 80) - a disagreement.
		expect(firstRow).toContain('"80"');
		expect(firstRow).toContain('"Pass"');
		expect(firstRow).toContain('"Yes"');
	});

	it("includes the same APCA fields in the JSON export", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			detectedIssues: [contrastFailIssueWithApca],
			targetLevel: "AA",
		});
		render(<IssuesOverviewList />);

		await goToReportTab(user);
		await user.click(screen.getByRole("button", { name: "Download JSON" }));

		const blob = saveAs.mock.calls[0][0] as Blob;
		const content = JSON.parse(await blob.text());

		expect(content[0].apcaLc).toBe(80);
		expect(content[0].apcaMeetsMinimum).toBe("Pass");
		expect(content[0].wcagApcaDisagree).toBe("Yes");
	});

	it("reports 'N/A' for the APCA columns on a non-CONTRAST issue", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await goToReportTab(user);
		await user.click(screen.getByRole("button", { name: "Download JSON" }));

		const blob = saveAs.mock.calls[0][0] as Blob;
		const content = JSON.parse(await blob.text());

		expect(content[0].apcaLc).toBe("N/A");
		expect(content[0].apcaMeetsMinimum).toBe("N/A");
		expect(content[0].wcagApcaDisagree).toBe("N/A");
	});

	describe("active settings readout", () => {
		it("shows the current target level and device type", () => {
			useIssuesStore.setState({ targetLevel: "AAA", deviceType: "pointer" });
			render(<IssuesOverviewList />);

			expect(screen.getByText(/Scanning against.*AAA.*Pointer/)).toBeVisible();
		});

		it("updates when the settings change", () => {
			useIssuesStore.setState({ targetLevel: "AA", deviceType: "touch" });
			const { rerender } = render(<IssuesOverviewList />);

			expect(screen.getByText(/Scanning against.*AA.*Touch/)).toBeVisible();

			useIssuesStore.setState({ deviceType: "pointer" });
			rerender(<IssuesOverviewList />);

			expect(screen.getByText(/Scanning against.*AA.*Pointer/)).toBeVisible();
			expect(screen.queryByText(/Scanning against.*Touch/)).toBeNull();
		});

		it("is visible while scanning too, not just after results arrive", () => {
			useIssuesStore.setState({ scanning: true, targetLevel: "AAA", deviceType: "touch" });
			render(<IssuesOverviewList />);

			expect(screen.getByText(/Scanning against.*AAA.*Touch/)).toBeVisible();
		});
	});

	describe("touch-target-skipped note", () => {
		it("shows an info popover explaining touch-target checks are skipped when designing for Pointer", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({ deviceType: "pointer", detectedIssues: [typographyIssue] });
			render(<IssuesOverviewList />);

			const trigger = screen.getByLabelText("About Touch Target Checks Skipped");
			expect(trigger).toBeVisible();

			await user.click(trigger);

			expect(screen.getByText(/Touch target checks are skipped/)).toBeVisible();
		});

		it("shows the popover trigger even when there are no issues at all", () => {
			useIssuesStore.setState({ deviceType: "pointer", detectedIssues: [] });
			render(<IssuesOverviewList />);

			expect(screen.getByLabelText("About Touch Target Checks Skipped")).toBeVisible();
			expect(screen.getByText("No issues found")).toBeVisible();
		});

		it("does not show the popover trigger when designing for Touch", () => {
			useIssuesStore.setState({ deviceType: "touch", detectedIssues: [typographyIssue] });
			render(<IssuesOverviewList />);

			expect(screen.queryByLabelText("About Touch Target Checks Skipped")).toBeNull();
		});
	});
});
