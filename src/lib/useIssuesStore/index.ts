import { create } from "zustand";
import { MESSAGE_TYPES } from "../constants";
import { postMessageToBackend } from "../figmaUtils";
import {
	DeviceType,
	EnhancedIssuesStore,
	IssueType,
	DetectedIssue,
	Routes,
	TargetLevel,
} from "../types";
import { isActiveIssue } from "../utils";

const useIssuesStore = create<EnhancedIssuesStore>((set, get) => ({
	detectedIssues: [],
	singleIssue: null,
	selectionIssues: [],
	currentIssueIndex: 0,
	currentRoute: "INDEX", // Default route
	selectedType: "",
	scanning: false,
	targetLevel: "AA",
	deviceType: "touch",
	fileScanProgress: null,
	isFileScan: false,
	fileScanCancelled: false,
	pageScanCancelled: false,
	hasSeenFileScanOption: false,
	pageCount: 1,
	setScanning: (isScanning) =>
		set({
			scanning: isScanning,
		}),
	startScan: () => {
		const { setScanning, navigateTo, deviceType, targetLevel } = get();
		setScanning(true);
		// Clears cancelled flags left over from a previous scan - e.g. "Rescan"
		// after cancelling a file scan runs a plain single-page scan, which
		// shouldn't inherit the earlier cancellation's "partial results" banner.
		set({ fileScanCancelled: false, pageScanCancelled: false, isFileScan: false });
		postMessageToBackend(MESSAGE_TYPES.SCAN, { deviceType, targetLevel });
		navigateTo("ISSUE_OVERVIEW_LIST_VIEW");
	},
	startFileScan: () => {
		const { setScanning, setDetectedIssues, navigateTo, deviceType, targetLevel } = get();
		// Clears any leftover issues from a previous scan - unlike rescanIssues
		// (which does this before starting a plain scan), a file scan streams
		// issues in progressively, so a stale array here would sit underneath
		// the first streamed-in chunk instead of being replaced by it.
		setDetectedIssues([]);
		setScanning(true);
		set({
			fileScanProgress: null,
			fileScanCancelled: false,
			pageScanCancelled: false,
			isFileScan: true,
		});
		postMessageToBackend(MESSAGE_TYPES.SCAN_FILE, { deviceType, targetLevel });
		navigateTo("ISSUE_OVERVIEW_LIST_VIEW");
	},
	cancelFileScan: () => {
		set({ fileScanCancelled: true });
		postMessageToBackend(MESSAGE_TYPES.CANCEL_SCAN_FILE);
	},
	cancelPageScan: () => {
		set({ pageScanCancelled: true });
		postMessageToBackend(MESSAGE_TYPES.CANCEL_SCAN);
	},
	markFileScanOptionSeen: () => {
		const { hasSeenFileScanOption } = get();
		if (hasSeenFileScanOption) return;
		set({ hasSeenFileScanOption: true });
		postMessageToBackend(MESSAGE_TYPES.MARK_FILE_SCAN_OPTION_SEEN);
	},
	hydrateFileScanOptionSeen: (seen: boolean) => set({ hasSeenFileScanOption: seen }),
	hydratePageCount: (count: number) => set({ pageCount: count }),
	setFileScanProgress: (progress) => set({ fileScanProgress: progress }),
	setSingleIssue: (newIssue) => set({ singleIssue: newIssue }),
	setSelectionIssues: (issues) => set({ selectionIssues: issues }),
	setDetectedIssues: (newIssues: DetectedIssue[]) => {
		set({ detectedIssues: newIssues });
	},
	appendDetectedIssues: (newIssues: DetectedIssue[]) => {
		set((state) => ({ detectedIssues: [...state.detectedIssues, ...newIssues] }));
	},
	setSelectedType: (type: IssueType) => set({ selectedType: type }),
	setTargetLevel: (level: TargetLevel) => {
		const { deviceType } = get();
		set({ targetLevel: level });
		postMessageToBackend(MESSAGE_TYPES.SAVE_SCAN_SETTINGS, {
			deviceType,
			targetLevel: level,
		});
	},
	setDeviceType: (device: DeviceType) => {
		const { targetLevel } = get();
		set({ deviceType: device });
		postMessageToBackend(MESSAGE_TYPES.SAVE_SCAN_SETTINGS, {
			deviceType: device,
			targetLevel,
		});
	},
	hydrateScanSettings: (settings: { deviceType: DeviceType; targetLevel: TargetLevel }) =>
		set(settings),
	getIssueGroupList: () => {
		const { detectedIssues, selectedType, targetLevel } = get();

		const response = detectedIssues.filter(
			(issue) => issue.type === selectedType && isActiveIssue(issue, targetLevel),
		);

		return response;
	},
	updateIssue: (id: string, updates: Partial<DetectedIssue>) => {
		set((state) => ({
			detectedIssues: state.detectedIssues.map((issue) =>
				issue.nodeData.id === id ? { ...issue, ...updates } : issue,
			),
		}));
	},
	setCurrentIssueIndex: (index) => set({ currentIssueIndex: index }),
	navigateToIssue: (index) => {
		const { getIssueGroupList } = get();
		const issueGroupList = getIssueGroupList();

		if (index >= 0 && index < issueGroupList.length) {
			postMessageToBackend(MESSAGE_TYPES.NAVIGATE, {
				id: issueGroupList[index].nodeData.id,
				pageId: issueGroupList[index].nodeData.pageId,
			});
			set({ currentIssueIndex: index });
		}
	},
	navigateTo: (route: Routes) => {
		set({ currentRoute: route });
	},
	rescanIssues: () => {
		const { startScan, setDetectedIssues } = get();
		setDetectedIssues([]);
		startScan();
	},
}));

export default useIssuesStore;
