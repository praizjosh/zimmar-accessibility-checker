import ScanSettingsPopover from "@/components/organisms/ScanSettingsPopover";
import AltTextGenerator from "@/components/organisms/ai-assistants/AltTextGenerator";
import { Button } from "@/components/ui/button";
import { MESSAGE_TYPES } from "@/lib/constants";
import ISSUE_TYPE_LABELS from "@/lib/issueTypeLabels";
import { postMessageToBackend } from "@/lib/figmaUtils";
import ISSUES_DATA_SCHEMA from "@/lib/issuesData";
import { IssueType } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { cn, getRouteForIssueType } from "@/lib/utils";
import { Bot, ChevronRight, Radar } from "lucide-react";
import { useState } from "react";

export default function AccessibilityValidator() {
	const {
		scanning,
		startScan,
		setSelectedType,
		navigateTo,
		targetLevel,
		setTargetLevel,
		deviceType,
		setDeviceType,
	} = useIssuesStore();
	const [isExpanded, setIsExpanded] = useState<boolean>(false);

	const handleIssuesListClick = (type: IssueType) => {
		postMessageToBackend(MESSAGE_TYPES.START_QUICKCHECK, {
			deviceType,
			targetLevel,
		});
		setSelectedType(type);
		navigateTo(getRouteForIssueType(type));
	};

	return (
		<div className="flex size-full flex-col space-y-5">
			<div className="flex gap-2 pt-2">
				<Button
					className="h-full flex-1 bg-accent"
					title="Scan design for accessibility issues"
					onClick={startScan}
					disabled={scanning}
				>
					<Radar aria-hidden="true" />
					<span>Scan entire page</span>
				</Button>

				<ScanSettingsPopover
					targetLevel={targetLevel}
					onTargetLevelChange={setTargetLevel}
					deviceType={deviceType}
					onDeviceTypeChange={setDeviceType}
				/>
			</div>

			<div className="relative m-4">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t border-rose-50/10" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-dark px-5 text-sm text-grey">or scan a layer for</span>
				</div>
			</div>

			<ul className="space-y-2">
				{ISSUES_DATA_SCHEMA.map((issue) => {
					const label = ISSUE_TYPE_LABELS[issue.type as IssueType];

					return (
						<li
							key={issue.id}
							title={`Find ${label} issues`}
							className="group flex items-center justify-between rounded-xl border border-rose-50/10 bg-dark-shade text-grey transition-all duration-200 ease-in-out hover:cursor-pointer hover:ring-1 hover:ring-accent"
						>
							<button
								type="button"
								className="flex w-full flex-col gap-y-2 rounded-xl px-4 py-3.5 text-left text-sm"
								aria-label={label}
								onClick={() => handleIssuesListClick(issue.type as IssueType)}
							>
								<div className="flex w-full items-center justify-between gap-3">
									<div className="flex w-full items-center justify-start space-x-2.5">
										{issue.icon}
										<span className="group-hover:text-accent">
											{label} issues
										</span>
									</div>
									<ChevronRight
										strokeWidth={1.5}
										aria-hidden="true"
										className="size-5 shrink-0 text-rose-50/55 transition-transform delay-100 ease-in-out group-hover:translate-x-1 group-hover:text-accent"
									/>
								</div>
							</button>
						</li>
					);
				})}
			</ul>

			<div className="relative m-4">
				<div className="absolute inset-0 flex items-center">
					<span className="w-full border-t border-rose-50/10" />
				</div>
				<div className="relative flex justify-center">
					<span className="bg-dark px-5 text-sm text-grey">
						<span className="inline-flex items-center gap-2">
							<Bot aria-hidden="true" className="size-4" />
							<h3>AI Assistant Tools</h3>
						</span>
					</span>
				</div>
			</div>

			<AltTextGenerator isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

			<div className="flex size-full flex-col items-center justify-end text-xs text-white/55">
				<p className={cn({ "mb-2.5": isExpanded })}>
					&copy; {new Date().getFullYear()} Zimmar Technologies. All rights reserved.
				</p>
			</div>
		</div>
	);
}
