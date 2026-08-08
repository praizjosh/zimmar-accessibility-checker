import ISSUE_TYPE_LABELS from "./issueTypeLabels";
import { DeviceType, IssueType, TargetLevel } from "./types";

export const MESSAGE_TYPES = {
	START_QUICKCHECK: "start-quickcheck",
	CANCEL_QUICKCHECK: "cancel-quickcheck",
	SCAN: "scan",
	CANCEL_SCAN: "cancel-scan",
	SCAN_FILE: "scan-file",
	SCAN_FILE_PROGRESS: "scan-file-progress",
	SCAN_FILE_PAGE_ISSUES: "scan-file-page-issues",
	SCAN_FILE_COMPLETE: "scan-file-complete",
	CANCEL_SCAN_FILE: "cancel-scan-file",
	UPDATE_FONT_SIZE: "update-font-size",
	UPDATE_FILL_COLOR: "update-fill-color",
	NAVIGATE: "navigate",
	SELECT_MULTIPLE: "select-multiple",
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
	MARK_FILE_SCAN_OPTION_SEEN: "mark-file-scan-option-seen",
	LOAD_FILE_SCAN_OPTION_SEEN: "load-file-scan-option-seen",
	LOAD_PAGE_COUNT: "load-page-count",
};

export const CLIENT_STORAGE_KEYS = {
	/** persisted deviceType/targetLevel - see plugin/code.ts's SAVE_SCAN_SETTINGS handler. */
	SCAN_SETTINGS: "zimmar-scan-settings",
	/** whether the user has ever opened the "scan entire file" caret menu - separate from SCAN_SETTINGS because this is UI-discovery state, not a scan criterion. */
	FILE_SCAN_OPTION_SEEN: "zimmar-file-scan-option-seen",
} as const;

export const ISSUES_TYPES = Object.keys(ISSUE_TYPE_LABELS) as IssueType[];

export const SIZE_LIMITS = {
	/** Minimum readable font size in px - text below this triggers a TYPOGRAPHY issue. */
	MIN_FONT_SIZE: 11,
	/** Minimum touch target size in px per WCAG 2.5.8 Target Size (Minimum, AA). */
	MIN_TOUCH_TARGET_SIZE_AA: 24,
	/** Minimum touch target size in px per WCAG 2.5.5 Target Size (Enhanced, AAA) - the value this app checked against before device/level awareness existed. */
	MIN_TOUCH_TARGET_SIZE_AAA: 44,
	/** Minimum spacing in px between adjacent touch targets before flagging a spacing violation. */
	MIN_TOUCH_TARGET_SPACING: 8,
} as const;

export const TOUCH_TARGET_KEYWORDS = [
	"btn",
	"button",
	"link",
	"touch",
	"toggle",
	"switch",
	"checkbox",
	"radio",
	"chip",
	"fab",
	"menu-item",
	"nav-item",
	"input",
	"field",
	"dropdown",
	"select",
	"close",
];

/**
 * Grid cell size (px) for the spatial index isTouchTargetTooClose's callers
 * use to avoid comparing every scannable node against every other one - see
 * buildTouchTargetSpatialIndex (figmaUtils). Two nodes can only ever trigger
 * a spacing violation if they're within SIZE_LIMITS.MIN_TOUCH_TARGET_SPACING of each
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
	AA: SIZE_LIMITS.MIN_TOUCH_TARGET_SIZE_AA,
	AAA: SIZE_LIMITS.MIN_TOUCH_TARGET_SIZE_AAA,
};

export const DEVICE_TYPES: readonly DeviceType[] = ["touch", "pointer"] as const;

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
	touch: "Touch",
	pointer: "Pointer",
};
