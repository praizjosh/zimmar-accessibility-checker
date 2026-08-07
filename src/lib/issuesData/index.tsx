import { Contrast, MoveHorizontal, Pointer, TypeOutline } from "lucide-react";
import { Issue } from "../types";

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

export default ISSUES_DATA_SCHEMA;
