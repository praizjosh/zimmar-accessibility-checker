import IssueDetailRow from "@/components/organisms/IssueDetailRow";
import IssuesWrapper from "@/components/organisms/IssuesWrapper";
import { MIN_TOUCH_TARGET_SIZE_AAA } from "@/lib/constants";
import useIssuesStore from "@/lib/useIssuesStore";
import { cn, getSeverityStyles } from "@/lib/utils";
import { Check, MoveHorizontal, OctagonAlert, Ruler, Target, X } from "lucide-react";

export default function TouchTargetNavigator() {
	const { currentIssueIndex, singleIssue, selectedType, getIssueGroupList } = useIssuesStore();

	const issueGroupList = getIssueGroupList();
	const currentIssue = issueGroupList[currentIssueIndex] ?? {};

	const renderIssueDetails = (issue: typeof singleIssue | null) => {
		if (!issue) {
			return (
				<p className="px-3 font-open-sans text-lg font-medium text-grey">
					No {selectedType} issue detected.
				</p>
			);
		}

		const { type, severity } = issue;
		const { characters, width, height, name, requiredSize, requiredSizePx } =
			issue?.nodeData ?? {};
		// requiredSizePx is the actual threshold this node was checked against
		// at detection time (24 for AA, 44 for AAA) - falls back to the AAA
		// value only for older stored issues that predate this field existing.
		const minSize = requiredSizePx ?? MIN_TOUCH_TARGET_SIZE_AAA;
		const isWidthFail = (width ?? 0) < minSize;
		const isHeightFail = (height ?? 0) < minSize;

		return (
			<div className="relative flex w-full flex-col space-y-1 divide-y divide-rose-50/5 rounded-xl border border-rose-50/10 bg-dark-shade p-4 font-medium">
				<IssueDetailRow
					icon={<Target aria-hidden="true" className="mr-3 size-5" />}
					label="Element:"
					value={
						<span
							title={characters ?? name}
							className="w-full max-w-44 truncate text-right font-mono text-sm"
						>
							{characters ?? name}
						</span>
					}
				/>

				<IssueDetailRow
					icon={
						!isWidthFail && !isHeightFail ? (
							<Check
								aria-hidden="true"
								className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade"
							/>
						) : (
							<X
								aria-hidden="true"
								className={cn(getSeverityStyles(severity, { isIcon: true }))}
							/>
						)
					}
					tooltip={`Touch targets should be at least ${minSize}x${minSize} pixels to ensure they are easily tappable on mobile devices.`}
					label={
						<span
							className={cn(
								"text-sm",
								type === "TOUCH_TARGET_SIZE" &&
									getSeverityStyles(severity, {
										isBold: isWidthFail || isHeightFail,
									}),
							)}
						>
							Current size:
						</span>
					}
					value={
						<div className="ml-2.5 inline-flex gap-x-1 text-base">
							<span
								className={cn(
									{ "text-[#ffffffde]!": !isWidthFail },
									getSeverityStyles(severity, {
										isBold: isWidthFail,
									}),
								)}
							>
								{width?.toFixed(1)}
							</span>
							<span>x</span>
							<span
								className={cn(
									{ "text-[#ffffffde]!": !isHeightFail },
									getSeverityStyles(severity, {
										isBold: isHeightFail,
									}),
								)}
							>
								{height?.toFixed(1)}px
							</span>
						</div>
					}
				/>

				<IssueDetailRow
					icon={<Ruler aria-hidden="true" className="mr-3 size-5" />}
					label="Required size:"
					value={<span className="text-base">{requiredSize}</span>}
				/>

				{selectedType === "TOUCH_TARGET_SPACING" && (
					<IssueDetailRow
						icon={
							<MoveHorizontal
								aria-hidden="true"
								className={cn(getSeverityStyles(severity, { isIcon: true }))}
							/>
						}
						label={
							<span
								className={cn(
									"text-sm",
									getSeverityStyles(severity, { isBold: true }),
								)}
							>
								Element spacing:
							</span>
						}
						value={
							<span
								className={`text-base ${getSeverityStyles(severity, { isBold: true })}`}
							>
								Fail
							</span>
						}
					/>
				)}

				<IssueDetailRow
					icon={<OctagonAlert aria-hidden="true" className="mr-3 size-5" />}
					label="Severity:"
					value={
						<span
							className={cn(
								"text-base capitalize",
								getSeverityStyles(severity, { isBold: true }),
							)}
						>
							{severity}
						</span>
					}
				/>
			</div>
		);
	};

	return (
		<IssuesWrapper>
			{issueGroupList.length === 0
				? renderIssueDetails(singleIssue)
				: renderIssueDetails(currentIssue)}
		</IssuesWrapper>
	);
}
