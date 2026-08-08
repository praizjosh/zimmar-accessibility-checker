import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoadingScreen from "./index";

describe("LoadingScreen", () => {
	it("renders the given message", () => {
		render(<LoadingScreen message="Scanning for issues..." />);

		expect(screen.getByText("Scanning for issues...")).toBeVisible();
	});

	it("renders no message text when none is given", () => {
		const { container } = render(<LoadingScreen />);

		expect(container.querySelector("p")).toBeNull();
	});

	it("renders children below the message", () => {
		render(
			<LoadingScreen message="Scanning page 2 of 5">
				<button type="button">Cancel</button>
			</LoadingScreen>,
		);

		expect(screen.getByText("Scanning page 2 of 5")).toBeVisible();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
	});
});
