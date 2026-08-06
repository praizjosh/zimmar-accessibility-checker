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

const { saveAs } = vi.hoisted(() => ({ saveAs: vi.fn() }));

vi.mock("file-saver", () => ({ saveAs }));

import IssuesOverviewList from "./index";

function dispatch(type: string, data: unknown) {
  window.dispatchEvent(
    new MessageEvent("message", { data: { pluginMessage: { type, data } } }),
  );
}

async function goToReportTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: "Report" }));
}

const typographyIssue: IssueX = {
  type: "TYPOGRAPHY",
  description: "Text size is too small for readability.",
  severity: "major",
  nodeData: { id: "t1", name: "Label", nodeType: "TEXT" },
};

const contrastFailIssue: IssueX = {
  type: "CONTRAST",
  description: "Text contrast is below WCAG AA standard.",
  severity: "critical",
  nodeData: {
    id: "c1",
    name: "Text",
    nodeType: "TEXT",
    contrastScore: { compliance: "Fail", ratio: 2 },
  },
};

const contrastPassIssue: IssueX = {
  ...contrastFailIssue,
  nodeData: {
    ...contrastFailIssue.nodeData,
    id: "c2",
    contrastScore: { compliance: "AA", ratio: 5 },
  },
};

const defaultState = {
  issues: [] as IssueX[],
  scanning: false,
  currentRoute: "INDEX" as const,
  selectedType: "" as const,
  targetLevel: "AA" as const,
};

describe("IssuesOverviewList", () => {
  beforeEach(() => {
    postMessageToBackend.mockClear();
    saveAs.mockClear();
    useIssuesStore.setState(defaultState);
  });

  it("shows a loading screen instead of the tabs while scanning", () => {
    useIssuesStore.setState({ scanning: true });
    render(<IssuesOverviewList />);

    expect(screen.getByText("Scanning for issues...")).toBeVisible();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Rescan for issues" }),
    ).toBeNull();
  });

  it("loads issues from a LOAD_ISSUES message and stops scanning", async () => {
    useIssuesStore.setState({ scanning: true });
    render(<IssuesOverviewList />);

    dispatch(MESSAGE_TYPES.LOAD_ISSUES, [typographyIssue]);

    expect(useIssuesStore.getState().scanning).toBe(false);
    expect(useIssuesStore.getState().issues).toEqual([typographyIssue]);
  });

  it("logs an error and ignores a malformed message", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<IssuesOverviewList />);

    window.dispatchEvent(new MessageEvent("message", { data: null }));

    expect(errorSpy).toHaveBeenCalledWith("Invalid message format:", null);
    expect(useIssuesStore.getState().issues).toEqual([]);

    errorSpy.mockRestore();
  });

  it("returns to the index and clears issues when the back button is clicked", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({ issues: [typographyIssue] });
    render(<IssuesOverviewList />);

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(useIssuesStore.getState().currentRoute).toBe("INDEX");
    expect(useIssuesStore.getState().issues).toEqual([]);
  });

  it("rescans by clearing issues and starting a new scan", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({ issues: [typographyIssue] });
    render(<IssuesOverviewList />);

    await user.click(screen.getByRole("button", { name: "Rescan for issues" }));

    expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.SCAN);
    expect(useIssuesStore.getState().scanning).toBe(true);
  });

  it("shows 'No issues found' when there are no issues", () => {
    render(<IssuesOverviewList />);

    expect(screen.getByText("No issues found")).toBeVisible();
  });

  it("lists each present issue type with its count and only counts failing contrast issues", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({
      issues: [typographyIssue, contrastFailIssue, contrastPassIssue],
    });
    render(<IssuesOverviewList />);

    expect(
      screen.getByText("There are 2 issues detected on this screen."),
    ).toBeVisible();

    const contrastRow = screen.getByRole("button", { name: "Contrast" });
    expect(contrastRow).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Typography" }));

    expect(useIssuesStore.getState().selectedType).toBe("TYPOGRAPHY");
    expect(useIssuesStore.getState().currentRoute).toBe("ISSUE_LIST_VIEW");
  });

  it("does not show the WCAG target toggle when there are no contrast issues", () => {
    useIssuesStore.setState({ issues: [typographyIssue] });
    render(<IssuesOverviewList />);

    expect(screen.queryByText("WCAG target")).toBeNull();
  });

  it("shows the WCAG target toggle when there are contrast issues, defaulting to AA", () => {
    useIssuesStore.setState({
      issues: [contrastFailIssue, contrastPassIssue],
    });
    render(<IssuesOverviewList />);

    expect(screen.getByText("WCAG target")).toBeVisible();
    expect(screen.getByRole("radio", { name: "AA" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("counts an AA-passing contrast issue as failing once the target level is switched to AAA", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({
      issues: [contrastFailIssue, contrastPassIssue],
    });
    render(<IssuesOverviewList />);

    expect(
      screen.getByText("There are 1 issues detected on this screen."),
    ).toBeVisible();

    await user.click(screen.getByRole("radio", { name: "AAA" }));

    expect(useIssuesStore.getState().targetLevel).toBe("AAA");
    expect(
      screen.getByText("There are 2 issues detected on this screen."),
    ).toBeVisible();
  });

  it("shows the category breakdown chart on the Report tab only when there are counted issues", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({ issues: [typographyIssue] });
    render(<IssuesOverviewList />);

    await goToReportTab(user);

    expect(screen.getByText("Issues by category")).toBeVisible();
  });

  it("does not show the breakdown chart when there are no counted issues", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({ issues: [contrastPassIssue] });
    render(<IssuesOverviewList />);

    await goToReportTab(user);

    expect(screen.queryByText("Issues by category")).toBeNull();
  });

  it("downloads a CSV report when 'Download CSV' is clicked", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({ issues: [typographyIssue] });
    render(<IssuesOverviewList />);

    await goToReportTab(user);
    await user.click(screen.getByRole("button", { name: "Download CSV" }));

    expect(saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      "accessibility-issues-report.csv",
    );
  });

  it("downloads a JSON report when 'Download JSON' is clicked", async () => {
    const user = userEvent.setup();
    useIssuesStore.setState({ issues: [typographyIssue] });
    render(<IssuesOverviewList />);

    await goToReportTab(user);
    await user.click(screen.getByRole("button", { name: "Download JSON" }));

    expect(saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      "accessibility-issues-report.json",
    );
  });
});
