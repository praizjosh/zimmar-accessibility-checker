import { TypeOutline, Contrast, Pointer, MoveHorizontal } from "lucide-react";
import { ReactNode } from "react";
import { MIN_FONT_SIZE } from "./constants";

type Issue = {
  id: number;
  type: string;
  description: string;
  severity: "critical" | "major" | "minor";
  nodeType: string | string[];
  icon: ReactNode;
};

type IssueRecommendations = {
  [key: string]: string[];
};

const ISSUES_DATA_SCHEMA: Issue[] = [
  {
    id: 1,
    type: "Contrast",
    description: "Text contrast is below WCAG AA standard.",
    severity: "critical",
    nodeType: "TEXT",
    icon: <Contrast className="size-5 text-gray group-hover:text-accent" />,
  },
  {
    id: 2,
    type: "Typography",
    description: "Text size is too small for readability.",
    severity: "major",
    nodeType: "TEXT",
    icon: <TypeOutline className="size-5 text-gray group-hover:text-accent" />,
  },
  {
    id: 3,
    type: "Touch Target Size",
    description: "Touch target element is smaller than 44px.",
    severity: "minor",
    nodeType: [
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
    ],
    icon: <Pointer className="size-5 text-gray group-hover:text-accent" />,
  },

  {
    id: 4,
    type: "Touch Target Spacing",
    description: "Touch target elements are too close. Minimum spacing is 8px.",
    severity: "minor",
    nodeType: [
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
    ],
    icon: (
      <MoveHorizontal className="size-5 text-gray group-hover:text-accent" />
    ),
  },
];

const ISSUE_RECOMMENDATIONS: IssueRecommendations[] = [
  {
    contrast: [
      "Increase the contrast ratio to at least 4.5:1 for normal text and 3:1 for large text.",
      "To improve contrast, use a darker text color or a lighter background color",
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

export { ISSUES_DATA_SCHEMA, ISSUE_RECOMMENDATIONS };
