import { beforeEach, describe, expect, it, vi } from "vitest";
import { DetectedIssue } from "../types";

const { postMessageToBackend } = vi.hoisted(() => ({
	postMessageToBackend: vi.fn(),
}));

vi.mock("../figmaUtils", () => ({ postMessageToBackend }));

import { MESSAGE_TYPES } from "../constants";
import useIssuesStore from "./index";

const issues: DetectedIssue[] = [
	{
		type: "TYPOGRAPHY",
		severity: "major",
		nodeData: { id: "node-1", name: "Label A", nodeType: "TEXT" },
	},
	{
		type: "TYPOGRAPHY",
		severity: "major",
		nodeData: { id: "node-2", name: "Label B", nodeType: "TEXT" },
	},
];

describe("useIssuesStore.navigateToIssue", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({
			detectedIssues: issues,
			selectedType: "TYPOGRAPHY",
			currentIssueIndex: 0,
		});
	});

	it("posts MESSAGE_TYPES.NAVIGATE with the target node's id and updates currentIndex", () => {
		useIssuesStore.getState().navigateToIssue(1);

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NAVIGATE, {
			id: "node-2",
		});
		expect(useIssuesStore.getState().currentIssueIndex).toBe(1);
	});

	it("does nothing when the index is out of range", () => {
		useIssuesStore.getState().navigateToIssue(5);

		expect(postMessageToBackend).not.toHaveBeenCalled();
		expect(useIssuesStore.getState().currentIssueIndex).toBe(0);
	});

	it("does nothing when the index is negative", () => {
		useIssuesStore.getState().navigateToIssue(-1);

		expect(postMessageToBackend).not.toHaveBeenCalled();
		expect(useIssuesStore.getState().currentIssueIndex).toBe(0);
	});

	it("includes the issue's pageId when it came from a full-file scan", () => {
		useIssuesStore.setState({
			detectedIssues: [
				{
					type: "TYPOGRAPHY",
					severity: "major",
					nodeData: { id: "node-3", name: "Label C", nodeType: "TEXT", pageId: "page-2" },
				},
			],
			selectedType: "TYPOGRAPHY",
			currentIssueIndex: 0,
		});

		useIssuesStore.getState().navigateToIssue(0);

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NAVIGATE, {
			id: "node-3",
			pageId: "page-2",
		});
	});
});

function fakeContrastIssue(id: string, compliance: string): DetectedIssue {
	return {
		type: "CONTRAST",
		severity: "critical",
		nodeData: {
			id,
			name: id,
			nodeType: "TEXT",
			contrastScore: { compliance, ratio: compliance === "Fail" ? 2 : 5 },
		},
	};
}

describe("useIssuesStore.getIssueGroupList", () => {
	it("returns only issues matching the selected type", () => {
		useIssuesStore.setState({
			detectedIssues: [
				{
					type: "TYPOGRAPHY",
					severity: "major",
					nodeData: { id: "1", name: "A", nodeType: "TEXT" },
				},
				{
					type: "TOUCH_TARGET_SIZE",
					severity: "minor",
					nodeData: { id: "2", name: "B", nodeType: "FRAME" },
				},
			],
			selectedType: "TYPOGRAPHY",
		});

		const result = useIssuesStore.getState().getIssueGroupList();

		expect(result.map((issue) => issue.nodeData.id)).toEqual(["1"]);
	});

	it("includes a CONTRAST issue only when its compliance is Fail", () => {
		useIssuesStore.setState({
			detectedIssues: [fakeContrastIssue("fail", "Fail"), fakeContrastIssue("pass", "AA")],
			selectedType: "CONTRAST",
		});

		const result = useIssuesStore.getState().getIssueGroupList();

		expect(result.map((issue) => issue.nodeData.id)).toEqual(["fail"]);
	});

	it("excludes a CONTRAST issue with no contrastScore at all", () => {
		useIssuesStore.setState({
			detectedIssues: [
				{
					type: "CONTRAST",
					severity: "critical",
					nodeData: { id: "no-score", name: "A", nodeType: "TEXT" },
				},
			],
			selectedType: "CONTRAST",
		});

		expect(useIssuesStore.getState().getIssueGroupList()).toEqual([]);
	});

	it("returns an empty list when no scan has run yet (selectedType is empty)", () => {
		useIssuesStore.setState({
			detectedIssues: [
				{
					type: "TYPOGRAPHY",
					severity: "major",
					nodeData: { id: "1", name: "A", nodeType: "TEXT" },
				},
			],
			selectedType: "",
		});

		expect(useIssuesStore.getState().getIssueGroupList()).toEqual([]);
	});

	it("defaults targetLevel to AA, so only Fail-compliance CONTRAST issues are flagged", () => {
		useIssuesStore.setState({
			detectedIssues: [
				fakeContrastIssue("fail", "Fail"),
				fakeContrastIssue("aa-pass", "AA"),
				fakeContrastIssue("aaa-pass", "AAA"),
			],
			selectedType: "CONTRAST",
		});

		expect(useIssuesStore.getState().targetLevel).toBe("AA");
		expect(
			useIssuesStore
				.getState()
				.getIssueGroupList()
				.map((issue) => issue.nodeData.id),
		).toEqual(["fail"]);
	});

	it("flags AA-only compliant CONTRAST issues once the target level is AAA", () => {
		useIssuesStore.setState({
			detectedIssues: [
				fakeContrastIssue("fail", "Fail"),
				fakeContrastIssue("aa-pass", "AA"),
				fakeContrastIssue("aaa-pass", "AAA"),
			],
			selectedType: "CONTRAST",
			targetLevel: "AAA",
		});

		expect(
			useIssuesStore
				.getState()
				.getIssueGroupList()
				.map((issue) => issue.nodeData.id),
		).toEqual(["fail", "aa-pass"]);
	});
});

describe("useIssuesStore.setTargetLevel", () => {
	it("updates targetLevel and persists both settings via SAVE_SCAN_SETTINGS", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ targetLevel: "AA", deviceType: "pointer" });

		useIssuesStore.getState().setTargetLevel("AAA");

		expect(useIssuesStore.getState().targetLevel).toBe("AAA");
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SAVE_SCAN_SETTINGS, {
			deviceType: "pointer",
			targetLevel: "AAA",
		});
	});
});

describe("useIssuesStore.setDeviceType", () => {
	it("defaults to touch", () => {
		// getInitialState() reads the store's state as created, unaffected by
		// setState() calls elsewhere in this file - getState() here would be
		// order-dependent on whatever the last test to touch deviceType left it as.
		expect(useIssuesStore.getInitialState().deviceType).toBe("touch");
	});

	it("updates deviceType and persists both settings via SAVE_SCAN_SETTINGS", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ deviceType: "touch", targetLevel: "AAA" });

		useIssuesStore.getState().setDeviceType("pointer");

		expect(useIssuesStore.getState().deviceType).toBe("pointer");
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SAVE_SCAN_SETTINGS, {
			deviceType: "pointer",
			targetLevel: "AAA",
		});
	});
});

describe("useIssuesStore.hydrateScanSettings", () => {
	it("restores both settings at once without posting a SAVE_SCAN_SETTINGS message", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ deviceType: "touch", targetLevel: "AA" });

		useIssuesStore
			.getState()
			.hydrateScanSettings({ deviceType: "pointer", targetLevel: "AAA" });

		expect(useIssuesStore.getState().deviceType).toBe("pointer");
		expect(useIssuesStore.getState().targetLevel).toBe("AAA");
		expect(postMessageToBackend).not.toHaveBeenCalled();
	});
});

describe("useIssuesStore.startScan", () => {
	it("posts the current deviceType and targetLevel with the SCAN message", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ deviceType: "pointer", targetLevel: "AAA" });

		useIssuesStore.getState().startScan();

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN, {
			deviceType: "pointer",
			targetLevel: "AAA",
		});
	});

	it("clears a leftover fileScanCancelled from a previously cancelled file scan", () => {
		useIssuesStore.setState({ fileScanCancelled: true });

		useIssuesStore.getState().startScan();

		expect(useIssuesStore.getState().fileScanCancelled).toBe(false);
	});

	it("clears a leftover pageScanCancelled from a previously cancelled page scan", () => {
		useIssuesStore.setState({ pageScanCancelled: true });

		useIssuesStore.getState().startScan();

		expect(useIssuesStore.getState().pageScanCancelled).toBe(false);
	});

	it("clears isFileScan left over from a previous file scan", () => {
		useIssuesStore.setState({ isFileScan: true });

		useIssuesStore.getState().startScan();

		expect(useIssuesStore.getState().isFileScan).toBe(false);
	});
});

describe("useIssuesStore.cancelPageScan", () => {
	it("sets pageScanCancelled and posts CANCEL_SCAN", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ pageScanCancelled: false });

		useIssuesStore.getState().cancelPageScan();

		expect(useIssuesStore.getState().pageScanCancelled).toBe(true);
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.CANCEL_SCAN);
	});
});

describe("useIssuesStore.markFileScanOptionSeen", () => {
	it("sets hasSeenFileScanOption and posts MARK_FILE_SCAN_OPTION_SEEN the first time", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ hasSeenFileScanOption: false });

		useIssuesStore.getState().markFileScanOptionSeen();

		expect(useIssuesStore.getState().hasSeenFileScanOption).toBe(true);
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.MARK_FILE_SCAN_OPTION_SEEN);
	});

	it("is idempotent - does not repost once already seen", () => {
		useIssuesStore.setState({ hasSeenFileScanOption: true });
		postMessageToBackend.mockClear();

		useIssuesStore.getState().markFileScanOptionSeen();

		expect(postMessageToBackend).not.toHaveBeenCalled();
	});
});

describe("useIssuesStore.hydrateFileScanOptionSeen", () => {
	it("restores the seen flag without posting a message", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ hasSeenFileScanOption: false });

		useIssuesStore.getState().hydrateFileScanOptionSeen(true);

		expect(useIssuesStore.getState().hasSeenFileScanOption).toBe(true);
		expect(postMessageToBackend).not.toHaveBeenCalled();
	});
});

describe("useIssuesStore.hydratePageCount", () => {
	it("restores the page count without posting a message", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ pageCount: 1 });

		useIssuesStore.getState().hydratePageCount(4);

		expect(useIssuesStore.getState().pageCount).toBe(4);
		expect(postMessageToBackend).not.toHaveBeenCalled();
	});
});

describe("useIssuesStore.startFileScan", () => {
	it("posts the current deviceType and targetLevel with the SCAN_FILE message", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ deviceType: "pointer", targetLevel: "AAA" });

		useIssuesStore.getState().startFileScan();

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN_FILE, {
			deviceType: "pointer",
			targetLevel: "AAA",
		});
	});

	it("resets any leftover progress/cancelled state from a previous file scan", () => {
		useIssuesStore.setState({
			fileScanProgress: { pageIndex: 2, pageCount: 3, pageName: "Old page" },
			fileScanCancelled: true,
		});

		useIssuesStore.getState().startFileScan();

		expect(useIssuesStore.getState().fileScanProgress).toBeNull();
		expect(useIssuesStore.getState().fileScanCancelled).toBe(false);
	});

	it("sets isFileScan to true", () => {
		useIssuesStore.setState({ isFileScan: false });

		useIssuesStore.getState().startFileScan();

		expect(useIssuesStore.getState().isFileScan).toBe(true);
	});

	it("clears any leftover detectedIssues from a previous scan before starting", () => {
		useIssuesStore.setState({ detectedIssues: issues });

		useIssuesStore.getState().startFileScan();

		expect(useIssuesStore.getState().detectedIssues).toEqual([]);
	});
});

describe("useIssuesStore.appendDetectedIssues", () => {
	it("appends to existing detectedIssues without replacing them", () => {
		useIssuesStore.setState({ detectedIssues: [issues[0]] });

		useIssuesStore.getState().appendDetectedIssues([issues[1]]);

		expect(useIssuesStore.getState().detectedIssues).toEqual([issues[0], issues[1]]);
	});

	it("appends onto an empty array", () => {
		useIssuesStore.setState({ detectedIssues: [] });

		useIssuesStore.getState().appendDetectedIssues(issues);

		expect(useIssuesStore.getState().detectedIssues).toEqual(issues);
	});
});

describe("useIssuesStore.cancelFileScan", () => {
	it("sets fileScanCancelled and posts CANCEL_SCAN_FILE", () => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({ fileScanCancelled: false });

		useIssuesStore.getState().cancelFileScan();

		expect(useIssuesStore.getState().fileScanCancelled).toBe(true);
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.CANCEL_SCAN_FILE);
	});
});

describe("useIssuesStore.setFileScanProgress", () => {
	it("updates fileScanProgress", () => {
		const progress = { pageIndex: 1, pageCount: 4, pageName: "Home" };

		useIssuesStore.getState().setFileScanProgress(progress);

		expect(useIssuesStore.getState().fileScanProgress).toEqual(progress);
	});

	it("can be cleared back to null", () => {
		useIssuesStore.setState({
			fileScanProgress: { pageIndex: 1, pageCount: 4, pageName: "Home" },
		});

		useIssuesStore.getState().setFileScanProgress(null);

		expect(useIssuesStore.getState().fileScanProgress).toBeNull();
	});
});
