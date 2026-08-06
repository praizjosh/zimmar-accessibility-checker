import { beforeEach, describe, expect, it, vi } from "vitest";
import { IssueX } from "../types";

const { postMessageToBackend } = vi.hoisted(() => ({
  postMessageToBackend: vi.fn(),
}));

vi.mock("../figmaUtils", () => ({ postMessageToBackend }));

import { MESSAGE_TYPES } from "../constants";
import useIssuesStore from "./index";

const issues: IssueX[] = [
  {
    type: "TYPOGRAPHY",
    severity: "major",
    nodeData: { id: "node-1", name: "Label A", nodeType: "TEXT" },
  },
  {
    type: "TYPOGRAPHY",
    severity: "major",
    nodeData: { id: "node-2", name: "Label B", nodeType: "TEXT" },
  },
];

describe("useIssuesStore.navigateToIssue", () => {
  beforeEach(() => {
    postMessageToBackend.mockClear();
    useIssuesStore.setState({
      issues,
      selectedType: "TYPOGRAPHY",
      currentIndex: 0,
    });
  });

  it("posts MESSAGE_TYPES.NAVIGATE with the target node's id and updates currentIndex", () => {
    useIssuesStore.getState().navigateToIssue(1);

    expect(postMessageToBackend).toHaveBeenCalledWith(MESSAGE_TYPES.NAVIGATE, {
      id: "node-2",
    });
    expect(useIssuesStore.getState().currentIndex).toBe(1);
  });

  it("does nothing when the index is out of range", () => {
    useIssuesStore.getState().navigateToIssue(5);

    expect(postMessageToBackend).not.toHaveBeenCalled();
    expect(useIssuesStore.getState().currentIndex).toBe(0);
  });

  it("does nothing when the index is negative", () => {
    useIssuesStore.getState().navigateToIssue(-1);

    expect(postMessageToBackend).not.toHaveBeenCalled();
    expect(useIssuesStore.getState().currentIndex).toBe(0);
  });
});

function fakeContrastIssue(id: string, compliance: string): IssueX {
  return {
    type: "CONTRAST",
    severity: "critical",
    nodeData: {
      id,
      name: id,
      nodeType: "TEXT",
      contrastScore: { compliance, ratio: compliance === "Fail" ? 2 : 5 },
    },
  };
}

describe("useIssuesStore.getIssueGroupList", () => {
  it("returns only issues matching the selected type", () => {
    useIssuesStore.setState({
      issues: [
        {
          type: "TYPOGRAPHY",
          severity: "major",
          nodeData: { id: "1", name: "A", nodeType: "TEXT" },
        },
        {
          type: "TOUCH_TARGET_SIZE",
          severity: "minor",
          nodeData: { id: "2", name: "B", nodeType: "FRAME" },
        },
      ],
      selectedType: "TYPOGRAPHY",
    });

    const result = useIssuesStore.getState().getIssueGroupList();

    expect(result.map((issue) => issue.nodeData.id)).toEqual(["1"]);
  });

  it("includes a CONTRAST issue only when its compliance is Fail", () => {
    useIssuesStore.setState({
      issues: [
        fakeContrastIssue("fail", "Fail"),
        fakeContrastIssue("pass", "AA"),
      ],
      selectedType: "CONTRAST",
    });

    const result = useIssuesStore.getState().getIssueGroupList();

    expect(result.map((issue) => issue.nodeData.id)).toEqual(["fail"]);
  });

  it("excludes a CONTRAST issue with no contrastScore at all", () => {
    useIssuesStore.setState({
      issues: [
        {
          type: "CONTRAST",
          severity: "critical",
          nodeData: { id: "no-score", name: "A", nodeType: "TEXT" },
        },
      ],
      selectedType: "CONTRAST",
    });

    expect(useIssuesStore.getState().getIssueGroupList()).toEqual([]);
  });

  it("returns an empty list when no scan has run yet (selectedType is empty)", () => {
    useIssuesStore.setState({
      issues: [
        {
          type: "TYPOGRAPHY",
          severity: "major",
          nodeData: { id: "1", name: "A", nodeType: "TEXT" },
        },
      ],
      selectedType: "",
    });

    expect(useIssuesStore.getState().getIssueGroupList()).toEqual([]);
  });

  it("defaults targetLevel to AA, so only Fail-compliance CONTRAST issues are flagged", () => {
    useIssuesStore.setState({
      issues: [
        fakeContrastIssue("fail", "Fail"),
        fakeContrastIssue("aa-pass", "AA"),
        fakeContrastIssue("aaa-pass", "AAA"),
      ],
      selectedType: "CONTRAST",
    });

    expect(useIssuesStore.getState().targetLevel).toBe("AA");
    expect(
      useIssuesStore
        .getState()
        .getIssueGroupList()
        .map((issue) => issue.nodeData.id),
    ).toEqual(["fail"]);
  });

  it("flags AA-only compliant CONTRAST issues once the target level is AAA", () => {
    useIssuesStore.setState({
      issues: [
        fakeContrastIssue("fail", "Fail"),
        fakeContrastIssue("aa-pass", "AA"),
        fakeContrastIssue("aaa-pass", "AAA"),
      ],
      selectedType: "CONTRAST",
      targetLevel: "AAA",
    });

    expect(
      useIssuesStore
        .getState()
        .getIssueGroupList()
        .map((issue) => issue.nodeData.id),
    ).toEqual(["fail", "aa-pass"]);
  });
});

describe("useIssuesStore.setTargetLevel", () => {
  it("updates targetLevel", () => {
    useIssuesStore.setState({ targetLevel: "AA" });

    useIssuesStore.getState().setTargetLevel("AAA");

    expect(useIssuesStore.getState().targetLevel).toBe("AAA");
  });
});
