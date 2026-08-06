import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import IssueBreakdownChart from "./index";

describe("IssueBreakdownChart", () => {
	it("renders each item's label and count, hidden from assistive tech as decorative rows", () => {
		render(
			<IssueBreakdownChart
				items={[
					{ type: "CONTRAST", count: 3 },
					{ type: "TYPOGRAPHY", count: 1 },
				]}
			/>,
		);

		expect(screen.getByText("Contrast")).toBeVisible();
		expect(screen.getByText("3")).toBeVisible();
		expect(screen.getByText("Typography")).toBeVisible();
		expect(screen.getByText("1")).toBeVisible();
		expect(screen.getByText("Contrast").closest('[aria-hidden="true"]')).not.toBeNull();
	});

	it("summarises all items in a single aria-label on the chart root", () => {
		render(
			<IssueBreakdownChart
				items={[
					{ type: "CONTRAST", count: 3 },
					{ type: "TYPOGRAPHY", count: 1 },
				]}
			/>,
		);

		expect(
			screen.getByRole("img", {
				name: "Issues by category — Contrast: 3, Typography: 1",
			}),
		).toBeVisible();
	});

	it("scales each bar relative to the largest count", () => {
		render(
			<IssueBreakdownChart
				items={[
					{ type: "CONTRAST", count: 2 },
					{ type: "TYPOGRAPHY", count: 4 },
				]}
			/>,
		);

		const bars = screen.getAllByRole("progressbar", { hidden: true });
		// Contrast: 2/4 = 50% -> translateX(-50%); Typography: 4/4 = 100% -> translateX(0%)
		expect(bars[0].firstElementChild).toHaveStyle({
			transform: "translateX(-50%)",
		});
		expect(bars[1].firstElementChild).toHaveStyle({
			transform: "translateX(-0%)",
		});
	});
});
