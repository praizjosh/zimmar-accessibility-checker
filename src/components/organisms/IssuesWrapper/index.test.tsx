import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_TYPES } from "@/lib/constants";
import { DetectedIssue } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";

const { postMessageToBackend } = vi.hoisted(() => ({
	postMessageToBackend: vi.fn(),
}));

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend }));

import IssuesWrapper from "./index";

function dispatch(type: string, data: unknown) {
	window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: { type, data } } }));
}

const typographyIssue: DetectedIssue = {
	type: "TYPOGRAPHY",
	description: "Text size is too small for readability.",
	severity: "major",
	nodeData: { id: "t1", name: "Label", nodeType: "TEXT" },
};

const touchTargetIssue: DetectedIssue = {
	type: "TOUCH_TARGET_SIZE",
	description: "Touch target size is too small for accessibility.",
	severity: "minor",
	nodeData: {
		id: "tt1",
		name: "Btn",
		nodeType: "FRAME",
		width: 20,
		height: 20,
	},
};

const contrastFailIssue: DetectedIssue = {
	type: "CONTRAST",
	severity: "critical",
	nodeData: {
		id: "c1",
		name: "Text",
		nodeType: "TEXT",
		contrastScore: { compliance: "Fail", ratio: 2 },
	},
};

const contrastAaOnlyIssue: DetectedIssue = {
	...contrastFailIssue,
	nodeData: {
		...contrastFailIssue.nodeData,
		id: "c2",
		contrastScore: { compliance: "AA", ratio: 5 },
	},
};

const touchTargetIssue2: DetectedIssue = {
	...touchTargetIssue,
	nodeData: { ...touchTargetIssue.nodeData, id: "tt2", name: "Btn 2" },
};

const touchTargetIssue3: DetectedIssue = {
	...touchTargetIssue,
	nodeData: { ...touchTargetIssue.nodeData, id: "tt3", name: "Btn 3" },
};

const defaultState = {
	detectedIssues: [] as DetectedIssue[],
	singleIssue: null,
	selectionIssues: [] as DetectedIssue[],
	currentIssueIndex: 0,
	currentRoute: "INDEX" as const,
	selectedType: "" as const,
	targetLevel: "AA" as const,
};

describe("IssuesWrapper", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState(defaultState);
	});

	it("returns to the issue overview when the back button is clicked outside quick-check mode", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ selectedType: "TYPOGRAPHY" });
		render(<IssuesWrapper>child</IssuesWrapper>);

		await user.click(screen.getByRole("button", { name: "Back" }));

		expect(useIssuesStore.getState().currentRoute).toBe("ISSUE_OVERVIEW_LIST_VIEW");
	});

	it("cancels the quick check and returns to INDEX when quick-check is active", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			selectionIssues: [touchTargetIssue, touchTargetIssue2],
		});
		render(<IssuesWrapper>child</IssuesWrapper>);

		dispatch(MESSAGE_TYPES.QUICKCHECK_ACTIVE, true);
		postMessageToBackend.mockClear();

		await user.click(screen.getByRole("button", { name: "Back" }));

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.CANCEL_QUICKCHECK);
		expect(useIssuesStore.getState().currentRoute).toBe("INDEX");
		expect(useIssuesStore.getState().singleIssue).toBeNull();
		expect(useIssuesStore.getState().selectionIssues).toEqual([]);
	});

	it("sets singleIssue to the detected issue matching the selected type", async () => {
		useIssuesStore.setState({ selectedType: "CONTRAST" });
		render(<IssuesWrapper>child</IssuesWrapper>);

		dispatch(MESSAGE_TYPES.DETECTED_ISSUE, [typographyIssue, contrastFailIssue]);

		await waitFor(() => expect(useIssuesStore.getState().singleIssue?.nodeData.id).toBe("c1"));
	});

	it("clears singleIssue when no detected issues match the selected type", async () => {
		useIssuesStore.setState({
			selectedType: "CONTRAST",
			singleIssue: contrastFailIssue,
		});
		render(<IssuesWrapper>child</IssuesWrapper>);

		dispatch(MESSAGE_TYPES.DETECTED_ISSUE, [typographyIssue]);

		await waitFor(() => expect(useIssuesStore.getState().singleIssue).toBeNull());
	});

	it("shows a selection hint only once NO_SELECTION reports nothing is selected", async () => {
		useIssuesStore.setState({ selectedType: "TYPOGRAPHY" });
		render(<IssuesWrapper>child</IssuesWrapper>);

		expect(screen.queryByText(/Select a Text layer/)).toBeNull();

		dispatch(MESSAGE_TYPES.NO_SELECTION, true);
		expect(await screen.findByText(/Select a Text layer/)).toBeVisible();

		dispatch(MESSAGE_TYPES.LAYER_SELECTED, true);
		await waitFor(() => expect(screen.queryByText(/Select a Text layer/)).toBeNull());
	});

	it("surfaces NO_BACKGROUND/NO_FOREGROUND messages only for the CONTRAST type", async () => {
		useIssuesStore.setState({ selectedType: "CONTRAST" });
		render(<IssuesWrapper>child</IssuesWrapper>);

		dispatch(MESSAGE_TYPES.NO_BACKGROUND, "No background detected.");
		dispatch(MESSAGE_TYPES.NO_FOREGROUND, "No foreground detected.");

		expect(await screen.findByText("No background detected.")).toBeVisible();
		expect(screen.getByText("No foreground detected.")).toBeVisible();
	});

	it("paginates between issues within the current type's bounds", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [
				typographyIssue,
				{
					...typographyIssue,
					nodeData: { ...typographyIssue.nodeData, id: "t2" },
				},
			],
		});
		render(<IssuesWrapper>child</IssuesWrapper>);

		expect(screen.getByText("Issue 1 of 2")).toBeVisible();
		expect(screen.getByRole("button", { name: "Goto previous issue" })).toBeDisabled();

		await user.click(screen.getByRole("button", { name: "Goto next issue" }));

		expect(screen.getByText("Issue 2 of 2")).toBeVisible();
		expect(screen.getByRole("button", { name: "Goto next issue" })).toBeDisabled();
	});

	it("only shows the type switcher when more than one issue type is present, and switching updates the route", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [typographyIssue],
		});
		const { rerender } = render(<IssuesWrapper>child</IssuesWrapper>);

		expect(screen.queryByRole("tablist")).toBeNull();

		useIssuesStore.setState({ detectedIssues: [typographyIssue, touchTargetIssue] });
		rerender(<IssuesWrapper>child</IssuesWrapper>);

		const tablist = screen.getByRole("tablist", { name: "Switch issue type" });
		expect(tablist).toBeVisible();

		await user.click(screen.getByRole("tab", { name: "Switch to Touch Target Size issues" }));

		expect(useIssuesStore.getState().selectedType).toBe("TOUCH_TARGET_SIZE");
		expect(useIssuesStore.getState().currentRoute).toBe("TOUCH_TARGET_ISSUE_LIST_VIEW");
	});

	it("does not show a Contrast tab when the only contrast issues present aren't currently failing", async () => {
		useIssuesStore.setState({
			selectedType: "TOUCH_TARGET_SIZE",
			detectedIssues: [touchTargetIssue, contrastAaOnlyIssue],
			targetLevel: "AA",
		});
		const { rerender } = render(<IssuesWrapper>child</IssuesWrapper>);

		expect(screen.queryByRole("tablist")).toBeNull();
		expect(screen.queryByRole("tab", { name: "Switch to Contrast issues" })).toBeNull();

		useIssuesStore.setState({ targetLevel: "AAA" });
		rerender(<IssuesWrapper>child</IssuesWrapper>);

		expect(screen.getByRole("tab", { name: "Switch to Contrast issues" })).toBeVisible();
	});

	it("shows the detection-info popover for types that have tooltip copy, not for TYPOGRAPHY", () => {
		useIssuesStore.setState({ selectedType: "CONTRAST" });
		const { rerender } = render(<IssuesWrapper>child</IssuesWrapper>);
		expect(screen.getByLabelText("About Contrast Detection")).toBeVisible();

		useIssuesStore.setState({ selectedType: "TYPOGRAPHY" });
		rerender(<IssuesWrapper>child</IssuesWrapper>);
		expect(screen.queryByLabelText(/About .* Detection/)).toBeNull();
	});

	it("renders the issue description, children, and recommendations once an issue is present", () => {
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [typographyIssue],
		});
		render(<IssuesWrapper>Row content</IssuesWrapper>);

		expect(screen.getByText("Text size is too small for readability.")).toBeVisible();
		expect(screen.getByText("Row content")).toBeVisible();
		expect(screen.getByText("Recommendations")).toBeVisible();
	});

	it("describes a genuine AA contrast failure as below WCAG AA standard", () => {
		useIssuesStore.setState({
			selectedType: "CONTRAST",
			detectedIssues: [contrastFailIssue],
			targetLevel: "AA",
		});
		render(<IssuesWrapper>child</IssuesWrapper>);

		expect(screen.getByText("Text contrast is below WCAG AA standard.")).toBeVisible();
	});

	it("describes an AA-passing/AAA-failing issue without falsely claiming it fails AA", () => {
		useIssuesStore.setState({
			selectedType: "CONTRAST",
			detectedIssues: [contrastAaOnlyIssue],
			targetLevel: "AAA",
		});
		render(<IssuesWrapper>child</IssuesWrapper>);

		expect(
			screen.getByText(
				"Text contrast meets WCAG AA but is below the stricter WCAG AAA standard.",
			),
		).toBeVisible();
		expect(screen.queryByText("Text contrast is below WCAG AA standard.")).toBeNull();
	});

	it("cites the stricter AAA contrast ratios in the recommendation when the target level is AAA", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			selectedType: "CONTRAST",
			detectedIssues: [contrastAaOnlyIssue],
			targetLevel: "AAA",
		});
		render(<IssuesWrapper>child</IssuesWrapper>);

		await user.click(screen.getByRole("button", { name: "Toggle Recommendations" }));

		expect(screen.getByText(/7:1 for normal text and 4.5:1 for large text/)).toBeVisible();
	});

	it("shows the description for a quick-check singleIssue even though issueGroupList is empty", () => {
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [],
			singleIssue: typographyIssue,
		});
		render(<IssuesWrapper>child</IssuesWrapper>);

		expect(screen.getByText("Text size is too small for readability.")).toBeVisible();
	});

	describe("multi-match quick-check list", () => {
		it("shows a list when the selection produces more than one matching issue", async () => {
			useIssuesStore.setState({ selectedType: "TOUCH_TARGET_SIZE" });
			render(<IssuesWrapper>Row content</IssuesWrapper>);

			dispatch(MESSAGE_TYPES.DETECTED_ISSUE, [
				touchTargetIssue,
				touchTargetIssue2,
				touchTargetIssue3,
			]);

			expect(await screen.findByRole("button", { name: "Btn" })).toBeVisible();
			expect(screen.getByRole("button", { name: "Btn 2" })).toBeVisible();
			expect(screen.getByRole("button", { name: "Btn 3" })).toBeVisible();
			expect(screen.queryByText("Row content")).toBeNull();
			expect(useIssuesStore.getState().singleIssue).toBeNull();
			expect(useIssuesStore.getState().selectionIssues).toHaveLength(3);
		});

		it("still shows the single-issue detail view when exactly one issue matches (regression guard)", async () => {
			useIssuesStore.setState({ selectedType: "TOUCH_TARGET_SIZE" });
			render(<IssuesWrapper>Row content</IssuesWrapper>);

			dispatch(MESSAGE_TYPES.DETECTED_ISSUE, [touchTargetIssue]);

			await waitFor(() =>
				expect(useIssuesStore.getState().singleIssue?.nodeData.id).toBe("tt1"),
			);
			expect(screen.getByText("Row content")).toBeVisible();
			expect(screen.queryByRole("button", { name: "Back to list" })).toBeNull();
			expect(useIssuesStore.getState().selectionIssues).toEqual([]);
		});

		it("clicking a row posts NAVIGATE with that issue's node id and shows its detail view", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({ selectedType: "TOUCH_TARGET_SIZE" });
			render(<IssuesWrapper>Row content</IssuesWrapper>);

			dispatch(MESSAGE_TYPES.DETECTED_ISSUE, [touchTargetIssue, touchTargetIssue2]);
			await screen.findByRole("button", { name: "Btn 2" });
			postMessageToBackend.mockClear();

			await user.click(screen.getByRole("button", { name: "Btn 2" }));

			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NAVIGATE, {
				id: "tt2",
			});
			expect(useIssuesStore.getState().singleIssue?.nodeData.id).toBe("tt2");
			expect(screen.getByText("Row content")).toBeVisible();
			expect(screen.getByRole("button", { name: "Back to list" })).toBeVisible();
		});

		it("returns to the list and re-selects every element in it when Back to list is clicked, without a single-element NAVIGATE call", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({ selectedType: "TOUCH_TARGET_SIZE" });
			render(<IssuesWrapper>Row content</IssuesWrapper>);

			dispatch(MESSAGE_TYPES.DETECTED_ISSUE, [touchTargetIssue, touchTargetIssue2]);
			await user.click(await screen.findByRole("button", { name: "Btn 2" }));
			postMessageToBackend.mockClear();

			await user.click(screen.getByRole("button", { name: "Back to list" }));

			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SELECT_MULTIPLE, {
				ids: ["tt1", "tt2"],
			});
			expect(postMessageToBackend).not.toHaveBeenCalledWith(
				MESSAGE_TYPES.NAVIGATE,
				expect.anything(),
			);
			expect(useIssuesStore.getState().singleIssue).toBeNull();
			expect(useIssuesStore.getState().selectionIssues).toHaveLength(2);
			expect(screen.getByRole("button", { name: "Btn" })).toBeVisible();
			expect(screen.getByRole("button", { name: "Btn 2" })).toBeVisible();
		});

		it("clears the selection list on NO_SELECTION", async () => {
			useIssuesStore.setState({ selectedType: "TOUCH_TARGET_SIZE" });
			render(<IssuesWrapper>Row content</IssuesWrapper>);

			dispatch(MESSAGE_TYPES.DETECTED_ISSUE, [touchTargetIssue, touchTargetIssue2]);
			await screen.findByRole("button", { name: "Btn" });

			dispatch(MESSAGE_TYPES.NO_SELECTION, true);

			await waitFor(() => expect(useIssuesStore.getState().selectionIssues).toEqual([]));
		});
	});
});
