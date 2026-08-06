import ISSUE_TYPE_LABELS from "./issueTypeLabels";
import { IssueType, TargetLevel } from "./types";

export const MESSAGE_TYPES = {
  START_QUICKCHECK: "start-quickcheck",
  CANCEL_QUICKCHECK: "cancel-quickcheck",
  SCAN: "scan",
  UPDATE_FONT_SIZE: "update-font-size",
  UPDATE_FILL_COLOR: "update-fill-color",
  NAVIGATE: "navigate",
  GET_IMAGE_DATA: "get-image-data",
  GENERATE_ALT_TEXT: "generate-alt-text",
  NOTIFY: "notify",
  DETECTED_ISSUE: "detected-issue",
  LAYER_SELECTED: "layer-selected",
  NO_SELECTION: "no-selection",
  QUICKCHECK_ACTIVE: "quickcheck-active",
  NO_BACKGROUND: "no-background",
  NO_FOREGROUND: "no-foreground",
  LOAD_ISSUES: "load-issues",
};

export const ISSUES_TYPES = Object.keys(ISSUE_TYPE_LABELS) as IssueType[];

export const MIN_FONT_SIZE: number = 11;

export const MIN_TOUCH_TARGET_SIZE: number = 44;

export const MIN_TOUCH_TARGET_SPACING: number = 8;

export const TOUCH_TARGET_KEYWORDS = ["btn", "button", "link", "touch"];

export const TARGET_LEVELS: readonly TargetLevel[] = ["AA", "AAA"] as const;
