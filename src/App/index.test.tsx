import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_TYPES } from "@/lib/constants";
import { DetectedIssue } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";

const { postMessageToBackend } = vi.hoisted(() => ({
	postMessageToBackend: vi.fn(),
}));

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend }));

import App from "./index";

function dispatch(type: string, data: unknown) {
	window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: { type, data } } }));
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

describe("App", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({
			currentRoute: "INDEX",
			targetLevel: "AA",
			deviceType: "touch",
			scanning: false,
			isFileScan: false,
			fileScanProgress: null,
			fileScanCancelled: false,
			detectedIssues: [],
		});
	});

	it("hydrates targetLevel and deviceType from a LOAD_SCAN_SETTINGS message", () => {
		render(<App />);

		dispatch(MESSAGE_TYPES.LOAD_SCAN_SETTINGS, {
			deviceType: "pointer",
			targetLevel: "AAA",
		});

		expect(useIssuesStore.getState().deviceType).toBe("pointer");
		expect(useIssuesStore.getState().targetLevel).toBe("AAA");
	});

	it("hydrates hasSeenFileScanOption from a LOAD_FILE_SCAN_OPTION_SEEN message", () => {
		render(<App />);

		dispatch(MESSAGE_TYPES.LOAD_FILE_SCAN_OPTION_SEEN, { seen: true });

		expect(useIssuesStore.getState().hasSeenFileScanOption).toBe(true);
	});

	it("hydrates pageCount from a LOAD_PAGE_COUNT message", () => {
		render(<App />);

		dispatch(MESSAGE_TYPES.LOAD_PAGE_COUNT, { pageCount: 4 });

		expect(useIssuesStore.getState().pageCount).toBe(4);
	});

	it("updates fileScanProgress from a SCAN_FILE_PROGRESS message", () => {
		render(<App />);

		dispatch(MESSAGE_TYPES.SCAN_FILE_PROGRESS, {
			pageIndex: 2,
			pageCount: 5,
			pageName: "About",
		});

		expect(useIssuesStore.getState().fileScanProgress).toEqual({
			pageIndex: 2,
			pageCount: 5,
			pageName: "About",
		});
	});

	it("loads issues from a LOAD_ISSUES message and stops scanning", () => {
		useIssuesStore.setState({ scanning: true });
		render(<App />);

		dispatch(MESSAGE_TYPES.LOAD_ISSUES, [typographyIssue]);

		expect(useIssuesStore.getState().scanning).toBe(false);
		expect(useIssuesStore.getState().detectedIssues).toEqual([typographyIssue]);
	});

	it("appends streamed-in page issues via SCAN_FILE_PAGE_ISSUES without replacing existing ones", () => {
		useIssuesStore.setState({
			scanning: true,
			isFileScan: true,
			fileScanProgress: { pageIndex: 1, pageCount: 2, pageName: "Home" },
			detectedIssues: [typographyIssue],
		});
		render(<App />);

		dispatch(MESSAGE_TYPES.SCAN_FILE_PAGE_ISSUES, [contrastFailIssue]);

		expect(useIssuesStore.getState().detectedIssues).toEqual([
			typographyIssue,
			contrastFailIssue,
		]);
		expect(useIssuesStore.getState().scanning).toBe(true);
	});

	it("stops scanning and clears progress via SCAN_FILE_COMPLETE without a cancellation", () => {
		useIssuesStore.setState({
			scanning: true,
			isFileScan: true,
			fileScanProgress: { pageIndex: 2, pageCount: 2, pageName: "About" },
			detectedIssues: [typographyIssue],
		});
		render(<App />);

		dispatch(MESSAGE_TYPES.SCAN_FILE_COMPLETE, { cancelled: false });

		expect(useIssuesStore.getState().scanning).toBe(false);
		expect(useIssuesStore.getState().fileScanProgress).toBeNull();
		expect(useIssuesStore.getState().fileScanCancelled).toBe(false);
	});

	it("clears fileScanProgress once a cancelled file scan's SCAN_FILE_COMPLETE arrives, leaving fileScanCancelled set", () => {
		useIssuesStore.setState({
			scanning: true,
			isFileScan: true,
			fileScanCancelled: true,
			fileScanProgress: { pageIndex: 2, pageCount: 3, pageName: "About" },
			detectedIssues: [typographyIssue],
		});
		render(<App />);

		dispatch(MESSAGE_TYPES.SCAN_FILE_COMPLETE, { cancelled: true });

		expect(useIssuesStore.getState().fileScanProgress).toBeNull();
		expect(useIssuesStore.getState().fileScanCancelled).toBe(true);
		expect(useIssuesStore.getState().scanning).toBe(false);
	});

	it("still processes SCAN_FILE_PAGE_ISSUES and SCAN_FILE_COMPLETE while a different screen (not the results overview) is showing", () => {
		// Regression test: a file scan can keep running in the background while
		// the user has drilled into an issue's detail view, which unmounts
		// IssuesOverviewList. Before these messages were handled at this
		// always-mounted App level, that unmount silently dropped them -
		// scanning got stuck true forever once the user came back.
		useIssuesStore.setState({
			currentRoute: "ISSUE_LIST_VIEW",
			scanning: true,
			isFileScan: true,
			fileScanProgress: { pageIndex: 11, pageCount: 12, pageName: "Checkout" },
			detectedIssues: [typographyIssue],
		});
		render(<App />);

		dispatch(MESSAGE_TYPES.SCAN_FILE_PAGE_ISSUES, [contrastFailIssue]);
		dispatch(MESSAGE_TYPES.SCAN_FILE_COMPLETE, { cancelled: false });

		expect(useIssuesStore.getState().detectedIssues).toEqual([
			typographyIssue,
			contrastFailIssue,
		]);
		expect(useIssuesStore.getState().scanning).toBe(false);
		expect(useIssuesStore.getState().fileScanProgress).toBeNull();
	});

	it("logs an error and ignores a malformed message", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(<App />);

		window.dispatchEvent(new MessageEvent("message", { data: null }));

		expect(errorSpy).toHaveBeenCalledWith("Invalid message format:", null);
		expect(useIssuesStore.getState().detectedIssues).toEqual([]);

		errorSpy.mockRestore();
	});

	it("ignores an unrelated message type", () => {
		render(<App />);

		dispatch("some-other-message", { foo: "bar" });

		expect(useIssuesStore.getState().deviceType).toBe("touch");
		expect(useIssuesStore.getState().targetLevel).toBe("AA");
	});

	it("renders the route for the current currentRoute", () => {
		render(<App />);

		expect(screen.getByRole("button", { name: "Scan entire page" })).toBeVisible();
	});
});
