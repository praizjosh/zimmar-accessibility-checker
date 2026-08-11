import { saveAs } from "file-saver";
import ISSUE_TYPE_LABELS from "@/lib/issueTypeLabels";
import { DetectedIssue, Severity, TargetLevel } from "@/lib/types";
import { contrastMethodsDisagree, getContrastIssueDescription } from "@/lib/utils";
import getWcagCitation from "@/lib/wcagCitations";

export type FormattedIssue = {
	elementType: NodeType | NodeType[] | "N/A";
	elementName: string;
	description: string | undefined;
	severity: Severity;
	type: string | undefined;
	wcagCitation: string;
	wcagCitationUrl: string;
	wcagContrastScore: string;
	contrastRatio: string;
	apcaLc: number | "N/A";
	apcaMeetsMinimum: "Pass" | "Fail" | "N/A";
	wcagApcaDisagree: "Yes" | "No" | "N/A";
	fontSize: number | "N/A";
};

/**
 * Shapes detected issues into the flat record used by all three report
 * exports (CSV/JSON/Markdown) - computed at export time (not baked into the
 * issue at scan time) so contrast target-level filtering and WCAG citations
 * always reflect whichever target level is currently selected.
 */
export function formatIssuesForReport(
	issues: DetectedIssue[],
	targetLevel: TargetLevel,
): FormattedIssue[] {
	return issues.map((issue) => {
		const elementName =
			issue.nodeData?.nodeType === "TEXT" ? issue.nodeData?.characters : issue.nodeData?.name;

		const description =
			issue.type === "CONTRAST"
				? getContrastIssueDescription(issue.nodeData.contrastScore?.compliance, targetLevel)
				: issue.description;

		return {
			elementType: issue.nodeData?.nodeType || "N/A",
			elementName: elementName || "N/A",
			description,
			severity: issue.severity,
			type: (issue.type && ISSUE_TYPE_LABELS[issue.type]) || issue.type,
			wcagCitation: issue.type ? getWcagCitation(issue.type, targetLevel).citation : "N/A",
			wcagCitationUrl: issue.type ? getWcagCitation(issue.type, targetLevel).url : "N/A",
			wcagContrastScore: issue.nodeData?.contrastScore?.compliance || "N/A",
			contrastRatio: issue.nodeData?.contrastScore?.ratio.toFixed(2) || "N/A",
			apcaLc: issue.nodeData?.apcaScore
				? Math.round(Math.abs(issue.nodeData.apcaScore.lc))
				: "N/A",
			apcaMeetsMinimum: issue.nodeData?.apcaScore
				? issue.nodeData.apcaScore.meetsMinimum
					? "Pass"
					: "Fail"
				: "N/A",
			wcagApcaDisagree: issue.nodeData?.apcaScore
				? contrastMethodsDisagree(
						issue.nodeData.contrastScore?.compliance,
						targetLevel,
						issue.nodeData.apcaScore.meetsMinimum,
					)
					? "Yes"
					: "No"
				: "N/A",
			fontSize: issue.nodeData?.fontSize || "N/A",
		};
	});
}

export function generateCSVReport(formattedIssues: FormattedIssue[]): void {
	const csvHeader =
		"Element Type,Element Name,Issue Type,WCAG SC Citation,WCAG SC URL,Description,Severity,WCAG Contrast Score, WCAG Contrast Ratio,APCA Lc,APCA Meets Minimum,WCAG/APCA Disagree,Font Size";

	const csvRows = formattedIssues.map((issue) => {
		return [
			`"${issue.elementType || "N/A"}"`, // Element Type
			`"${issue.elementName}"`, // Element Name
			`"${issue.type || "N/A"}"`, // Issue Type
			`"${issue.wcagCitation || "N/A"}"`, // WCAG SC Citation
			`"${issue.wcagCitationUrl || "N/A"}"`, // WCAG SC URL
			`"${issue.description || ""}"`, // Description
			`"${issue.severity || "N/A"}"`, // Severity
			`"${issue.wcagContrastScore || "N/A"}"`, // WCAG Score
			`"${issue.contrastRatio || "N/A"}"`, // Contrast ratio
			`"${issue.apcaLc}"`, // APCA Lc
			`"${issue.apcaMeetsMinimum}"`, // APCA Meets Minimum
			`"${issue.wcagApcaDisagree}"`, // WCAG/APCA Disagree
			`"${issue.fontSize || "N/A"}"`, // Font Size
		].join(",");
	});

	const csvContent = [csvHeader, ...csvRows].join("\n");
	const csvBlob = new Blob([csvContent], { type: "text/csv" });

	saveAs(csvBlob, "accessibility-issues-report.csv");
}

export function generateJSONReport(formattedIssues: FormattedIssue[]): void {
	const jsonBlob = new Blob([JSON.stringify(formattedIssues, null, 2)], {
		type: "application/json",
	});
	saveAs(jsonBlob, "accessibility-issues-report.json");
}

export function generateMarkdownReport(
	formattedIssues: FormattedIssue[],
	isFileScan: boolean,
): void {
	const scope = isFileScan ? "across this file" : "on this page";
	const generatedOn = new Date().toLocaleDateString("en-GB");
	const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

	const severityOrder: Severity[] = ["critical", "major", "minor"];
	const bySeverity = severityOrder.map((severity) => ({
		severity,
		issues: formattedIssues.filter((issue) => issue.severity === severity),
	}));

	const lines: string[] = [
		"# Accessibility Issues Report",
		"",
		`Generated ${generatedOn} - ${formattedIssues.length} issue${formattedIssues.length === 1 ? "" : "s"} detected ${scope}.`,
		"",
		"## Summary",
		"",
		"| Severity | Count |",
		"|---|---|",
		...bySeverity.map(
			({ severity, issues }) => `| ${capitalize(severity)} | ${issues.length} |`,
		),
		"",
	];

	bySeverity.forEach(({ severity, issues }) => {
		if (issues.length === 0) return;

		lines.push(`## ${capitalize(severity)}`, "");

		issues.forEach((issue, index) => {
			lines.push(`### ${index + 1}. ${issue.type} - ${issue.elementName}`, "");
			lines.push(`- **Element type:** ${issue.elementType}`);

			const citationText =
				issue.wcagCitationUrl !== "N/A"
					? `[${issue.wcagCitation}](${issue.wcagCitationUrl})`
					: issue.wcagCitation;
			lines.push(`- **WCAG citation:** ${citationText}`);

			lines.push(`- **Description:** ${issue.description}`);

			if (issue.wcagContrastScore !== "N/A") {
				lines.push(
					`- **WCAG contrast score:** ${issue.wcagContrastScore} (ratio ${issue.contrastRatio}:1)`,
				);
			}
			if (issue.apcaLc !== "N/A") {
				lines.push(
					`- **APCA:** Lc ${issue.apcaLc} (${issue.apcaMeetsMinimum}) - WCAG/APCA disagree: ${issue.wcagApcaDisagree}`,
				);
			}
			if (issue.fontSize !== "N/A") {
				lines.push(`- **Font size:** ${issue.fontSize}px`);
			}

			lines.push("");
		});
	});

	const markdownBlob = new Blob([lines.join("\n")], { type: "text/markdown" });
	saveAs(markdownBlob, "accessibility-issues-report.md");
}
