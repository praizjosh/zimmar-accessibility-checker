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
    });
  });

  it("starts a scan and navigates to the overview when 'Scan entire page' is clicked", async () => {
    const user = userEvent.setup();
    render(<AccessibilityValidator />);

    await user.click(screen.getByRole("button", { name: "Scan entire page" }));

    expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN);
    expect(useIssuesStore.getState().currentRoute).toBe(
      "ISSUE_OVERVIEW_LIST_VIEW",
    );
  });

  it("disables the scan button while a scan is already in progress", () => {
    useIssuesStore.setState({ scanning: true });
    render(<AccessibilityValidator />);

    expect(
      screen.getByRole("button", { name: "Scan entire page" }),
    ).toBeDisabled();
  });

  it.each([
    ["Contrast", "CONTRAST", "ISSUE_LIST_VIEW"],
    ["Typography", "TYPOGRAPHY", "ISSUE_LIST_VIEW"],
    ["Touch Target Size", "TOUCH_TARGET_SIZE", "TOUCH_TARGET_ISSUE_LIST_VIEW"],
    [
      "Touch Target Spacing",
      "TOUCH_TARGET_SPACING",
      "TOUCH_TARGET_ISSUE_LIST_VIEW",
    ],
  ] as const)(
    "starts a quick check and routes to the right pager for %s",
    async (label, type, route) => {
      const user = userEvent.setup();
      render(<AccessibilityValidator />);

      await user.click(screen.getByRole("button", { name: label }));

      expect(postMessageToBackend).toHaveBeenCalledWith(
        MESSAGE_TYPES.START_QUICKCHECK,
      );
      expect(useIssuesStore.getState().selectedType).toBe(type);
      expect(useIssuesStore.getState().currentRoute).toBe(route);
    },
  );

  it("passes its own isExpanded state down to the alt text generator, starting collapsed", () => {
    render(<AccessibilityValidator />);

    expect(screen.getByTestId("alt-text-generator")).toHaveAttribute(
      "data-expanded",
      "false",
    );
  });
});
