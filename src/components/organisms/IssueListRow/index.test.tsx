import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IssueListRow from "./index";

describe("IssueListRow", () => {
	it("renders the title, aria-label, description, leading, and trailing content", () => {
		render(
			<ul>
				<IssueListRow
					title="View all Contrast issues"
					ariaLabel="Contrast"
					description="Text contrast is below WCAG AA standard."
					leading={<span>Contrast</span>}
					trailing={<span>critical</span>}
					onClick={vi.fn()}
				/>
			</ul>,
		);

		expect(screen.getByRole("button", { name: "Contrast" })).toBeVisible();
		expect(screen.getByText("Text contrast is below WCAG AA standard.")).toBeVisible();
		expect(screen.getByText("critical")).toBeVisible();
		expect(screen.getByTitle("View all Contrast issues")).toBeInTheDocument();
	});

	it("calls onClick when the row is clicked", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();

		render(
			<ul>
				<IssueListRow
					title="Row"
					ariaLabel="Row"
					description="Description"
					leading={<span>Leading</span>}
					trailing={<span>Trailing</span>}
					onClick={onClick}
				/>
			</ul>,
		);

		await user.click(screen.getByRole("button", { name: "Row" }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
