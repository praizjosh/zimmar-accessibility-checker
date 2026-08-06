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
});
