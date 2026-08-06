import { ReactNode } from "react";
import { RGBColor } from "wcag-contrast";
import ISSUE_TYPE_LABELS from "./issueTypeLabels";

// issueTypeLabels.ts must stay import-free - importing from it here would create a cycle otherwise.
export type IssueType = keyof typeof ISSUE_TYPE_LABELS;

export type Severity = "critical" | "major" | "minor";

export type Issue = {
  id: number;
  type: IssueType;
  description: string;
  severity: Severity;
  nodeType: NodeType | NodeType[];
  icon: ReactNode;
};

export type IssueRecommendations = {
  [key: string]: string[];
};

export type contrastScore = {
  compliance: string;
  ratio: number;
};

/**
 * Which WCAG conformance level detection/remediation is being held to.
 * Global app state (see EnhancedIssuesStore.targetLevel) as well as the
 * contrast fix suggester's own local target for a single suggestion.
 */
export type TargetLevel = "AA" | "AAA";

/**
 * Which input the design is primarily intended for. Drives whether touch
 * target size/spacing is checked at all (WCAG 2.5.5/2.5.8 exist because of
 * touch/finger imprecision - there is no equivalent WCAG-mandated minimum
 * for pointer/mouse-driven interfaces) and, when it is, which size
 * threshold (see TOUCH_TARGET_MIN_SIZE in constants.ts) applies.
 */
export type DeviceType = "touch" | "pointer";

export type Routes =
  | "INDEX"
  | "ISSUE_OVERVIEW_LIST_VIEW"
  | "ISSUE_LIST_VIEW"
  | "TOUCH_TARGET_ISSUE_LIST_VIEW";

export type ROUTES_LIST = Record<Routes, JSX.Element>;

export type NodeDataType = {
  id: string;
  characters?: string;
  contrastScore?: contrastScore;
  fontSize?: number;
  width?: number;
  height?: number;
  lineHeight?: LineHeight | unknown;
  name: string;
  foregroundColor?: RGBColor;
  backgroundColor?: RGBColor;
  backgroundNodeId?: string;
  backgroundNodeName?: string;
  backgroundSharedWithCount?: number;
  isBold?: boolean;
  nodeType: NodeType | NodeType[];
  requiredSize?: string;
  requiredSizePx?: number;
};

export interface IssueX {
  description?: string;
  type?: IssueType;
  severity: Severity;
  status?: string;
  nodeData: NodeDataType;
}

export interface IssuesStore {
  issues: IssueX[]; // List of issues
  currentIndex: number; // Index of the currently selected issue
  startScan: () => void; // Start the scan
  setIssues: (newIssues: IssueX[]) => void; // Setter for issues
  setCurrentIndex: (index: number) => void; // Setter for the current index
  navigateToIssue: (index: number) => void; // Navigate to a specific issue
}

export interface EnhancedIssuesStore extends IssuesStore {
  /** An instance of a detected issue. */
  singleIssue: IssueX | null;
  scanning: boolean;
  /** Selected issue type. Empty string (`""`) means no scan has run yet. */
  selectedType: IssueType | "";
  currentRoute: Routes;
  targetLevel: TargetLevel;
  deviceType: DeviceType;
  setScanning: (isScanning: boolean) => void;
  setSingleIssue: (newIssue: IssueX | null) => void;
  navigateTo: (route: Routes) => void;
  setSelectedType: (type: IssueType) => void;
  setTargetLevel: (level: TargetLevel) => void;
  setDeviceType: (device: DeviceType) => void;
  hydrateScanSettings: (settings: {
    deviceType: DeviceType;
    targetLevel: TargetLevel;
  }) => void;
  updateIssue: (id: string, updates: Partial<IssueX>) => void;
  getIssueGroupList: () => IssueX[];
  rescanIssues: () => void;
}

export type copyToClipboardProps = {
  text: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
};
