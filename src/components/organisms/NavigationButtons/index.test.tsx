import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import useIssuesStore from "@/lib/useIssuesStore";
import NavigationButtons from "./index";

describe("NavigationButtons", () => {
  it.each([
    ["Go to Index", "INDEX"],
    ["Go to Single Issue List", "ISSUE_LIST_VIEW"],
    ["Go to Issues Overview List", "ISSUE_OVERVIEW_LIST_VIEW"],
    ["Go to Touch Target Issues List", "TOUCH_TARGET_ISSUE_LIST_VIEW"],
  ] as const)("'%s' navigates to %s", async (label, route) => {
    const user = userEvent.setup();
    render(<NavigationButtons />);

    await user.click(screen.getByText(label));

    expect(useIssuesStore.getState().currentRoute).toBe(route);
  });
});
