import { TypeOutline, Contrast, Pointer } from "lucide-react";
import { ReactNode } from "react";

type Issue = {
  id: number;
  type: string;
  description: string;
  severity: "critical" | "major" | "minor";
  nodeType: string | string[];
  icon: ReactNode;
};

const ISSUES_DATA_SCHEMA: Issue[] = [
  {
    id: 1,
    type: "Contrast",
    description: "Text contrast is below WCAG AA standard.",
    severity: "critical",
    nodeType: "TEXT",
    icon: <Contrast className="size-5 text-plum-light" />,
  },
  {
    id: 2,
    type: "Typography",
    description: "Text size is too small for readability.",
    severity: "major",
    nodeType: "TEXT",
    icon: <TypeOutline className="size-5 text-plum-light" />,
  },
  {
    id: 3,
    type: "Touch Target Size",
    description: "Button touch target is smaller than 44px.",
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
    icon: <Pointer className="size-5 text-plum-light" />,
  },

  {
    id: 4,
    type: "Touch Target Spacing",
    description: "Touch targets are too close. Minimum spacing is 8px.",
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
    icon: <Pointer className="size-5 text-plum-light" />,
  },
];

export default ISSUES_DATA_SCHEMA;
