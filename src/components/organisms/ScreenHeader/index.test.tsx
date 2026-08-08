import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ScreenHeader from "./index";

describe("ScreenHeader", () => {
	it("renders the back button and the provided children", () => {
		render(
			<ScreenHeader onBack={vi.fn()}>
				<span>Scan Results</span>
			</ScreenHeader>,
		);

		expect(screen.getByRole("button", { name: /back/i })).toBeVisible();
		expect(screen.getByText("Scan Results")).toBeVisible();
	});

	it("calls onBack when the back button is clicked", async () => {
		const user = userEvent.setup();
		const onBack = vi.fn();

		render(
			<ScreenHeader onBack={onBack}>
				<span>Scan Results</span>
			</ScreenHeader>,
		);

		await user.click(screen.getByRole("button", { name: /back/i }));

		expect(onBack).toHaveBeenCalledTimes(1);
	});
});
