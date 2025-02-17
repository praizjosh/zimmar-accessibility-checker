/* eslint-disable no-console */
import { create } from "zustand";
import { EnhancedIssuesStore, IssueType, IssueX, Routes } from "./types";

const useIssuesStore = create<EnhancedIssuesStore>((set, get) => ({
  issues: [],
  singleIssue: null,
  currentIndex: 0,
  currentRoute: "INDEX", // Default route
  selectedType: "",
  scanning: false,

  setScanning: (isScanning) =>
    set({
      scanning: isScanning,
    }),

  startScan: () => {
    const { setScanning } = get();
    setScanning(true);
    parent.postMessage({ pluginMessage: { type: "scan" } }, "*");
  },

  setSingleIssue: (newIssue) => set({ singleIssue: newIssue }),

  setIssues: (newIssues: IssueX[]) => {
    set({ issues: newIssues });
  },

  setSelectedType: (type: IssueType) => set({ selectedType: type }),

  getIssueGroupList: () => {
    const { issues, selectedType } = get();

    return issues.filter((issue) => {
      return (
        issue.type && issue.type.toLowerCase() === selectedType.toLowerCase()
      );
    });
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
      parent.postMessage(
        {
          pluginMessage: {
            type: "navigate",
            id: issueGroupList[index].nodeData.id,
          },
        },
        "*",
      );
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
