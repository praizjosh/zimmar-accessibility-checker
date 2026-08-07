import { MIN_FONT_SIZE, MIN_TOUCH_TARGET_SIZE_AAA } from "../constants";
import ISSUE_TYPE_LABELS from "../issueTypeLabels";
import { IssueRecommendations, IssueType, TargetLevel } from "../types";

/**
 * Recommendations that don't depend on which WCAG target level is currently
 * selected - contrast and touch-target-size are handled separately in
 * getIssueRecommendations below, since their required ratio/size changes
 * with the target level.
 */
const ISSUE_RECOMMENDATIONS: IssueRecommendations[] = [
	{
		typography: [
			`Ensure font size is at least ${MIN_FONT_SIZE}px to enhance readability and comply with WCAG "AA" standards.`,
			"Use a minimum font size of 16px for body text and 14px for buttons and other interactive elements.",
		],
	},
	{
		"touch target spacing": [
			"The touch target spacing should be at least 8px to the nearest element in all directions.",
		],
	},
];

/** WCAG 1.4.3/1.4.6 contrast ratio thresholds, keyed by target level. */
const CONTRAST_RATIO_THRESHOLDS: Record<TargetLevel, { normal: number; large: number }> = {
	AA: { normal: 4.5, large: 3 },
	AAA: { normal: 7, large: 4.5 },
};

/**
 * Recommendation copy for the given issue type, target level, and (for
 * touch-target size) the actual required size the flagged node was checked
 * against. Computed here rather than a flat static-by-type lookup because
 * contrast's required ratio and touch-target size's required size both
 * depend on which WCAG level is currently selected - a recommendation that
 * always cited the AA ratio/size was actively wrong advice once AAA was
 * what was actually being checked against (see
 * roadmap/IMPROVEMENT_IDEAS.md's "Issue recommendation/description copy"
 * entry). `requiredSizePx` should come from the specific issue's own
 * `nodeData.requiredSizePx`, which every TOUCH_TARGET_SIZE issue already
 * carries from scan time; falls back to the AAA value if omitted.
 */
export default function getIssueRecommendations(
	issueType: IssueType | "",
	targetLevel: TargetLevel,
	requiredSizePx?: number,
): string[] | null {
	if (!issueType) return null;

	if (issueType === "CONTRAST") {
		const { normal, large } = CONTRAST_RATIO_THRESHOLDS[targetLevel];
		return [
			`Increase the contrast ratio to at least ${normal}:1 for normal text and ${large}:1 for large text (18px and up) to meet WCAG ${targetLevel}.`,
			"To improve contrast, use a darker text color or a lighter background color.",
		];
	}

	if (issueType === "TOUCH_TARGET_SIZE") {
		const minSize = requiredSizePx ?? MIN_TOUCH_TARGET_SIZE_AAA;
		return [
			`Increase the touch target size to at least ${minSize}x${minSize} pixels to ensure better accessibility on mobile devices. Maintain adequate spacing between interactive elements.`,
		];
	}

	const label = ISSUE_TYPE_LABELS[issueType].toLowerCase();
	const entry = ISSUE_RECOMMENDATIONS.find((item) => item[label] !== undefined);
	return entry ? entry[label] : null;
}
