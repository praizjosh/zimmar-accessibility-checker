import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ScanModeSplitButton from "./index";

describe("ScanModeSplitButton", () => {
	it("calls onScanPage when 'Scan entire page' is clicked", async () => {
		const user = userEvent.setup();
		const onScanPage = vi.fn();
		render(
			<ScanModeSplitButton
				scanning={false}
				onScanPage={onScanPage}
				onScanFile={vi.fn()}
				hasSeenFileScanOption={false}
				onOpenMenu={vi.fn()}
				showFileScanOption={true}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Scan entire page" }));

		expect(onScanPage).toHaveBeenCalledTimes(1);
	});

	it("disables 'Scan entire page' while scanning", () => {
		render(
			<ScanModeSplitButton
				scanning={true}
				onScanPage={vi.fn()}
				onScanFile={vi.fn()}
				hasSeenFileScanOption={false}
				onOpenMenu={vi.fn()}
				showFileScanOption={true}
			/>,
		);

		expect(screen.getByRole("button", { name: "Scan entire page" })).toBeDisabled();
	});

	it("disables the caret trigger while scanning", () => {
		render(
			<ScanModeSplitButton
				scanning={true}
				onScanPage={vi.fn()}
				onScanFile={vi.fn()}
				hasSeenFileScanOption={false}
				onOpenMenu={vi.fn()}
				showFileScanOption={true}
			/>,
		);

		expect(screen.getByRole("button", { name: "More scan options" })).toBeDisabled();
	});

	it("shows the 'new' badge when hasSeenFileScanOption is false", () => {
		render(
			<ScanModeSplitButton
				scanning={false}
				onScanPage={vi.fn()}
				onScanFile={vi.fn()}
				hasSeenFileScanOption={false}
				onOpenMenu={vi.fn()}
				showFileScanOption={true}
			/>,
		);

		expect(screen.getByTestId("file-scan-option-new-badge")).toBeVisible();
	});

	it("hides the 'new' badge when hasSeenFileScanOption is true", () => {
		render(
			<ScanModeSplitButton
				scanning={false}
				onScanPage={vi.fn()}
				onScanFile={vi.fn()}
				hasSeenFileScanOption={true}
				onOpenMenu={vi.fn()}
				showFileScanOption={true}
			/>,
		);

		expect(screen.queryByTestId("file-scan-option-new-badge")).toBeNull();
	});

	it("calls onOpenMenu when the caret menu is opened", async () => {
		const user = userEvent.setup();
		const onOpenMenu = vi.fn();
		render(
			<ScanModeSplitButton
				scanning={false}
				onScanPage={vi.fn()}
				onScanFile={vi.fn()}
				hasSeenFileScanOption={false}
				onOpenMenu={onOpenMenu}
				showFileScanOption={true}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "More scan options" }));

		expect(onOpenMenu).toHaveBeenCalledTimes(1);
	});

	it("fires onOpenMenu on every open, even when already seen - idempotency is the store's job, not this component's", async () => {
		const user = userEvent.setup();
		const onOpenMenu = vi.fn();
		render(
			<ScanModeSplitButton
				scanning={false}
				onScanPage={vi.fn()}
				onScanFile={vi.fn()}
				hasSeenFileScanOption={true}
				onOpenMenu={onOpenMenu}
				showFileScanOption={true}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "More scan options" }));

		expect(onOpenMenu).toHaveBeenCalledTimes(1);
	});

	it("runs onScanFile and closes the menu when the menu item is clicked", async () => {
		const user = userEvent.setup();
		const onScanFile = vi.fn();
		render(
			<ScanModeSplitButton
				scanning={false}
				onScanPage={vi.fn()}
				onScanFile={onScanFile}
				hasSeenFileScanOption={false}
				onOpenMenu={vi.fn()}
				showFileScanOption={true}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "More scan options" }));
		await user.click(screen.getByRole("button", { name: "Scan entire file (all pages)" }));

		expect(onScanFile).toHaveBeenCalledTimes(1);
		expect(
			screen.queryByRole("button", { name: "Scan entire file (all pages)" }),
		).not.toBeInTheDocument();
	});

	describe("when showFileScanOption is false (single-page file)", () => {
		it("renders 'Scan entire page' only, with no caret trigger", () => {
			render(
				<ScanModeSplitButton
					scanning={false}
					onScanPage={vi.fn()}
					onScanFile={vi.fn()}
					hasSeenFileScanOption={false}
					onOpenMenu={vi.fn()}
					showFileScanOption={false}
				/>,
			);

			expect(screen.getByRole("button", { name: "Scan entire page" })).toBeVisible();
			expect(screen.queryByRole("button", { name: "More scan options" })).toBeNull();
		});

		it("never renders the file-scan menu item, even though it's never openable", () => {
			render(
				<ScanModeSplitButton
					scanning={false}
					onScanPage={vi.fn()}
					onScanFile={vi.fn()}
					hasSeenFileScanOption={false}
					onOpenMenu={vi.fn()}
					showFileScanOption={false}
				/>,
			);

			expect(
				screen.queryByRole("button", { name: "Scan entire file (all pages)" }),
			).toBeNull();
		});

		it("never shows the 'new' badge - there's nothing to discover", () => {
			render(
				<ScanModeSplitButton
					scanning={false}
					onScanPage={vi.fn()}
					onScanFile={vi.fn()}
					hasSeenFileScanOption={false}
					onOpenMenu={vi.fn()}
					showFileScanOption={false}
				/>,
			);

			expect(screen.queryByTestId("file-scan-option-new-badge")).toBeNull();
		});
	});
});
