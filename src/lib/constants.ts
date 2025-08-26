export const MESSAGE_TYPES = {
  START_QUICKCHECK: "start-quickcheck",
  CANCEL_QUICKCHECK: "cancel-quickcheck",
  SCAN: "scan",
  UPDATE_FONT_SIZE: "updateFontSize",
  NAVIGATE: "navigate",
  GET_IMAGE_DATA: "get-image-data",
  GENERATE_ALT_TEXT: "GENERATE_ALT_TEXT",
};

export const ISSUES_TYPES = [
  "Typography",
  "Contrast",
  "Touch Target Size",
  "Touch Target Spacing",
];

export const MIN_FONT_SIZE: number = 11;

export const MIN_TOUCH_TARGET_SIZE: number = 44; // Minimum touch target size (44x44)

export const MIN_TOUCH_TARGET_SPACING: number = 8; // Minimum spacing between touch targets

export const TOUCH_TARGET_KEYWORDS = ["btn", "button", "link", "touch"];
