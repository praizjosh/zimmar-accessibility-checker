import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColorFixSuggestion } from "@/lib/colorFix";
import ContrastFixSuggester from "./index";

const darkerSuggestion: ColorFixSuggestion = {
	color: [10, 10, 10],
	ratio: 5.2,
	adjustment: "darker",
};

const lighterSuggestion: ColorFixSuggestion = {
	color: [240, 240, 240],
	ratio: 6.1,
	adjustment: "lighter",
};

describe("ContrastFixSuggester", () => {
	it("shows a no-suggestion message for the current target level when neither suggestion exists", () => {
		render(
			<ContrastFixSuggester
				targetLevel="AAA"
				onTargetLevelChange={vi.fn()}
				foregroundSuggestion={null}
				backgroundSuggestion={null}
				onSelectSwatchNode={vi.fn()}
				onApplySuggestion={vi.fn()}
			/>,
		);

		expect(screen.getByText("No AAA-compliant suggestion found for this pair.")).toBeVisible();
	});

	it("labels a suggestion by its actual adjustment direction, not the swatch direction", () => {
		render(
			<ContrastFixSuggester
				targetLevel="AA"
				onTargetLevelChange={vi.fn()}
				foregroundSuggestion={darkerSuggestion}
				backgroundSuggestion={lighterSuggestion}
				onSelectSwatchNode={vi.fn()}
				onApplySuggestion={vi.fn()}
			/>,
		);

		expect(screen.getByText("Darken text")).toBeVisible();
		expect(screen.getByText("Lighten background")).toBeVisible();
		expect(screen.getByText("5.20:1")).toBeVisible();
		expect(screen.getByText("6.10:1")).toBeVisible();
	});

	it("calls onSelectSwatchNode with the swatch's direction when a swatch is clicked", async () => {
		const user = userEvent.setup();
		const onSelectSwatchNode = vi.fn();

		render(
			<ContrastFixSuggester
				targetLevel="AA"
				onTargetLevelChange={vi.fn()}
				foregroundSuggestion={darkerSuggestion}
				backgroundSuggestion={null}
				onSelectSwatchNode={onSelectSwatchNode}
				onApplySuggestion={vi.fn()}
			/>,
		);

		await user.click(screen.getByTitle("Select the text layer in Figma"));

		expect(onSelectSwatchNode).toHaveBeenCalledWith("foreground");
	});

	it("calls onApplySuggestion with the direction and suggestion when Apply is clicked", async () => {
		const user = userEvent.setup();
		const onApplySuggestion = vi.fn();

		render(
			<ContrastFixSuggester
				targetLevel="AA"
				onTargetLevelChange={vi.fn()}
				foregroundSuggestion={null}
				backgroundSuggestion={lighterSuggestion}
				onSelectSwatchNode={vi.fn()}
				onApplySuggestion={onApplySuggestion}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Apply" }));

		expect(onApplySuggestion).toHaveBeenCalledWith("background", lighterSuggestion);
	});

	it("pluralizes the shared-background note based on the shared count", () => {
		render(
			<ContrastFixSuggester
				targetLevel="AA"
				onTargetLevelChange={vi.fn()}
				foregroundSuggestion={null}
				backgroundSuggestion={lighterSuggestion}
				backgroundSharedWithCount={1}
				onSelectSwatchNode={vi.fn()}
				onApplySuggestion={vi.fn()}
			/>,
		);

		expect(screen.getByText("Shared with 1 other layer")).toBeVisible();
	});

	it("calls onTargetLevelChange when a target level radio is selected", async () => {
		const user = userEvent.setup();
		const onTargetLevelChange = vi.fn();

		render(
			<ContrastFixSuggester
				targetLevel="AA"
				onTargetLevelChange={onTargetLevelChange}
				foregroundSuggestion={null}
				backgroundSuggestion={null}
				onSelectSwatchNode={vi.fn()}
				onApplySuggestion={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("radio", { name: "AAA" }));

		expect(onTargetLevelChange).toHaveBeenCalledWith("AAA");
	});
});
