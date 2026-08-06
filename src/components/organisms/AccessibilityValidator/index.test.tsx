import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_TYPES } from "@/lib/constants";
import useIssuesStore from "@/lib/useIssuesStore";

const { postMessageToBackend } = vi.hoisted(() => ({
	postMessageToBackend: vi.fn(),
}));

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend }));

vi.mock("@/components/organisms/ai-assistants/AltTextGenerator", () => ({
	default: ({ isExpanded }: { isExpanded: boolean }) => (
		<div data-testid="alt-text-generator" data-expanded={isExpanded} />
	),
}));

import AccessibilityValidator from "./index";

describe("AccessibilityValidator", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({
			scanning: false,
			currentRoute: "INDEX",
			selectedType: "",
			targetLevel: "AA",
			deviceType: "touch",
		});
	});

	it("starts a scan and navigates to the overview when 'Scan entire page' is clicked", async () => {
		const user = userEvent.setup();
		render(<AccessibilityValidator />);

		await user.click(screen.getByRole("button", { name: "Scan entire page" }));

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN, {
			deviceType: "touch",
			targetLevel: "AA",
		});
		expect(useIssuesStore.getState().currentRoute).toBe("ISSUE_OVERVIEW_LIST_VIEW");
	});

	it("sends the currently selected device type and target level with the scan", async () => {
		const user = userEvent.setup();
		useIssuesStore.setState({ deviceType: "pointer", targetLevel: "AAA" });
		render(<AccessibilityValidator />);

		await user.click(screen.getByRole("button", { name: "Scan entire page" }));

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN, {
			deviceType: "pointer",
			targetLevel: "AAA",
		});
	});

	it("disables the scan button while a scan is already in progress", () => {
		useIssuesStore.setState({ scanning: true });
		render(<AccessibilityValidator />);

		expect(screen.getByRole("button", { name: "Scan entire page" })).toBeDisabled();
	});

	it.each([
		["Contrast", "CONTRAST", "ISSUE_LIST_VIEW"],
		["Typography", "TYPOGRAPHY", "ISSUE_LIST_VIEW"],
		["Touch Target Size", "TOUCH_TARGET_SIZE", "TOUCH_TARGET_ISSUE_LIST_VIEW"],
		["Touch Target Spacing", "TOUCH_TARGET_SPACING", "TOUCH_TARGET_ISSUE_LIST_VIEW"],
	] as const)(
		"starts a quick check and routes to the right pager for %s",
		async (label, type, route) => {
			const user = userEvent.setup();
			render(<AccessibilityValidator />);

			await user.click(screen.getByRole("button", { name: label }));

			expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.START_QUICKCHECK, {
				deviceType: "touch",
				targetLevel: "AA",
			});
			expect(useIssuesStore.getState().selectedType).toBe(type);
			expect(useIssuesStore.getState().currentRoute).toBe(route);
		},
	);

	it("keeps the scan settings tucked behind a settings trigger, not shown inline", () => {
		render(<AccessibilityValidator />);

		expect(screen.getByLabelText("Scan settings")).toBeVisible();
		expect(screen.queryByText("WCAG target")).toBeNull();
		expect(screen.queryByText("Designing for")).toBeNull();
	});

	it("opens the scan settings popover showing the current AA/Touch defaults", async () => {
		const user = userEvent.setup();
		render(<AccessibilityValidator />);

		await user.click(screen.getByLabelText("Scan settings"));

		expect(screen.getByRole("radio", { name: "AA" })).toHaveAttribute("aria-checked", "true");
		expect(screen.getByRole("radio", { name: "Touch" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("updates targetLevel and deviceType when the popover's toggles are used", async () => {
		const user = userEvent.setup();
		render(<AccessibilityValidator />);

		await user.click(screen.getByLabelText("Scan settings"));
		await user.click(screen.getByRole("radio", { name: "AAA" }));
		await user.click(screen.getByRole("radio", { name: "Pointer" }));

		expect(useIssuesStore.getState().targetLevel).toBe("AAA");
		expect(useIssuesStore.getState().deviceType).toBe("pointer");
	});

	it("passes its own isExpanded state down to the alt text generator, starting collapsed", () => {
		render(<AccessibilityValidator />);

		expect(screen.getByTestId("alt-text-generator")).toHaveAttribute("data-expanded", "false");
	});
});
