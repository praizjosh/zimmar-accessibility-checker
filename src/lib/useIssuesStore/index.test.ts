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
    type: "Typography",
    severity: "major",
    nodeData: { id: "node-1", name: "Label A", nodeType: "TEXT" },
  },
  {
    type: "Typography",
    severity: "major",
    nodeData: { id: "node-2", name: "Label B", nodeType: "TEXT" },
  },
];

describe("useIssuesStore.navigateToIssue", () => {
  beforeEach(() => {
    postMessageToBackend.mockClear();
    useIssuesStore.setState({
      issues,
      selectedType: "Typography",
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
