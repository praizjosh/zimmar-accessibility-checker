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

vi.mock("@/components/organisms/IssuesWrapper", () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import IssuesNavigator from "./index";

const typographyIssue: DetectedIssue = {
	type: "TYPOGRAPHY",
	description: "Text size is too small for readability.",
	severity: "major",
	nodeData: {
		id: "t1",
		name: "Label",
		nodeType: "TEXT",
		characters: "Hello world",
		fontSize: 10,
	},
};

const contrastIssue: DetectedIssue = {
	type: "CONTRAST",
	description: "Text contrast is below WCAG AA standard.",
	severity: "critical",
	nodeData: {
		id: "c1",
		name: "Text",
		nodeType: "TEXT",
		characters: "Body copy",
		fontSize: 16,
		foregroundColor: [0, 0, 0],
		backgroundColor: [17, 17, 17],
		contrastScore: { compliance: "Fail", ratio: 1.2 },
	},
};

const defaultState = {
	detectedIssues: [] as DetectedIssue[],
	singleIssue: null,
	currentIssueIndex: 0,
	selectedType: "" as const,
	targetLevel: "AA" as const,
};

// #767676 on white is the commonly-cited "AA minimum grey" reference pair -
// 4.54:1, clears AA's 4.5 but not AAA's 7 for normal-size text.
const aaPassingAaaFailingContrastIssue: DetectedIssue = {
	...contrastIssue,
	nodeData: {
		...contrastIssue.nodeData,
		id: "c2",
		foregroundColor: [118, 118, 118],
		backgroundColor: [255, 255, 255],
		contrastScore: { compliance: "AA", ratio: 4.54 },
	},
};

describe("IssuesNavigator", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState(defaultState);
	});

	it("shows an empty-state message when there is no issue to display", () => {
		useIssuesStore.setState({ selectedType: "TYPOGRAPHY" });
		render(<IssuesNavigator />);

		expect(screen.getByText("No TYPOGRAPHY issue detected.")).toBeVisible();
	});

	it("renders the text, font size, and severity rows for a typography issue", () => {
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [typographyIssue],
		});
		render(<IssuesNavigator />);

		expect(screen.getByText("Hello world")).toBeVisible();
		expect(screen.getByRole("spinbutton")).toHaveValue(10);
		expect(screen.getByText("major")).toBeVisible();
	});

	it("updates the font size on the matching issue and notifies the backend", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [typographyIssue],
		});
		render(<IssuesNavigator />);

		const input = screen.getByRole("spinbutton");
		await user.clear(input);
		await user.type(input, "18");

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.UPDATE_FONT_SIZE, {
			id: "t1",
			fontSize: 18,
		});
		expect(useIssuesStore.getState().detectedIssues[0].nodeData.fontSize).toBe(18);
	});

	it("updates singleIssue instead of the issues list when there is no active issue group (quick check mode)", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [],
			singleIssue: typographyIssue,
		});
		render(<IssuesNavigator />);

		const input = screen.getByRole("spinbutton");
		await user.clear(input);
		await user.type(input, "20");

		expect(useIssuesStore.getState().singleIssue?.nodeData.fontSize).toBe(20);
	});

	it("shows the contrast-specific rows only for a CONTRAST issue", () => {
		useIssuesStore.setState({
			selectedType: "CONTRAST",
			detectedIssues: [contrastIssue],
		});
		render(<IssuesNavigator />);

		expect(screen.getByText("Text colour:")).toBeVisible();
		expect(screen.getByText("Background colour:")).toBeVisible();
		expect(screen.getByText("WCAG score:")).toBeVisible();
		expect(screen.getByText("Fail")).toBeVisible();
		expect(screen.getByText("Contrast ratio:")).toBeVisible();
		expect(screen.getByText("1.20 : 1")).toBeVisible();
	});

	it("does not show the contrast-specific rows for a non-CONTRAST issue", () => {
		useIssuesStore.setState({
			selectedType: "TYPOGRAPHY",
			detectedIssues: [typographyIssue],
		});
		render(<IssuesNavigator />);

		expect(screen.queryByText("WCAG score:")).toBeNull();
		expect(screen.queryByText("Contrast ratio:")).toBeNull();
	});

	describe("Suggested fixes card", () => {
		function getDisplayedRatio(label: string): number {
			const text = screen.getByText(new RegExp(`^${label}$`)).parentElement;
			const match = text?.textContent?.match(/([\d.]+):1/);
			if (!match) throw new Error(`No ratio found next to "${label}"`);
			return parseFloat(match[1]);
		}

		it("does not render for a non-CONTRAST issue", () => {
			useIssuesStore.setState({
				selectedType: "TYPOGRAPHY",
				detectedIssues: [typographyIssue],
			});
			render(<IssuesNavigator />);

			expect(screen.queryByText("Suggested fixes")).toBeNull();
		});

		it("does not render when the contrast check isn't failing", () => {
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							contrastScore: { compliance: "AA", ratio: 5 },
						},
					},
				],
			});
			render(<IssuesNavigator />);

			expect(screen.queryByText("Suggested fixes")).toBeNull();
		});

		it("renders for an AA-passing/AAA-failing issue once the detection target level is AAA", () => {
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [aaPassingAaaFailingContrastIssue],
				targetLevel: "AAA",
			});
			render(<IssuesNavigator />);

			expect(screen.getByText("Suggested fixes")).toBeVisible();
			expect(screen.getAllByRole("button", { name: /^Apply$/ }).length).toBeGreaterThan(0);
		});

		it("still does not render an AA-passing/AAA-failing issue while the detection target level is AA", () => {
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [aaPassingAaaFailingContrastIssue],
				targetLevel: "AA",
			});
			render(<IssuesNavigator />);

			expect(screen.queryByText("Suggested fixes")).toBeNull();
		});

		it("suggests darkening text that's the lighter of the two colours", () => {
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [128, 128, 128],
							backgroundColor: [255, 255, 255],
						},
					},
				],
			});
			render(<IssuesNavigator />);

			expect(screen.getByText("Suggested fixes")).toBeVisible();
			expect(screen.getByText("Darken text")).toBeVisible();
			expect(getDisplayedRatio("Darken text")).toBeGreaterThanOrEqual(4.5);
		});

		it("suggests lightening text that's already the darker of the two colours", () => {
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [60, 60, 60],
							backgroundColor: [20, 20, 20],
						},
					},
				],
			});
			render(<IssuesNavigator />);

			expect(screen.getByText("Lighten text")).toBeVisible();
		});

		it("recomputes a stricter ratio when the AAA target is selected", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [130, 130, 130],
							backgroundColor: [255, 255, 255],
						},
					},
				],
			});
			render(<IssuesNavigator />);

			expect(getDisplayedRatio("Darken text")).toBeGreaterThanOrEqual(4.5);

			await user.click(screen.getByRole("radio", { name: "AAA" }));

			expect(getDisplayedRatio("Darken text")).toBeGreaterThanOrEqual(7);
		});

		it("discloses when the suggested background is shared with other layers", () => {
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							backgroundSharedWithCount: 2,
						},
					},
				],
			});
			render(<IssuesNavigator />);

			expect(screen.getByText("Shared with 2 other layers")).toBeVisible();
		});

		it("omits the disclosure when the background isn't shared with anything else", () => {
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [contrastIssue],
			});
			render(<IssuesNavigator />);

			expect(screen.queryByText(/Shared with/)).toBeNull();
		});

		it("shows a fallback message when no suggestion is reachable at the selected level", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [255, 0, 255],
							backgroundColor: [128, 128, 128],
						},
					},
				],
			});
			render(<IssuesNavigator />);

			await user.click(screen.getByRole("radio", { name: "AAA" }));

			expect(
				screen.getByText("No AAA-compliant suggestion found for this pair."),
			).toBeVisible();
		});

		it("applies the foreground suggestion, updates local state, and does not toast", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [128, 128, 128],
							backgroundColor: [255, 255, 255],
							backgroundNodeId: "bg-1",
							backgroundNodeName: "Card",
						},
					},
				],
			});
			render(<IssuesNavigator />);

			const [applyForeground] = screen.getAllByRole("button", {
				name: "Apply",
			});
			await user.click(applyForeground);

			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.UPDATE_FILL_COLOR, {
				nodeId: "c1",
				color: expect.any(Array),
			});
			expect(postMessageToBackend).not.toHaveBeenCalledWith(
				MESSAGE_TYPES.NOTIFY,
				expect.anything(),
			);

			const updatedIssue = useIssuesStore
				.getState()
				.detectedIssues.find((issue) => issue.nodeData.id === "c1");
			expect(updatedIssue?.nodeData.contrastScore?.compliance).not.toBe("Fail");
			expect(screen.queryByText("Suggested fixes")).toBeNull();
		});

		it("applies the background suggestion using the contributing node's id and toasts", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [128, 128, 128],
							backgroundColor: [255, 255, 255],
							backgroundNodeId: "bg-1",
							backgroundNodeName: "Card",
						},
					},
				],
			});
			render(<IssuesNavigator />);

			const [, applyBackground] = screen.getAllByRole("button", {
				name: "Apply",
			});
			await user.click(applyBackground);

			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.UPDATE_FILL_COLOR, {
				nodeId: "bg-1",
				color: expect.any(Array),
			});
			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NOTIFY, {
				message: 'Updated background fill on "Card"',
			});
		});

		it("navigates to the text node when the foreground swatch is tapped", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [128, 128, 128],
							backgroundColor: [255, 255, 255],
							backgroundNodeId: "bg-1",
							backgroundNodeName: "Card",
						},
					},
				],
			});
			render(<IssuesNavigator />);

			await user.click(
				screen.getByRole("button", { name: "Select the text layer in Figma" }),
			);

			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NAVIGATE, { id: "c1" });
		});

		it("navigates to the contributing node when the background swatch is tapped", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [128, 128, 128],
							backgroundColor: [255, 255, 255],
							backgroundNodeId: "bg-1",
							backgroundNodeName: "Card",
						},
					},
				],
			});
			render(<IssuesNavigator />);

			await user.click(
				screen.getByRole("button", {
					name: "Select the background layer in Figma",
				}),
			);

			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NAVIGATE, {
				id: "bg-1",
			});
		});

		it("does not navigate for the background swatch when no contributing node was detected", async () => {
			const user = userEvent.setup();
			useIssuesStore.setState({
				selectedType: "CONTRAST",
				detectedIssues: [
					{
						...contrastIssue,
						nodeData: {
							...contrastIssue.nodeData,
							foregroundColor: [128, 128, 128],
							backgroundColor: [255, 255, 255],
						},
					},
				],
			});
			render(<IssuesNavigator />);

			await user.click(
				screen.getByRole("button", {
					name: "Select the background layer in Figma",
				}),
			);

			expect(postMessageToBackend).not.toHaveBeenCalledWith(
				MESSAGE_TYPES.NAVIGATE,
				expect.anything(),
			);
		});
	});
});
