import { IssueType, TargetLevel } from "../types";

export type WcagCitation = {
	/**
	 * False only for TYPOGRAPHY - no ratified numbered WCAG SC exists for a
	 * minimum font size; WCAG addresses text sizing via SC 1.4.4 Resize Text
	 * instead (zoom/reflow to 200%, not a hard minimum size) - related but not
	 * an exact match. Kept as an explicit boolean, not inferred from string
	 * content, so the inexact case can be asserted distinctly rather than
	 * silently reading like every other row.
	 */
	exact: boolean;
	citation: string;
	url: string;
};

// Every URL below was fetched and confirmed live (200, correct page title)
// while scoping this feature (10/08/2026) - W3C WAI's own "Understanding SC
// X.X.X" pages, canonical form includes the .html suffix.
const CONTRAST_MINIMUM_URL = "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html";
const CONTRAST_ENHANCED_URL = "https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html";
const TARGET_SIZE_MINIMUM_URL =
	"https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html";
const TARGET_SIZE_ENHANCED_URL =
	"https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html";
const RESIZE_TEXT_URL = "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html";

const LEVEL_AWARE_CITATIONS: Record<
	Extract<IssueType, "CONTRAST" | "TOUCH_TARGET_SIZE" | "TOUCH_TARGET_SPACING">,
	Record<TargetLevel, WcagCitation>
> = {
	CONTRAST: {
		AA: {
			exact: true,
			citation: "WCAG 1.4.3 Contrast (Minimum) (AA)",
			url: CONTRAST_MINIMUM_URL,
		},
		AAA: {
			exact: true,
			citation: "WCAG 1.4.6 Contrast (Enhanced) (AAA)",
			url: CONTRAST_ENHANCED_URL,
		},
	},
	TOUCH_TARGET_SIZE: {
		AA: {
			exact: true,
			citation: "WCAG 2.5.8 Target Size (Minimum) (AA)",
			url: TARGET_SIZE_MINIMUM_URL,
		},
		AAA: {
			exact: true,
			citation: "WCAG 2.5.5 Target Size (Enhanced) (AAA)",
			url: TARGET_SIZE_ENHANCED_URL,
		},
	},
	TOUCH_TARGET_SPACING: {
		AA: {
			exact: true,
			citation: "WCAG 2.5.8 Target Size (Minimum) (AA) - spacing exception",
			url: TARGET_SIZE_MINIMUM_URL,
		},
		AAA: {
			exact: true,
			citation: "WCAG 2.5.5 Target Size (Enhanced) (AAA) - spacing exception",
			url: TARGET_SIZE_ENHANCED_URL,
		},
	},
};

const TYPOGRAPHY_CITATION: WcagCitation = {
	exact: false,
	citation: "No exact WCAG SC (readability best practice) - related: WCAG 1.4.4 Resize Text",
	url: RESIZE_TEXT_URL,
};

/**
 * The WCAG success-criterion citation for the given issue type at the given
 * target level, including a link to the official W3C "Understanding" page so
 * a reader can verify it against the primary source rather than take the
 * plugin's word for it. TOUCH_TARGET_SPACING deliberately resolves to the
 * same citation as TOUCH_TARGET_SIZE (see the table above); TYPOGRAPHY has no
 * exact numbered SC and always returns the same level-independent citation.
 */
export default function getWcagCitation(
	issueType: IssueType,
	targetLevel: TargetLevel,
): WcagCitation {
	if (issueType === "TYPOGRAPHY") return TYPOGRAPHY_CITATION;
	return LEVEL_AWARE_CITATIONS[issueType][targetLevel];
}
