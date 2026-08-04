/**
 * Raw issue-type label data. Deliberately import-free: types.ts derives
 * IssueType from this object's keys (keyof typeof), so this file can't
 * import from types.ts (or from anything that imports from types.ts)
 * without creating a cycle.
 */
const ISSUE_TYPE_LABELS = {
  TYPOGRAPHY: "Typography",
  CONTRAST: "Contrast",
  TOUCH_TARGET_SIZE: "Touch Target Size",
  TOUCH_TARGET_SPACING: "Touch Target Spacing",
};

export default ISSUE_TYPE_LABELS;
