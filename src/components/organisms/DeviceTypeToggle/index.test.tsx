import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeviceTypeToggle from "./index";

describe("DeviceTypeToggle", () => {
	it("renders the label alongside the touch/pointer radio group", () => {
		render(
			<DeviceTypeToggle
				value="touch"
				onChange={vi.fn()}
				label={<span>Designing for</span>}
			/>,
		);

		expect(screen.getByText("Designing for")).toBeVisible();
		expect(screen.getByRole("radiogroup", { name: "Designing for" })).toBeVisible();
	});

	it("marks the current value's radio as checked and the other as unchecked", () => {
		render(<DeviceTypeToggle value="pointer" onChange={vi.fn()} />);

		expect(screen.getByRole("radio", { name: "Touch" })).toHaveAttribute(
			"aria-checked",
			"false",
		);
		expect(screen.getByRole("radio", { name: "Pointer" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("calls onChange with the clicked device type", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<DeviceTypeToggle value="touch" onChange={onChange} />);

		await user.click(screen.getByRole("radio", { name: "Pointer" }));

		expect(onChange).toHaveBeenCalledWith("pointer");
	});

	it("renders without a label when none is passed", () => {
		render(<DeviceTypeToggle value="touch" onChange={vi.fn()} />);

		expect(screen.getByRole("radiogroup", { name: "Device type" })).toBeVisible();
	});

	it("wires arrow-key navigation through to the shared RadioToggle", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<DeviceTypeToggle value="touch" onChange={onChange} />);

		screen.getByRole("radio", { name: "Touch" }).focus();
		await user.keyboard("[ArrowRight]");

		expect(onChange).toHaveBeenCalledWith("pointer");
		expect(screen.getByRole("radio", { name: "Pointer" })).toHaveFocus();
	});
});
