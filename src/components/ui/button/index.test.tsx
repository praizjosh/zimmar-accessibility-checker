import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./index";

describe("Button", () => {
	it("renders a native button by default with the given title and children", () => {
		render(<Button title="Do the thing">Click me</Button>);

		const button = screen.getByRole("button", { name: "Click me" });
		expect(button).toBeVisible();
		expect(button).toHaveAttribute("title", "Do the thing");
	});

	it("applies the destructive variant's background class instead of the default", () => {
		render(
			<Button title="Delete" variant="destructive">
				Delete
			</Button>,
		);

		expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("bg-red-500");
	});

	it("is disabled when the disabled prop is set", () => {
		render(
			<Button title="Disabled" disabled>
				Disabled
			</Button>,
		);

		expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
	});

	it("renders as the child element instead of a button when asChild is set", () => {
		render(
			<Button title="Link button" asChild>
				<a href="/somewhere">Go</a>
			</Button>,
		);

		const link = screen.getByRole("link", { name: "Go" });
		expect(link).toBeVisible();
		expect(link).toHaveAttribute("href", "/somewhere");
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
