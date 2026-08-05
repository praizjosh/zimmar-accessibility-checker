import { Contrast, MoveHorizontal, Pointer, TypeOutline } from "lucide-react";
import { MIN_FONT_SIZE } from "./constants";
import { Issue, IssueRecommendations } from "./types";

/**
 * Node types a touch-target issue (size or spacing) can apply to. Shared
 * by both ISSUES_DATA_SCHEMA entries below instead of repeating the list.
 */
const TOUCH_TARGET_NODE_TYPES: NodeType[] = [
  "COMPONENT",
  "COMPONENT_SET",
  "ELLIPSE",
  "FRAME",
  "GROUP",
  "INSTANCE",
  "POLYGON",
  "RECTANGLE",
  "VECTOR",
  "WIDGET",
];

const ISSUES_DATA_SCHEMA: Issue[] = [
  {
    id: 1,
    type: "CONTRAST",
    description: "Text contrast is below WCAG AA standard.",
    severity: "critical",
    nodeType: "TEXT",
    icon: (
      <Contrast
        strokeWidth={1.5}
        aria-hidden="true"
        className="size-[1.1rem] text-grey group-hover:text-accent"
      />
    ),
  },
  {
    id: 2,
    type: "TYPOGRAPHY",
    description: "Text size is too small for readability.",
    severity: "major",
    nodeType: "TEXT",
    icon: (
      <TypeOutline
        strokeWidth={1.5}
        aria-hidden="true"
        className="size-[1.1rem] text-grey group-hover:text-accent"
      />
    ),
  },
  {
    id: 3,
    type: "TOUCH_TARGET_SIZE",
    description: "Touch target element is smaller than 44px.",
    severity: "minor",
    nodeType: TOUCH_TARGET_NODE_TYPES,
    icon: (
      <Pointer
        strokeWidth={1.5}
        aria-hidden="true"
        className="size-[1.1rem] text-grey group-hover:text-accent"
      />
    ),
  },

  {
    id: 4,
    type: "TOUCH_TARGET_SPACING",
    description: "Touch target elements are too close.",
    severity: "minor",
    nodeType: TOUCH_TARGET_NODE_TYPES,
    icon: (
      <MoveHorizontal
        strokeWidth={1.5}
        aria-hidden="true"
        className="size-[1.1rem] text-grey group-hover:text-accent"
      />
    ),
  },
];

const ISSUE_RECOMMENDATIONS: IssueRecommendations[] = [
  {
    contrast: [
      "Increase the contrast ratio to at least 4.5:1 for normal text and 3:1 for large text (18px and up).",
      "To improve contrast, use a darker text color or a lighter background color.",
    ],
  },
  {
    typography: [
      `Ensure font size is at least ${MIN_FONT_SIZE}px to enhance readability and comply with WCAG "AA" standards.`,
      "Use a minimum font size of 16px for body text and 14px for buttons and other interactive elements.",
    ],
  },
  {
    "touch target size": [
      "Increase the touch target size to at least 44x44 pixels to ensure better accessibility on mobile devices. Maintain adequate spacing between interactive elements.",
    ],
  },
  {
    "touch target spacing": [
      "The touch target spacing should be at least 8px to the nearest element in all directions.",
    ],
  },
];

export { ISSUE_RECOMMENDATIONS, ISSUES_DATA_SCHEMA };
