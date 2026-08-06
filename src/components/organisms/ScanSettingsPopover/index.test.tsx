import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ScanSettingsPopover from "./index";

describe("ScanSettingsPopover", () => {
	it("hides the toggles until the settings trigger is clicked", () => {
		render(
			<ScanSettingsPopover
				targetLevel="AA"
				onTargetLevelChange={vi.fn()}
				deviceType="touch"
				onDeviceTypeChange={vi.fn()}
			/>,
		);

		expect(screen.queryByText("WCAG target")).toBeNull();
		expect(screen.queryByText("Designing for")).toBeNull();
	});

	it("shows both toggles reflecting the current values once opened", async () => {
		const user = userEvent.setup();
		render(
			<ScanSettingsPopover
				targetLevel="AAA"
				onTargetLevelChange={vi.fn()}
				deviceType="pointer"
				onDeviceTypeChange={vi.fn()}
			/>,
		);

		await user.click(screen.getByLabelText("Scan settings"));

		expect(screen.getByText("WCAG target")).toBeVisible();
		expect(screen.getByText("Designing for")).toBeVisible();
		expect(screen.getByRole("radio", { name: "AAA" })).toHaveAttribute("aria-checked", "true");
		expect(screen.getByRole("radio", { name: "Pointer" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("calls onTargetLevelChange and onDeviceTypeChange from within the popover", async () => {
		const user = userEvent.setup();
		const onTargetLevelChange = vi.fn();
		const onDeviceTypeChange = vi.fn();
		render(
			<ScanSettingsPopover
				targetLevel="AA"
				onTargetLevelChange={onTargetLevelChange}
				deviceType="touch"
				onDeviceTypeChange={onDeviceTypeChange}
			/>,
		);

		await user.click(screen.getByLabelText("Scan settings"));
		await user.click(screen.getByRole("radio", { name: "AAA" }));
		await user.click(screen.getByRole("radio", { name: "Pointer" }));

		expect(onTargetLevelChange).toHaveBeenCalledWith("AAA");
		expect(onDeviceTypeChange).toHaveBeenCalledWith("pointer");
	});
});
