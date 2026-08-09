import InfoPopover from "@/components/organisms/InfoPopover";
import IssueBreakdownChart from "@/components/organisms/IssueBreakdownChart";
import IssueListRow from "@/components/organisms/IssueListRow";
import LoadingScreen from "@/components/organisms/LoadingScreen";
import ScanSettingsReadout from "@/components/organisms/ScanSettingsReadout";
import ScreenHeader from "@/components/organisms/ScreenHeader";
import TargetLevelToggle from "@/components/organisms/TargetLevelToggle";
import { Button } from "@/components/ui/button";
import Separator from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ISSUES_TYPES, MESSAGE_TYPES } from "@/lib/constants";
import ISSUE_TYPE_LABELS from "@/lib/issueTypeLabels";
import ISSUES_DATA_SCHEMA from "@/lib/issuesData";
import { IssueType, DetectedIssue } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import {
	cn,
	getContrastIssueDescription,
	getRouteForIssueType,
	getSeverityStyles,
	isActiveIssue,
} from "@/lib/utils";
import { saveAs } from "file-saver";
import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function IssuesOverviewList() {
	const {
		scanning,
		detectedIssues,
		setDetectedIssues,
		setScanning,
		setSelectedType,
		navigateTo,
		rescanIssues,
		targetLevel,
		setTargetLevel,
		deviceType,
		fileScanProgress,
		fileScanCancelled,
		cancelFileScan,
		setFileScanProgress,
		pageScanCancelled,
		cancelPageScan,
	} = useIssuesStore();

	const issuesGroupListRecords = detectedIssues.filter((issue) => {
		if (!issue.type || !ISSUES_TYPES.includes(issue.type)) return false;
		return isActiveIssue(issue, targetLevel);
	});

	const hasContrastIssues = detectedIssues.some((issue) => issue.type === "CONTRAST");

	// Listen for messages from the backend
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (!event.data || !event.data.pluginMessage) {
				console.error("Invalid message format:", event.data);
				return;
			}

			const { type, data } = event.data.pluginMessage;

			if (type === MESSAGE_TYPES.LOAD_ISSUES) {
				setDetectedIssues(data);
				setScanning(false);
				setFileScanProgress(null);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [setDetectedIssues, setScanning, setFileScanProgress]);

	const handleIssuesListClick = (type: IssueType) => {
		setSelectedType(type);
		navigateTo(getRouteForIssueType(type));
	};

	const issuesGroup = ISSUES_DATA_SCHEMA.filter((issue) =>
		detectedIssues?.some((i: DetectedIssue) => i.type === issue.type),
	);

	const breakdownItems = issuesGroup
		.map((issue) => ({
			type: issue.type as IssueType,
			count: issuesGroupListRecords.filter((i) => i.type === issue.type).length,
		}))
		.filter((item) => item.count > 0);

	const formatIssuesForReport = () => {
		return issuesGroupListRecords.map((issue) => {
			const elementName =
				issue.nodeData?.nodeType === "TEXT"
					? issue.nodeData?.characters
					: issue.nodeData?.name;

			const description =
				issue.type === "CONTRAST"
					? getContrastIssueDescription(
							issue.nodeData.contrastScore?.compliance,
							targetLevel,
						)
					: issue.description;

			return {
				elementType: issue.nodeData?.nodeType || "N/A",
				elementName: elementName || "N/A",
				description,
				severity: issue.severity,
				type: (issue.type && ISSUE_TYPE_LABELS[issue.type]) || issue.type,
				wcagContrastScore: issue.nodeData?.contrastScore?.compliance || "N/A",
				contrastRatio: issue.nodeData?.contrastScore?.ratio.toFixed(2) || "N/A",
				fontSize: issue.nodeData?.fontSize || "N/A",
			};
		});
	};

	const generateCSV = () => {
		const formattedIssues = formatIssuesForReport();
		const csvHeader =
			"Element Type,Element Name,Issue Type,Description,Severity,WCAG Contrast Score, WCAG Contrast Ratio,Font Size";

		const csvRows = formattedIssues.map((issue) => {
			return [
				`"${issue.elementType || "N/A"}"`, // Element Type
				`"${issue.elementName}"`, // Element Name
				`"${issue.type || "N/A"}"`, // Issue Type
				`"${issue.description || ""}"`, // Description
				`"${issue.severity || "N/A"}"`, // Severity
				`"${issue.wcagContrastScore || "N/A"}"`, // WCAG Score
				`"${issue.contrastRatio || "N/A"}"`, // Contrast ratio
				`"${issue.fontSize || "N/A"}"`, // Font Size
			].join(",");
		});

		// Join the header and rows to form the CSV content
		const csvContent = [csvHeader, ...csvRows].join("\n");

		const csvBlob = new Blob([csvContent], { type: "text/csv" });

		saveAs(csvBlob, "accessibility-issues-report.csv");
	};

	const generateJSON = () => {
		const formattedIssues = formatIssuesForReport();
		const jsonBlob = new Blob([JSON.stringify(formattedIssues, null, 2)], {
			type: "application/json",
		});
		saveAs(jsonBlob, "accessibility-issues-report.json");
	};

	return (
		<div className="flex size-full flex-col">
			<div className="grid">
				<ScreenHeader
					onBack={() => {
						navigateTo("INDEX");
						setDetectedIssues([]);
					}}
					disabled={scanning}
				>
					<div className="inline-flex items-center">
						{!scanning && (
							<Button
								title="Rescan for issues"
								variant="nude"
								size={"icon"}
								className="group me-2 w-fit!"
								onClick={() => rescanIssues()}
							>
								<RefreshCcw
									strokeWidth={1.5}
									aria-hidden="true"
									className="size-5! cursor-pointer text-green-500 transition-transform duration-300 ease-in-out group-hover:-rotate-180"
								/>
							</Button>
						)}

						<span className="font-medium tracking-wide capitalize">Scan Results</span>
					</div>
				</ScreenHeader>

				<ScanSettingsReadout
					targetLevel={targetLevel}
					deviceType={deviceType}
					className="mb-2"
				/>

				<Separator className="my-2 h-px bg-rose-50/10!" />
			</div>

			{!scanning ? (
				<div className="flex size-full flex-col">
					{(fileScanCancelled || pageScanCancelled) && (
						<p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
							Scan cancelled - showing results collected before you cancelled.
						</p>
					)}

					{hasContrastIssues && (
						<TargetLevelToggle
							value={targetLevel}
							onChange={setTargetLevel}
							label={
								<span className="text-sm font-medium text-grey">WCAG target</span>
							}
						/>
					)}

					<Tabs defaultValue="issues">
						<TabsList className="mt-2 mb-4 flex space-x-4 bg-dark-shade py-6!">
							<TabsTrigger value="issues">Issues</TabsTrigger>
							<TabsTrigger value="report">Report</TabsTrigger>
						</TabsList>

						<TabsContent value="issues">
							<div
								className={`flex items-center ${detectedIssues.length > 0 ? "mb-1" : "mb-4"}`}
							>
								<h3 className="text-base font-medium tracking-wide text-grey">
									Identified Issues
								</h3>

								{deviceType === "pointer" && (
									<InfoPopover
										title="Touch Target Checks Skipped"
										content="Touch target checks are skipped while designing for Pointer - there's no WCAG-defined minimum touch target size for desktop/mouse-driven interfaces."
										align="center"
									/>
								)}
							</div>

							{issuesGroupListRecords.length > 0 && (
								<p className="mb-4 font-open-sans text-sm">
									There are {issuesGroupListRecords.length} issues detected on
									this screen.
								</p>
							)}

							{issuesGroup.length > 0 ? (
								<ul className="space-y-2 last:mb-5!">
									{issuesGroup.map((issue) => {
										const issueCount = issuesGroupListRecords.filter(
											(i: DetectedIssue) => i.type === issue.type,
										).length;

										// Skip rendering if the issueCount is zero
										if (issueCount === 0) return null;

										const label = ISSUE_TYPE_LABELS[issue.type as IssueType];

										return (
											<IssueListRow
												key={issue.id}
												title={`View all ${label} issues`}
												ariaLabel={label}
												description={issue.description}
												onClick={() =>
													handleIssuesListClick(issue.type as IssueType)
												}
												leading={
													<>
														{issue.icon}
														<span className="group-hover:text-accent">
															{label}
														</span>
													</>
												}
												trailing={
													<>
														<span
															className={cn(
																"rounded px-1.5 py-0.5 text-xs tracking-wide",
																getSeverityStyles(issue.severity, {
																	isBadge: true,
																}),
															)}
														>
															{issueCount}
														</span>
														<span
															className={cn(
																"text-xs capitalize!",
																getSeverityStyles(issue.severity),
															)}
														>
															{issue.severity}
														</span>
													</>
												}
											/>
										);
									})}
								</ul>
							) : (
								<p className="w-full text-left font-semibold text-grey">
									No issues found
								</p>
							)}
						</TabsContent>

						<TabsContent value="report">
							<h3 className="mb-2 text-lg font-medium tracking-wide text-grey">
								Export Report
							</h3>
							<p className="mb-4 text-sm">
								Generate a detailed report of all identified issues and suggestions.
							</p>

							{breakdownItems.length > 0 && (
								<div className="mb-5 rounded-xl bg-dark-shade p-4">
									<h4 className="mb-3 text-sm font-medium text-grey">
										Issues by category
									</h4>
									<IssueBreakdownChart items={breakdownItems} />
								</div>
							)}

							<div className="space-x-3">
								<Button
									title="Download CSV Report"
									variant="default"
									onClick={generateCSV}
								>
									Download CSV
								</Button>
								<Button
									title="Download JSON Report"
									variant="default"
									onClick={generateJSON}
								>
									Download JSON
								</Button>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			) : fileScanProgress ? (
				<LoadingScreen
					message={`Scanning page ${fileScanProgress.pageIndex} of ${fileScanProgress.pageCount}: ${fileScanProgress.pageName}`}
				>
					<Button
						title="Cancel scan"
						variant="ghost"
						className="mt-4 border border-rose-50/10"
						onClick={cancelFileScan}
					>
						Cancel
					</Button>
				</LoadingScreen>
			) : (
				<LoadingScreen message="Scanning for issues...">
					<Button
						title="Cancel scan"
						variant="ghost"
						className="mt-4 border border-rose-50/10"
						onClick={cancelPageScan}
					>
						Cancel
					</Button>
				</LoadingScreen>
			)}
		</div>
	);
}
