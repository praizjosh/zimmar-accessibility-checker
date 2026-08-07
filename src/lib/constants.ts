import ISSUE_TYPE_LABELS from "./issueTypeLabels";
import { DeviceType, IssueType, TargetLevel } from "./types";

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
	LOAD_SCAN_SETTINGS: "load-scan-settings",
	SAVE_SCAN_SETTINGS: "save-scan-settings",
};

/** figma.clientStorage key the persisted deviceType/targetLevel are saved under - see plugin/code.ts's SAVE_SCAN_SETTINGS handler. */
export const SCAN_SETTINGS_STORAGE_KEY = "zimmar-scan-settings";

export const ISSUES_TYPES = Object.keys(ISSUE_TYPE_LABELS) as IssueType[];

export const MIN_FONT_SIZE: number = 11;

export const MIN_TOUCH_TARGET_SIZE_AA: number = 24;
export const MIN_TOUCH_TARGET_SIZE_AAA: number = 44;
export const MIN_TOUCH_TARGET_SPACING: number = 8;

export const TOUCH_TARGET_KEYWORDS = ["btn", "button", "link", "touch"];

/**
 * Grid cell size (px) for the spatial index isTouchTargetTooClose's callers
 * use to avoid comparing every scannable node against every other one - see
 * buildTouchTargetSpatialIndex (figmaUtils). Two nodes can only ever trigger
 * a spacing violation if they're within MIN_TOUCH_TARGET_SPACING of each
 * other, so cells only need to be roughly "typical touch target" sized:
 * big enough that most elements span 1-4 cells (keeping the index cheap to
 * build), small enough that a busy row of icons doesn't collapse into one
 * cell and defeat the point.
 */
export const TOUCH_TARGET_SPATIAL_CELL_SIZE = 100;

export const TARGET_LEVELS: readonly TargetLevel[] = ["AA", "AAA"] as const;

/**
 * Minimum touch target size in px per WCAG target level - AA is 2.5.8
 * Target Size (Minimum), AAA is 2.5.5 Target Size (Enhanced, the value this
 * app checked against before device/level awareness existed). Only
 * meaningful when deviceType is "touch" - see DeviceType's doc comment.
 */
export const TOUCH_TARGET_MIN_SIZE: Record<TargetLevel, number> = {
	AA: MIN_TOUCH_TARGET_SIZE_AA,
	AAA: MIN_TOUCH_TARGET_SIZE_AAA,
};

export const DEVICE_TYPES: readonly DeviceType[] = ["touch", "pointer"] as const;

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
	touch: "Touch",
	pointer: "Pointer",
};
