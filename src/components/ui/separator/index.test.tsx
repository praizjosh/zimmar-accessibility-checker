import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Separator from "./index";

describe("Separator", () => {
	it("defaults to a decorative horizontal separator", () => {
		const { container } = render(<Separator data-testid="sep" />);

		const separator = container.querySelector('[data-testid="sep"]');
		expect(separator).toHaveClass("h-px", "w-full");
		// Decorative separators are hidden from the accessibility tree (role="none"),
		// so there's nothing exposed via getByRole("separator") to assert here.
		expect(separator).toHaveAttribute("data-orientation", "horizontal");
	});

	it("applies vertical classes instead when orientation is vertical", () => {
		const { container } = render(<Separator orientation="vertical" data-testid="sep" />);

		expect(container.querySelector('[data-testid="sep"]')).toHaveClass("h-full", "w-px");
	});

	it("is exposed to assistive tech when decorative is false", () => {
		render(<Separator decorative={false} />);

		expect(screen.getByRole("separator")).toBeVisible();
	});
});
