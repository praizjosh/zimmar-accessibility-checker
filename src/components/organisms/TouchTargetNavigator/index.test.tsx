import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IssueX } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend: vi.fn() }));

vi.mock("@/components/organisms/IssuesWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import TouchTargetNavigator from "./index";

const touchTargetSizeIssue: IssueX = {
  type: "TOUCH_TARGET_SIZE",
  description: "Touch target size is too small.",
  severity: "minor",
  nodeData: {
    id: "tt1",
    name: "Icon button",
    nodeType: "FRAME",
    width: 20.4,
    height: 30.6,
    requiredSize: "44 x 44px",
  },
};

const touchTargetSpacingIssue: IssueX = {
  ...touchTargetSizeIssue,
  type: "TOUCH_TARGET_SPACING",
};

const defaultState = {
  issues: [] as IssueX[],
  singleIssue: null,
  currentIndex: 0,
  selectedType: "" as const,
};

describe("TouchTargetNavigator", () => {
  beforeEach(() => {
    useIssuesStore.setState(defaultState);
  });

  it("shows an empty-state message when there is no issue to display", () => {
    useIssuesStore.setState({ selectedType: "TOUCH_TARGET_SIZE" });
    render(<TouchTargetNavigator />);

    expect(
      screen.getByText("No TOUCH_TARGET_SIZE issue detected."),
    ).toBeVisible();
  });

  it("renders the element name, current/required size, and severity", () => {
    useIssuesStore.setState({
      selectedType: "TOUCH_TARGET_SIZE",
      issues: [touchTargetSizeIssue],
    });
    render(<TouchTargetNavigator />);

    expect(screen.getByText("Icon button")).toBeVisible();
    expect(screen.getByText("20.4")).toBeVisible();
    expect(screen.getByText("30.6px")).toBeVisible();
    expect(screen.getByText("44 x 44px")).toBeVisible();
    expect(screen.getByText("minor")).toBeVisible();
  });

  it("prefers the node's characters over its name when both are present", () => {
    useIssuesStore.setState({
      selectedType: "TOUCH_TARGET_SIZE",
      issues: [
        {
          ...touchTargetSizeIssue,
          nodeData: {
            ...touchTargetSizeIssue.nodeData,
            characters: "Tap here",
          },
        },
      ],
    });
    render(<TouchTargetNavigator />);

    expect(screen.getByText("Tap here")).toBeVisible();
    expect(screen.queryByText("Icon button")).toBeNull();
  });

  it("shows the element-spacing row only for TOUCH_TARGET_SPACING", () => {
    useIssuesStore.setState({
      selectedType: "TOUCH_TARGET_SPACING",
      issues: [touchTargetSpacingIssue],
    });
    render(<TouchTargetNavigator />);

    expect(screen.getByText("Element spacing:")).toBeVisible();
  });

  it("does not show the element-spacing row for TOUCH_TARGET_SIZE", () => {
    useIssuesStore.setState({
      selectedType: "TOUCH_TARGET_SIZE",
      issues: [touchTargetSizeIssue],
    });
    render(<TouchTargetNavigator />);

    expect(screen.queryByText("Element spacing:")).toBeNull();
  });
});
