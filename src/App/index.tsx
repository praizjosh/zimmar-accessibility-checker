import AccessibilityValidator from "@/components/organisms/AccessibilityValidator";
import IssuesNavigator from "@/components/organisms/IssuesNavigator";
import IssuesOverviewList from "@/components/organisms/IssuesOverviewList";
import TouchTargetNavigator from "@/components/organisms/TouchTargetNavigator";
import { MESSAGE_TYPES } from "@/lib/constants";
import { DetectedIssue, DeviceType, FileScanProgress, ROUTES_LIST, TargetLevel } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function App() {
	const {
		currentRoute,
		hydrateScanSettings,
		setFileScanProgress,
		hydrateFileScanOptionSeen,
		hydratePageCount,
		setDetectedIssues,
		appendDetectedIssues,
		setScanning,
	} = useIssuesStore();

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (!event.data || !event.data.pluginMessage) {
				console.error("Invalid message format:", event.data);
				return;
			}

			const { type, data } = event.data.pluginMessage;

			if (type === MESSAGE_TYPES.LOAD_SCAN_SETTINGS) {
				hydrateScanSettings(data as { deviceType: DeviceType; targetLevel: TargetLevel });
			}

			if (type === MESSAGE_TYPES.SCAN_FILE_PROGRESS) {
				setFileScanProgress(data as FileScanProgress);
			}

			if (type === MESSAGE_TYPES.LOAD_FILE_SCAN_OPTION_SEEN) {
				hydrateFileScanOptionSeen((data as { seen: boolean }).seen);
			}

			if (type === MESSAGE_TYPES.LOAD_PAGE_COUNT) {
				hydratePageCount((data as { pageCount: number }).pageCount);
			}

			// Handled here rather than inside IssuesOverviewList: a scan can
			// keep running in the background while the user is on a different
			// screen entirely (e.g. drilled into an issue's detail view mid
			// file-scan), which unmounts IssuesOverviewList and, with it, any
			// listener it registered. postMessage doesn't replay missed
			// messages, so a listener that only exists while that one screen
			// is mounted can permanently miss SCAN_FILE_COMPLETE and leave
			// `scanning` stuck true forever. App never unmounts, so this is
			// the one place these are guaranteed not to be dropped.
			if (type === MESSAGE_TYPES.LOAD_ISSUES) {
				setDetectedIssues(data as DetectedIssue[]);
				setScanning(false);
				setFileScanProgress(null);
			}

			if (type === MESSAGE_TYPES.SCAN_FILE_PAGE_ISSUES) {
				appendDetectedIssues(data as DetectedIssue[]);
			}

			if (type === MESSAGE_TYPES.SCAN_FILE_COMPLETE) {
				setScanning(false);
				setFileScanProgress(null);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [
		hydrateScanSettings,
		setFileScanProgress,
		hydrateFileScanOptionSeen,
		hydratePageCount,
		setDetectedIssues,
		appendDetectedIssues,
		setScanning,
	]);

	const RoutesMap: ROUTES_LIST = {
		INDEX: <AccessibilityValidator />,
		ISSUE_OVERVIEW_LIST_VIEW: <IssuesOverviewList />,
		ISSUE_LIST_VIEW: <IssuesNavigator />,
		TOUCH_TARGET_ISSUE_LIST_VIEW: <TouchTargetNavigator />,
	};

	return (
		<div
			className={cn("mx-auto grid size-full max-w-3xl items-center p-4", {
				"mb-6!": currentRoute === "ISSUE_OVERVIEW_LIST_VIEW",
			})}
		>
			<div className="container flex size-full flex-col items-center">
				{RoutesMap[currentRoute]}
			</div>
		</div>
	);
}
