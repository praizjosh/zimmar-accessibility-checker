import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./utils";

describe("copyToClipboard", () => {
  const originalClipboard = navigator.clipboard;
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
    document.execCommand = originalExecCommand;
    vi.restoreAllMocks();
  });

  it("uses navigator.clipboard.writeText when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    document.execCommand = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await copyToClipboard({ text: "hello", onSuccess, onError });

    expect(writeText).toHaveBeenCalledWith("hello");
    expect(document.execCommand).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("falls back to document.execCommand when navigator.clipboard.writeText rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    document.execCommand = vi.fn().mockReturnValue(true);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await copyToClipboard({ text: "hello", onSuccess, onError });

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("falls back to document.execCommand when navigator.clipboard is unavailable (Figma plugin iframe)", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = vi.fn().mockReturnValue(true);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await copyToClipboard({ text: "hello", onSuccess, onError });

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError when document.execCommand fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = vi.fn().mockReturnValue(false);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await copyToClipboard({ text: "hello", onSuccess, onError });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
