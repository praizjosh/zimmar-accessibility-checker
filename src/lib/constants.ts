import { IssueType } from "./types";

export const MESSAGE_TYPES = {
  START_QUICKCHECK: "start-quickcheck",
  CANCEL_QUICKCHECK: "cancel-quickcheck",
  SCAN: "scan",
  UPDATE_FONT_SIZE: "update-font-size",
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

/**
 * Human-readable label for each machine-readable IssueType key. The single
 * source of truth for display text - anywhere an issue type is shown to
 * the user should resolve through this, not render the key directly.
 */
export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  TYPOGRAPHY: "Typography",
  CONTRAST: "Contrast",
  TOUCH_TARGET_SIZE: "Touch Target Size",
  TOUCH_TARGET_SPACING: "Touch Target Spacing",
};

export const ISSUES_TYPES = Object.keys(ISSUE_TYPE_LABELS) as IssueType[];

export const MIN_FONT_SIZE: number = 11;

export const MIN_TOUCH_TARGET_SIZE: number = 44; // Minimum touch target size (44x44)

export const MIN_TOUCH_TARGET_SPACING: number = 8; // Minimum spacing between touch targets

export const TOUCH_TARGET_KEYWORDS = ["btn", "button", "link", "touch"];
