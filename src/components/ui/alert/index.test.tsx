import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./index";

describe("Alert", () => {
	it("renders with an alert role and the default variant's classes", () => {
		render(<Alert>Something happened</Alert>);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Something happened");
		expect(alert).toHaveClass("bg-card");
	});

	it("applies the destructive variant's classes instead of the default", () => {
		render(<Alert variant="destructive">Error</Alert>);

		expect(screen.getByRole("alert")).toHaveClass("text-destructive");
	});
});

describe("AlertTitle", () => {
	it("renders the given children", () => {
		render(<AlertTitle>Heads up</AlertTitle>);

		expect(screen.getByText("Heads up")).toBeVisible();
	});

	it("falls back to 'Alert Title' when no children are passed", () => {
		render(<AlertTitle />);

		expect(screen.getByText("Alert Title")).toBeVisible();
	});
});

describe("AlertDescription", () => {
	it("renders the given children", () => {
		render(<AlertDescription>Details here</AlertDescription>);

		expect(screen.getByText("Details here")).toBeVisible();
	});
});
