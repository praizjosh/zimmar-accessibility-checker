import { ReactNode } from "react";
import { RGBColor } from "wcag-contrast";
import ISSUE_TYPE_LABELS from "./issueTypeLabels";

export type Severity = "critical" | "major" | "minor";

/**
 * Machine-readable issue type key, derived from ISSUE_TYPE_LABELS
 * (src/lib/issueTypeLabels.ts) rather than hand-written - adding a new
 * issue type means adding one entry there, and this (plus everywhere
 * that switches on it) picks it up automatically. Deliberately not the
 * display label itself, so copy changes never touch routing/filtering/
 * detection logic that switches on this value - see ISSUE_TYPE_LABELS
 * for that.
 */
export type IssueType = keyof typeof ISSUE_TYPE_LABELS;

export type Issue = {
  id: number;
  type: string;
  description: string;
  severity: "critical" | "major" | "minor";
  nodeType: string | string[];
  icon: ReactNode;
};

export type IssueRecommendations = {
  [key: string]: string[];
};

export type contrastScore = {
  compliance: string;
  ratio: number;
};

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
  nodeType: string | string[];
  requiredSize?: string;
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
  singleIssue: IssueX | null; // An issue instance
  scanning: boolean;
  selectedType: IssueType | ""; // Selected issue type; "" means no scan has run yet
  currentRoute: Routes;
  setScanning: (isScanning: boolean) => void; // Setter for scanning state
  setSingleIssue: (newIssue: IssueX | null) => void; // Setter for a single issue
  navigateTo: (route: Routes) => void;
  setSelectedType: (type: IssueType) => void;
  updateIssue: (id: string, updates: Partial<IssueX>) => void;
  getIssueGroupList: () => IssueX[];
  rescanIssues: () => void; // Rescan the document for issues
}

export type copyToClipboardProps = {
  text: string;
  onSuccess: () => void;
  // eslint-disable-next-line no-unused-vars
  onError: (error: Error) => void;
};
