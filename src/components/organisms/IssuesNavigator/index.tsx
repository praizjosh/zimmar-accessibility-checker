import ContrastFixSuggester from "@/components/organisms/ContrastFixSuggester";
import IssueDetailRow from "@/components/organisms/IssueDetailRow";
import IssuesWrapper from "@/components/organisms/IssuesWrapper";
import Input from "@/components/ui/input";
import { ColorFixDirection, ColorFixSuggestion, suggestAccessibleColor } from "@/lib/colorFix";
import { MESSAGE_TYPES, MIN_FONT_SIZE } from "@/lib/constants";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { DetectedIssue, TargetLevel } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import {
	cn,
	contrastFailsTargetLevel,
	figmaRGBtoHex,
	getContrastCompliance,
	getSeverityStyles,
} from "@/lib/utils";
import { CaseSensitive, Check, OctagonAlert, Palette, X } from "lucide-react";
import { useState } from "react";

export default function IssuesNavigator() {
	const {
		currentIssueIndex,
		singleIssue,
		selectedType,
		updateIssue,
		getIssueGroupList,
		setSingleIssue,
		targetLevel: detectionTargetLevel,
	} = useIssuesStore();
	// Independent from detectionTargetLevel above once mounted - the
	// fix-suggester's own "what should my suggested fix aim for" choice can
	// be adjusted freely afterward via its own toggle - but it *initializes*
	// from detectionTargetLevel rather than hardcoding "AA", since that's the
	// level that actually got this issue flagged. Hardcoding "AA" here meant
	// an issue only failing at AAA (detectionTargetLevel === "AAA") would
	// open showing "no AA-compliant suggestion found" - true but useless,
	// since the pair already passes AA; the level a fix should target is the
	// one the user was told is failing, not always the least strict one.
	const [targetLevel, setTargetLevel] = useState<TargetLevel>(detectionTargetLevel);

	const issueGroupList: DetectedIssue[] = getIssueGroupList();
	const currentIssue: DetectedIssue = issueGroupList[currentIssueIndex] ?? {};

	const handleFontSizeChange = (id: string, value: string, isSingleIssue: boolean = false) => {
		const newSize = Number(value);
		if (newSize >= 0) {
			const payload = { id, fontSize: newSize };

			if (isSingleIssue && singleIssue) {
				setSingleIssue({
					...singleIssue,
					nodeData: { ...singleIssue.nodeData, fontSize: newSize },
				});
			} else {
				updateIssue(id, {
					nodeData: { ...currentIssue.nodeData, fontSize: newSize },
				});
			}

			postMessageToBackend(MESSAGE_TYPES.UPDATE_FONT_SIZE, payload);
		}
	};

	const renderIssueDetails = (issue: typeof singleIssue | null) => {
		if (!issue) {
			return (
				<p className="px-3 font-open-sans text-lg font-medium text-grey">
					No {selectedType} issue detected.
				</p>
			);
		}

		const { type, severity } = issue;
		const {
			characters,
			fontSize,
			contrastScore,
			id,
			foregroundColor,
			backgroundColor,
			backgroundNodeId,
			backgroundNodeName,
			backgroundSharedWithCount,
			isBold,
		} = issue.nodeData ?? {};
		const getFontSize = () => fontSize ?? singleIssue?.nodeData?.fontSize ?? 0;
		const fontSizeIsValid = getFontSize() >= MIN_FONT_SIZE;

		const isContrastFail =
			type === "CONTRAST" &&
			contrastFailsTargetLevel(contrastScore?.compliance, detectionTargetLevel);
		const foregroundSuggestion =
			isContrastFail && foregroundColor && backgroundColor
				? suggestAccessibleColor(
						foregroundColor,
						backgroundColor,
						getFontSize(),
						Boolean(isBold),
						targetLevel,
						"foreground",
					)
				: null;
		const backgroundSuggestion =
			isContrastFail && foregroundColor && backgroundColor
				? suggestAccessibleColor(
						foregroundColor,
						backgroundColor,
						getFontSize(),
						Boolean(isBold),
						targetLevel,
						"background",
					)
				: null;

		const getTargetNodeId = (direction: ColorFixDirection): string | undefined => {
			const textNodeId = singleIssue?.nodeData.id || id || "";
			return direction === "foreground" ? textNodeId : backgroundNodeId;
		};

		const handleSelectSwatchNode = (direction: ColorFixDirection) => {
			const targetNodeId = getTargetNodeId(direction);
			if (!targetNodeId) return;

			postMessageToBackend(MESSAGE_TYPES.NAVIGATE, { id: targetNodeId });
		};

		const handleApplyColorSuggestion = (
			direction: ColorFixDirection,
			suggestion: ColorFixSuggestion,
		) => {
			const targetNodeId = getTargetNodeId(direction);
			if (!targetNodeId) return;

			const updatedForeground =
				direction === "foreground" ? suggestion.color : foregroundColor;
			const updatedBackground =
				direction === "background" ? suggestion.color : backgroundColor;
			const newContrastScore =
				updatedForeground && updatedBackground
					? getContrastCompliance(
							updatedForeground,
							updatedBackground,
							getFontSize(),
							Boolean(isBold),
						)
					: contrastScore;

			const nodeDataUpdates =
				direction === "foreground"
					? {
							foregroundColor: suggestion.color,
							contrastScore: newContrastScore,
						}
					: {
							backgroundColor: suggestion.color,
							contrastScore: newContrastScore,
						};

			if (singleIssue) {
				setSingleIssue({
					...singleIssue,
					nodeData: { ...singleIssue.nodeData, ...nodeDataUpdates },
				});
			} else {
				updateIssue(id || "", {
					nodeData: { ...currentIssue.nodeData, ...nodeDataUpdates },
				});
			}

			postMessageToBackend(MESSAGE_TYPES.UPDATE_FILL_COLOR, {
				nodeId: targetNodeId,
				color: suggestion.color,
			});

			if (direction === "background" && backgroundNodeName) {
				postMessageToBackend(MESSAGE_TYPES.NOTIFY, {
					message: `Updated background fill on "${backgroundNodeName}"`,
				});
			}
		};

		return (
			<>
				<div className="relative flex w-full flex-col space-y-1 divide-y divide-rose-50/5 rounded-xl border border-rose-50/10 bg-dark-shade p-4 font-medium">
					<IssueDetailRow
						icon={<CaseSensitive aria-hidden="true" className="mr-3 size-5" />}
						label="Text:"
						value={
							<span
								title={characters}
								className="line-clamp-1 w-full max-w-[10.938rem] text-right font-mono"
							>
								{characters}
							</span>
						}
					/>

					<IssueDetailRow
						icon={
							fontSizeIsValid ? (
								<Check
									aria-hidden="true"
									className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade"
								/>
							) : (
								<X
									aria-hidden="true"
									className={cn(
										"mr-3 size-5 rounded-full p-1",
										(!fontSizeIsValid && severity === "major") ||
											(!fontSizeIsValid && severity === "critical")
											? "bg-orange-500 text-dark-shade"
											: "bg-rose-600 text-dark-shade",
									)}
								/>
							)
						}
						label={
							<span
								className={cn(
									"text-sm",
									!fontSizeIsValid &&
										type === "CONTRAST" &&
										getSeverityStyles("major", { isBold: true }),
									!fontSizeIsValid &&
										type === "TYPOGRAPHY" &&
										getSeverityStyles(severity, { isBold: true }),
								)}
							>
								Font size:
							</span>
						}
						value={
							<Input
								type="number"
								min={0}
								value={fontSize || ""}
								onInput={(e) =>
									handleFontSizeChange(
										singleIssue?.nodeData.id || id || "",
										e.currentTarget.value,
										Boolean(singleIssue),
									)
								}
								className={cn(
									"ml-2.5 h-full w-fit! max-w-[4.4rem] bg-transparent font-black",
									{
										"text-orange-500":
											(!fontSizeIsValid && severity === "major") ||
											(!fontSizeIsValid && severity === "critical"),
									},
								)}
							/>
						}
						tooltip={
							!fontSizeIsValid &&
							`The text size is below recommended standards for readability. Consider increasing it to at least ${MIN_FONT_SIZE}px to ensure better legibility.`
						}
					/>

					{type === "CONTRAST" && (
						<>
							{foregroundColor && (
								<IssueDetailRow
									icon={<Palette aria-hidden="true" className="mr-3 size-5" />}
									label={<span className="text-sm">Text colour:</span>}
									value={
										<span className="ml-2.5 inline-flex items-center gap-x-2 font-mono text-sm">
											<span
												className="size-4 shrink-0 rounded border border-white/20"
												style={{
													backgroundColor: figmaRGBtoHex(foregroundColor),
												}}
											/>
											{figmaRGBtoHex(foregroundColor)}
										</span>
									}
								/>
							)}

							{backgroundColor && (
								<IssueDetailRow
									icon={<Palette aria-hidden="true" className="mr-3 size-5" />}
									label={<span className="text-sm">Background colour:</span>}
									value={
										<span className="ml-2.5 inline-flex items-center gap-x-2 font-mono text-sm">
											<span
												className="size-4 shrink-0 rounded border border-white/20"
												style={{
													backgroundColor: figmaRGBtoHex(backgroundColor),
												}}
											/>
											{figmaRGBtoHex(backgroundColor)}
										</span>
									}
								/>
							)}

							<IssueDetailRow
								icon={
									isContrastFail ? (
										<X
											aria-hidden="true"
											className={cn(
												getSeverityStyles(severity, { isIcon: true }),
											)}
										/>
									) : (
										<Check
											aria-hidden="true"
											className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade"
										/>
									)
								}
								label={
									<span
										className={cn(
											"text-sm",
											isContrastFail &&
												getSeverityStyles(severity, { isBold: true }),
										)}
									>
										WCAG score:
									</span>
								}
								value={
									<span
										className={cn(
											"ml-2.5 text-base font-bold",
											isContrastFail &&
												getSeverityStyles(severity, { isBold: true }),
										)}
									>
										{contrastScore?.compliance}
									</span>
								}
								tooltip={
									isContrastFail &&
									"The color contrast between the text and the background on this screen is insufficient to meet the enhanced contrast requirements. In some edge cases, the test may fail when the background element is a “GROUP,” “COMPONENT,” or “INSTANCE. Other times, a background couldn't be detected."
								}
							/>

							<IssueDetailRow
								icon={
									isContrastFail ? (
										<X
											aria-hidden="true"
											className={cn(
												getSeverityStyles(severity, { isIcon: true }),
											)}
										/>
									) : (
										<Check
											aria-hidden="true"
											className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade"
										/>
									)
								}
								label={
									<span
										className={cn(
											"text-sm",
											isContrastFail &&
												getSeverityStyles(severity, { isBold: true }),
										)}
									>
										Contrast ratio:
									</span>
								}
								value={
									<span
										className={cn(
											"ml-2.5 text-base font-bold",
											isContrastFail &&
												getSeverityStyles(severity, { isBold: true }),
										)}
									>
										{contrastScore?.ratio.toFixed(2)} : 1
									</span>
								}
							/>
						</>
					)}

					<IssueDetailRow
						label="Severity:"
						value={
							type === "CONTRAST" && !isContrastFail ? (
								<span className="text-base font-bold text-green-500">Pass</span>
							) : (
								<span
									className={cn("text-base font-bold capitalize", {
										"text-rose-600": severity === "critical",
										"text-orange-500": severity === "major",
										"text-amber-500": severity === "minor",
									})}
								>
									{severity}
								</span>
							)
						}
						icon={
							type === "CONTRAST" && !isContrastFail ? (
								<Check
									aria-hidden="true"
									className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade"
								/>
							) : (
								<OctagonAlert aria-hidden="true" className="mr-3 size-5" />
							)
						}
					/>
				</div>

				{isContrastFail && (
					<ContrastFixSuggester
						targetLevel={targetLevel}
						onTargetLevelChange={setTargetLevel}
						foregroundSuggestion={foregroundSuggestion}
						backgroundSuggestion={backgroundSuggestion}
						backgroundSharedWithCount={backgroundSharedWithCount}
						onSelectSwatchNode={handleSelectSwatchNode}
						onApplySuggestion={handleApplyColorSuggestion}
					/>
				)}
			</>
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
