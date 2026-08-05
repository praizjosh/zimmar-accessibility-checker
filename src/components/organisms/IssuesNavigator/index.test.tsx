import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MESSAGE_TYPES } from "@/lib/constants";
import { IssueX } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";

const { postMessageToBackend } = vi.hoisted(() => ({
  postMessageToBackend: vi.fn(),
}));

vi.mock("@/lib/figmaUtils", () => ({ postMessageToBackend }));

vi.mock("@/components/organisms/IssuesWrapper", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import IssuesNavigator from "./index";

const typographyIssue: IssueX = {
  type: "TYPOGRAPHY",
  description: "Text size is too small for readability.",
  severity: "major",
  nodeData: {
    id: "t1",
    name: "Label",
    nodeType: "TEXT",
    characters: "Hello world",
    fontSize: 10,
  },
};

const contrastIssue: IssueX = {
  type: "CONTRAST",
  description: "Text contrast is below WCAG AA standard.",
  severity: "critical",
  nodeData: {
    id: "c1",
    name: "Text",
    nodeType: "TEXT",
    characters: "Body copy",
    fontSize: 16,
    foregroundColor: [0, 0, 0],
    backgroundColor: [17, 17, 17],
    contrastScore: { compliance: "Fail", ratio: 1.2 },
  },
};

const defaultState = {
  issues: [] as IssueX[],
  singleIssue: null,
  currentIndex: 0,
  selectedType: "" as const,
};

describe("IssuesNavigator", () => {
  beforeEach(() => {
    postMessageToBackend.mockClear();
    useIssuesStore.setState(defaultState);
  });

  it("shows an empty-state message when there is no issue to display", () => {
    useIssuesStore.setState({ selectedType: "TYPOGRAPHY" });
    render(<IssuesNavigator />);

    expect(screen.getByText("No TYPOGRAPHY issue detected.")).toBeVisible();
  });

  it("renders the text, font size, and severity rows for a typography issue", () => {
    useIssuesStore.setState({
      selectedType: "TYPOGRAPHY",
      issues: [typographyIssue],
    });
    render(<IssuesNavigator />);

    expect(screen.getByText("Hello world")).toBeVisible();
    expect(screen.getByRole("spinbutton")).toHaveValue(10);
    expect(screen.getByText("major")).toBeVisible();
  });

  it("updates the font size on the matching issue and notifies the backend", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({
      selectedType: "TYPOGRAPHY",
      issues: [typographyIssue],
    });
    render(<IssuesNavigator />);

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "18");

    expect(postMessageToBackend).toHaveBeenCalledWith(
      MESSAGE_TYPES.UPDATE_FONT_SIZE,
      { id: "t1", fontSize: 18 },
    );
    expect(useIssuesStore.getState().issues[0].nodeData.fontSize).toBe(18);
  });

  it("updates singleIssue instead of the issues list when there is no active issue group (quick check mode)", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({
      selectedType: "TYPOGRAPHY",
      issues: [],
      singleIssue: typographyIssue,
    });
    render(<IssuesNavigator />);

    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.type(input, "20");

    expect(useIssuesStore.getState().singleIssue?.nodeData.fontSize).toBe(20);
  });

  it("shows the contrast-specific rows only for a CONTRAST issue", () => {
    useIssuesStore.setState({
      selectedType: "CONTRAST",
      issues: [contrastIssue],
    });
    render(<IssuesNavigator />);

    expect(screen.getByText("Text colour:")).toBeVisible();
    expect(screen.getByText("Background colour:")).toBeVisible();
    expect(screen.getByText("WCAG score:")).toBeVisible();
    expect(screen.getByText("Fail")).toBeVisible();
    expect(screen.getByText("Contrast ratio:")).toBeVisible();
    expect(screen.getByText("1.20 : 1")).toBeVisible();
  });

  it("does not show the contrast-specific rows for a non-CONTRAST issue", () => {
    useIssuesStore.setState({
      selectedType: "TYPOGRAPHY",
      issues: [typographyIssue],
    });
    render(<IssuesNavigator />);

    expect(screen.queryByText("WCAG score:")).toBeNull();
    expect(screen.queryByText("Contrast ratio:")).toBeNull();
  });
});
