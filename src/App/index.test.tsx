import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_TYPES } from "@/lib/constants";
import useIssuesStore from "@/lib/useIssuesStore";

const { postMessageToBackend } = vi.hoisted(() => ({
	postMessageToBackend: vi.fn(),
}));

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend }));

import App from "./index";

function dispatch(type: string, data: unknown) {
	window.dispatchEvent(new MessageEvent("message", { data: { pluginMessage: { type, data } } }));
}

describe("App", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		useIssuesStore.setState({
			currentRoute: "INDEX",
			targetLevel: "AA",
			deviceType: "touch",
		});
	});

	it("hydrates targetLevel and deviceType from a LOAD_SCAN_SETTINGS message", () => {
		render(<App />);

		dispatch(MESSAGE_TYPES.LOAD_SCAN_SETTINGS, {
			deviceType: "pointer",
			targetLevel: "AAA",
		});

		expect(useIssuesStore.getState().deviceType).toBe("pointer");
		expect(useIssuesStore.getState().targetLevel).toBe("AAA");
	});

	it("updates fileScanProgress from a SCAN_FILE_PROGRESS message", () => {
		render(<App />);

		dispatch(MESSAGE_TYPES.SCAN_FILE_PROGRESS, {
			pageIndex: 2,
			pageCount: 5,
			pageName: "About",
		});

		expect(useIssuesStore.getState().fileScanProgress).toEqual({
			pageIndex: 2,
			pageCount: 5,
			pageName: "About",
		});
	});

	it("ignores an unrelated message type", () => {
		render(<App />);

		dispatch("some-other-message", { foo: "bar" });

		expect(useIssuesStore.getState().deviceType).toBe("touch");
		expect(useIssuesStore.getState().targetLevel).toBe("AA");
	});

	it("renders the route for the current currentRoute", () => {
		render(<App />);

		expect(screen.getByRole("button", { name: "Scan entire page" })).toBeVisible();
	});
});
