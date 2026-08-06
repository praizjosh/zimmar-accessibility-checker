import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_TYPES } from "@/lib/constants";

const { postMessageToBackend } = vi.hoisted(() => ({
	postMessageToBackend: vi.fn(),
}));

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend }));

const { copyToClipboard } = vi.hoisted(() => ({
	copyToClipboard: vi.fn(),
}));

vi.mock("@/lib/utils", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/utils")>();
	return { ...actual, copyToClipboard };
});

import AltTextGenerator from "./index";

function dispatchGenerateAltText(payload: Record<string, unknown> = {}) {
	window.dispatchEvent(
		new MessageEvent("message", {
			data: {
				pluginMessage: {
					type: MESSAGE_TYPES.GENERATE_ALT_TEXT,
					data: payload,
				},
			},
		}),
	);
}

function fakeResponse(overrides: { ok: boolean; status?: number; json: unknown }) {
	return {
		ok: overrides.ok,
		status: overrides.status,
		json: () => Promise.resolve(overrides.json),
	} as Response;
}

describe("AltTextGenerator", () => {
	beforeEach(() => {
		postMessageToBackend.mockClear();
		copyToClipboard.mockClear();
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("does not render the generator controls when collapsed", () => {
		render(<AltTextGenerator isExpanded={false} setIsExpanded={vi.fn()} />);

		expect(screen.queryByRole("button", { name: "Generate alt text" })).not.toBeInTheDocument();
	});

	it("expands when the collapsed row is clicked", async () => {
		const user = userEvent.setup();
		const setIsExpanded = vi.fn();
		render(<AltTextGenerator isExpanded={false} setIsExpanded={setIsExpanded} />);

		await user.click(screen.getByRole("button", { name: /Alt Text Generator/i }));

		expect(setIsExpanded).toHaveBeenCalledWith(true);
	});

	it("collapses via the labelled chevron button when expanded", async () => {
		const user = userEvent.setup();
		const setIsExpanded = vi.fn();
		render(<AltTextGenerator isExpanded setIsExpanded={setIsExpanded} />);

		await user.click(screen.getByRole("button", { name: "Collapse Alt Text Generator" }));

		expect(setIsExpanded).toHaveBeenCalledWith(false);
	});

	it("does not expose the collapse button while collapsed", () => {
		render(<AltTextGenerator isExpanded={false} setIsExpanded={vi.fn()} />);

		expect(
			screen.queryByRole("button", { name: "Collapse Alt Text Generator" }),
		).not.toBeInTheDocument();
	});

	it("requests image data when the generate button is clicked", async () => {
		const user = userEvent.setup();
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);

		await user.click(screen.getByRole("button", { name: "Generate alt text" }));

		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.GET_IMAGE_DATA);
	});

	it("disables the generate button while a request is in flight", async () => {
		let resolveFetch: (value: Response) => void = () => {};
		vi.mocked(fetch).mockReturnValueOnce(
			new Promise((resolve) => {
				resolveFetch = resolve;
			}),
		);
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);
		const button = screen.getByRole("button", { name: "Generate alt text" });

		dispatchGenerateAltText();

		await waitFor(() => expect(button).toBeDisabled());

		resolveFetch(
			fakeResponse({
				ok: true,
				json: { data: { altText: "A cat", remaining: 3 } },
			}),
		);

		await waitFor(() => expect(button).not.toBeDisabled());
	});

	it("shows the generated alt text and remaining quota on success", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			fakeResponse({
				ok: true,
				json: { data: { altText: "A red button", remaining: 4 } },
			}),
		);
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);

		dispatchGenerateAltText({ image: "data:image/png;base64,..." });

		expect(await screen.findByText("A red button")).toBeVisible();
		expect(
			screen.getByText(
				(_, element) => element?.textContent === "Remaining requests today: 4",
			),
		).toBeVisible();
		expect(screen.getByLabelText("Copy generated alt text to clipboard")).toBeVisible();
	});

	it("shows a network error message when the fetch fails outright", async () => {
		vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);

		dispatchGenerateAltText();

		expect(await screen.findByText("Network error. Please try again.")).toBeVisible();
	});

	it("shows an image-too-large message for a 413 response", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			fakeResponse({ ok: false, status: 413, json: null }),
		);
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);

		dispatchGenerateAltText();

		expect(
			await screen.findByText(
				"Image too large. Please use or select a smaller element and try again.",
			),
		).toBeVisible();
	});

	it("surfaces the server's quota-exceeded message and remaining count separately from the generic error", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			fakeResponse({
				ok: false,
				status: 429,
				json: { data: { remaining: 0 }, error: "Daily quota exceeded" },
			}),
		);
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);

		dispatchGenerateAltText();

		expect(
			await screen.findByText("Something went wrong generating alt text. Please try again."),
		).toBeVisible();
		expect(screen.getByText("Daily quota exceeded")).toBeVisible();
		expect(
			screen.getByText(
				(_, element) => element?.textContent === "Remaining requests today: 0",
			),
		).toBeVisible();
	});

	it("copies the generated alt text and notifies the backend on success", async () => {
		const user = userEvent.setup();
		vi.mocked(fetch).mockResolvedValueOnce(
			fakeResponse({
				ok: true,
				json: { data: { altText: "A blue icon", remaining: 2 } },
			}),
		);
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);
		dispatchGenerateAltText();
		await screen.findByText("A blue icon");

		await user.click(screen.getByLabelText("Copy generated alt text to clipboard"));

		expect(copyToClipboard).toHaveBeenCalledWith(
			expect.objectContaining({ text: "A blue icon" }),
		);

		const { onSuccess } = copyToClipboard.mock.calls[0][0];
		onSuccess();

		expect(await screen.findByLabelText("Text copied to clipboard")).toBeVisible();
		expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NOTIFY, {
			message: "Alt text copied to clipboard",
		});
	});

	it("logs a console error and leaves the copy icon unchanged when copying fails", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const user = userEvent.setup();
		vi.mocked(fetch).mockResolvedValueOnce(
			fakeResponse({
				ok: true,
				json: { data: { altText: "A green banner", remaining: 1 } },
			}),
		);
		render(<AltTextGenerator isExpanded setIsExpanded={vi.fn()} />);
		dispatchGenerateAltText();
		await screen.findByText("A green banner");

		await user.click(screen.getByLabelText("Copy generated alt text to clipboard"));
		const { onError } = copyToClipboard.mock.calls[0][0];
		onError(new Error("denied"));

		expect(errorSpy).toHaveBeenCalledWith(
			"Failed to copy alt text to clipboard:",
			expect.any(Error),
		);
		expect(screen.getByLabelText("Copy generated alt text to clipboard")).toBeVisible();
		expect(postMessageToBackend).not.toHaveBeenCalledWith(
			MESSAGE_TYPES.NOTIFY,
			expect.anything(),
		);

		errorSpy.mockRestore();
	});
});
