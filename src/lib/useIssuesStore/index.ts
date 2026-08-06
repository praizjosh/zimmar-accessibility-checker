import { create } from "zustand";
import { MESSAGE_TYPES } from "../constants";
import { postMessageToBackend } from "../figmaUtils";
import {
  DeviceType,
  EnhancedIssuesStore,
  IssueType,
  IssueX,
  Routes,
  TargetLevel,
} from "../types";
import { contrastFailsTargetLevel } from "../utils";

const useIssuesStore = create<EnhancedIssuesStore>((set, get) => ({
  issues: [],
  singleIssue: null,
  currentIndex: 0,
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
  setIssues: (newIssues: IssueX[]) => {
    set({ issues: newIssues });
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
  hydrateScanSettings: (settings: {
    deviceType: DeviceType;
    targetLevel: TargetLevel;
  }) => set(settings),
  getIssueGroupList: () => {
    const { issues, selectedType, targetLevel } = get();

    const response = issues.filter((issue) => {
      if (issue.type && issue.type === selectedType) {
        if (issue.type === "CONTRAST") {
          return contrastFailsTargetLevel(
            issue.nodeData.contrastScore?.compliance,
            targetLevel,
          );
        }
        return true;
      }
      return false;
    });

    return response;
  },
  updateIssue: (id: string, updates: Partial<IssueX>) => {
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.nodeData.id === id ? { ...issue, ...updates } : issue,
      ),
    }));
  },
  setCurrentIndex: (index: number) => set({ currentIndex: index }),
  navigateToIssue: (index: number) => {
    const { getIssueGroupList } = get();
    const issueGroupList = getIssueGroupList();

    if (index >= 0 && index < issueGroupList.length) {
      postMessageToBackend(MESSAGE_TYPES.NAVIGATE, {
        id: issueGroupList[index].nodeData.id,
      });
      set({ currentIndex: index });
    }
  },
  navigateTo: (route: Routes) => {
    set({ currentRoute: route });
  },
  rescanIssues: () => {
    const { startScan, setIssues } = get();
    setIssues([]); // Clear old issues
    startScan(); // Start a fresh scan
  },
}));

export default useIssuesStore;
