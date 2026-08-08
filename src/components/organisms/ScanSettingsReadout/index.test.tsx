import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ScanSettingsReadout from "./index";

describe("ScanSettingsReadout", () => {
	it("shows the given target level and device type label", () => {
		render(<ScanSettingsReadout targetLevel="AAA" deviceType="pointer" />);

		expect(screen.getByText(/Scanning against.*AAA.*Pointer/)).toBeVisible();
	});

	it("maps 'touch' to the Touch label", () => {
		render(<ScanSettingsReadout targetLevel="AA" deviceType="touch" />);

		expect(screen.getByText(/Scanning against.*AA.*Touch/)).toBeVisible();
	});

	it("merges a caller-provided className with its own base classes", () => {
		render(<ScanSettingsReadout targetLevel="AA" deviceType="touch" className="mb-2" />);

		expect(screen.getByText(/Scanning against/)).toHaveClass("mb-2", "text-right", "text-xs");
	});
});
