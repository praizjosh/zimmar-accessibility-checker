import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import IssueDetailRow from "./index";

describe("IssueDetailRow", () => {
	it("renders the icon, label, and value", () => {
		render(
			<IssueDetailRow icon={<span data-testid="icon" />} label="Font size:" value="12px" />,
		);

		expect(screen.getByTestId("icon")).toBeVisible();
		expect(screen.getByText("Font size:")).toBeVisible();
		expect(screen.getByText("12px")).toBeVisible();
	});

	it("shows an info popover when tooltip is a non-empty string", async () => {
		const user = userEvent.setup();
		render(
			<IssueDetailRow
				label="Current size:"
				tooltip="Touch targets should be at least 44x44 pixels."
			/>,
		);

		const trigger = screen.getByLabelText("More info");
		expect(trigger).toBeVisible();

		await user.click(trigger);

		expect(screen.getByText("Touch targets should be at least 44x44 pixels.")).toBeVisible();
	});

	it("renders no popover when tooltip is false", () => {
		render(<IssueDetailRow label="Current size:" tooltip={false} />);

		expect(screen.queryByLabelText("More info")).not.toBeInTheDocument();
	});

	it("renders no popover when tooltip is omitted", () => {
		render(<IssueDetailRow label="Current size:" />);

		expect(screen.queryByLabelText("More info")).not.toBeInTheDocument();
	});
});
