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
	currentIssueIndex: 0,
	currentRoute: "INDEX", // Default route
	selectedType: "",
	scanning: false,
	targetLevel: "AA",
	deviceType: "touch",
	setScanning: (isScanning) =>
		set({
			scanning: isScanning,
		}),
	startScan: () => {
		const { setScanning, navigateTo, deviceType, targetLevel } = get();
		setScanning(true);
		postMessageToBackend(MESSAGE_TYPES.SCAN, { deviceType, targetLevel });
		navigateTo("ISSUE_OVERVIEW_LIST_VIEW");
	},
	setSingleIssue: (newIssue) => set({ singleIssue: newIssue }),
	setDetectedIssues: (newIssues: DetectedIssue[]) => {
		set({ detectedIssues: newIssues });
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
