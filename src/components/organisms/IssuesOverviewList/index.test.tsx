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

function dispatch(type: string, data: unknown) {
	window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: { type, data } } }));
}

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

const defaultState = {
	detectedIssues: [] as DetectedIssue[],
	scanning: false,
	currentRoute: "INDEX" as const,
	selectedType: "" as const,
	targetLevel: "AA" as const,
	deviceType: "touch" as const,
	fileScanProgress: null,
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

	it("shows file-scan progress and a cancel button instead of the plain loading message during a file scan", () => {
		useIssuesStore.setState({
			scanning: true,
			fileScanProgress: { pageIndex: 2, pageCount: 5, pageName: "About" },
		});
		render(<IssuesOverviewList />);

		expect(screen.getByText("Scanning page 2 of 5: About")).toBeVisible();
		expect(screen.queryByText("Scanning for issues...")).toBeNull();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
	});

	it("cancels the file scan when the cancel button is clicked", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			scanning: true,
			fileScanProgress: { pageIndex: 1, pageCount: 3, pageName: "Home" },
		});
		render(<IssuesOverviewList />);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(useIssuesStore.getState().fileScanCancelled).toBe(true);
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.CANCEL_SCAN_FILE);
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

	it("clears fileScanProgress once LOAD_ISSUES arrives, leaving fileScanCancelled for the banner", () => {
		useIssuesStore.setState({
			scanning: true,
			fileScanCancelled: true,
			fileScanProgress: { pageIndex: 2, pageCount: 3, pageName: "About" },
		});
		render(<IssuesOverviewList />);

		dispatch(MESSAGE_TYPES.LOAD_ISSUES, [typographyIssue]);

		expect(useIssuesStore.getState().fileScanProgress).toBeNull();
		expect(useIssuesStore.getState().fileScanCancelled).toBe(true);
		expect(useIssuesStore.getState().scanning).toBe(false);
	});

	it("loads issues from a LOAD_ISSUES message and stops scanning", async () => {
		useIssuesStore.setState({ scanning: true });
		render(<IssuesOverviewList />);

		dispatch(MESSAGE_TYPES.LOAD_ISSUES, [typographyIssue]);

		expect(useIssuesStore.getState().scanning).toBe(false);
		expect(useIssuesStore.getState().detectedIssues).toEqual([typographyIssue]);
	});

	it("logs an error and ignores a malformed message", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(<IssuesOverviewList />);

		window.dispatchEvent(new MessageEvent("message", { data: null }));

		expect(errorSpy).toHaveBeenCalledWith("Invalid message format:", null);
		expect(useIssuesStore.getState().detectedIssues).toEqual([]);

		errorSpy.mockRestore();
	});

	it("returns to the index and clears issues when the back button is clicked", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ detectedIssues: [typographyIssue] });
		render(<IssuesOverviewList />);

		await user.click(screen.getByRole("button", { name: "Back" }));

		expect(useIssuesStore.getState().currentRoute).toBe("INDEX");
		expect(useIssuesStore.getState().detectedIssues).toEqual([]);
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

		expect(screen.getByText("There are 2 issues detected on this screen.")).toBeVisible();

		const contrastRow = screen.getByRole("button", { name: "Contrast" });
		expect(contrastRow).toHaveTextContent("1");

		await user.click(screen.getByRole("button", { name: "Typography" }));

		expect(useIssuesStore.getState().selectedType).toBe("TYPOGRAPHY");
		expect(useIssuesStore.getState().currentRoute).toBe("ISSUE_LIST_VIEW");
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

		expect(screen.getByText("There are 1 issues detected on this screen.")).toBeVisible();

		await user.click(screen.getByRole("radio", { name: "AAA" }));

		expect(useIssuesStore.getState().targetLevel).toBe("AAA");
		expect(screen.getByText("There are 2 issues detected on this screen.")).toBeVisible();
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
