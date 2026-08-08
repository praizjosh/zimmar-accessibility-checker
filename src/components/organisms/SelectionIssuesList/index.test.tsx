import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DetectedIssue } from "@/lib/types";
import SelectionIssuesList from "./index";

function fakeIssue(id: string, name: string, severity: DetectedIssue["severity"]): DetectedIssue {
	return {
		type: "TOUCH_TARGET_SIZE",
		severity,
		description: `Touch target size is too small for ${name}.`,
		nodeData: { id, name, nodeType: "FRAME" },
	};
}

describe("SelectionIssuesList", () => {
	it("renders one row per issue, showing the element name and severity", () => {
		const issues = [
			fakeIssue("1", "Icon Button", "critical"),
			fakeIssue("2", "Icon Button 2", "minor"),
		];

		render(<SelectionIssuesList issues={issues} targetLevel="AA" onSelectIssue={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Icon Button" })).toBeVisible();
		expect(screen.getByRole("button", { name: "Icon Button 2" })).toBeVisible();
		expect(screen.getByText("critical")).toBeVisible();
		expect(screen.getByText("minor")).toBeVisible();
	});

	it("shows a count of how many issues were found", () => {
		const issues = [
			fakeIssue("1", "Icon Button", "critical"),
			fakeIssue("2", "Icon Button 2", "minor"),
			fakeIssue("3", "Icon Button 3", "major"),
		];

		render(<SelectionIssuesList issues={issues} targetLevel="AA" onSelectIssue={vi.fn()} />);

		expect(screen.getByText("3 issues found in this selection.")).toBeVisible();
	});

	it("calls onSelectIssue with the exact issue object when a row is clicked", async () => {
		const user = userEvent.setup();
		const onSelectIssue = vi.fn();
		const issues = [
			fakeIssue("1", "Icon Button", "critical"),
			fakeIssue("2", "Icon Button 2", "minor"),
		];

		render(
			<SelectionIssuesList issues={issues} targetLevel="AA" onSelectIssue={onSelectIssue} />,
		);

		await user.click(screen.getByRole("button", { name: "Icon Button 2" }));

		expect(onSelectIssue).toHaveBeenCalledTimes(1);
		expect(onSelectIssue).toHaveBeenCalledWith(issues[1]);
	});

	it("derives the Contrast description from the live targetLevel instead of the static (unset) description field", () => {
		const contrastIssue: DetectedIssue = {
			type: "CONTRAST",
			severity: "critical",
			nodeData: {
				id: "c1",
				name: "ROVER",
				nodeType: "TEXT",
				contrastScore: { compliance: "AA", ratio: 4.54 },
			},
		};

		const { rerender } = render(
			<SelectionIssuesList
				issues={[contrastIssue]}
				targetLevel="AA"
				onSelectIssue={vi.fn()}
			/>,
		);

		expect(screen.getByText("Text contrast meets the selected WCAG standard.")).toBeVisible();

		rerender(
			<SelectionIssuesList
				issues={[contrastIssue]}
				targetLevel="AAA"
				onSelectIssue={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(
				"Text contrast meets WCAG AA but is below the stricter WCAG AAA standard.",
			),
		).toBeVisible();
	});
});
