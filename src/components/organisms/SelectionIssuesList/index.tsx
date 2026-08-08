import IssueListRow from "@/components/organisms/IssueListRow";
import { DetectedIssue, TargetLevel } from "@/lib/types";
import { cn, getContrastIssueDescription, getSeverityStyles } from "@/lib/utils";

export type SelectionIssuesListProps = {
	issues: DetectedIssue[];
	targetLevel: TargetLevel;
	onSelectIssue: (issue: DetectedIssue) => void;
};

export default function SelectionIssuesList({
	issues,
	targetLevel,
	onSelectIssue,
}: SelectionIssuesListProps) {
	return (
		<div className="flex w-full flex-col">
			<p className="mb-4 font-open-sans text-sm">
				{issues.length} issues found in this selection.
			</p>

			<ul className="w-full space-y-2 last:mb-5!">
				{issues.map((issue) => {
					const description =
						issue.type === "CONTRAST"
							? getContrastIssueDescription(
									issue.nodeData.contrastScore?.compliance,
									targetLevel,
								)
							: issue.description;

					return (
						<IssueListRow
							key={issue.nodeData.id}
							title={`View ${issue.nodeData.name} issue details`}
							ariaLabel={issue.nodeData.name}
							description={description}
							onClick={() => onSelectIssue(issue)}
							leading={
								<span className="truncate group-hover:text-accent">
									{issue.nodeData.name}
								</span>
							}
							trailing={
								<span
									className={cn(
										"text-xs capitalize!",
										getSeverityStyles(issue.severity),
									)}
								>
									{issue.severity}
								</span>
							}
						/>
					);
				})}
			</ul>
		</div>
	);
}
