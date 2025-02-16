import { RGBColor } from "wcag-contrast";

export interface Issue {
  type: string;
  description: string;
  severity: string; // Options: High, Medium, Low
  id: string;
  fontSize: number;
  nodeType: string | string[];
  node?: unknown;
}

export type Severity = "critical" | "major" | "minor";

export type NodeDataType = {
  id: string;
  characters?: string;
  contrastScore?: string;
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

export type IssueType =
  | "Typography"
  | "Contrast"
  | "Touch Target Size"
  | "Touch Target Spacing";

export interface IssueX {
  description?: string;
  type?: IssueType;
  severity: Severity;
  status?: string;
  nodeData: NodeDataType;
}

export interface IssuesStore {
  issues: IssueX[]; // List of issues
  // issueGroupList: IssueX[]; // List of related issues by type
  currentIndex: number; // Index of the currently selected issue
  startScan: () => void; // Start the scan
  setIssues: (newIssues: IssueX[]) => void; // Setter for issues
  // setIssueGroupList: (newIssues: IssueX[]) => void; // Setter for related issues
  setCurrentIndex: (index: number) => void; // Setter for the current index
  navigateToIssue: (index: number) => void; // Navigate to a specific issue
}

export type Routes =
  | "INDEX"
  | "ISSUE_LIST_VIEW"
  | "TOUCH_TARGET_ISSUE_LIST_VIEW";

export type ROUTES_LIST = Record<Routes, JSX.Element>;

export interface EnhancedIssuesStore extends IssuesStore {
  scanning: boolean;
  selectedType: string; // Selected issue type
  currentRoute: Routes;
  navigateTo: (route: Routes) => void;
  setScanning: (isScanning: boolean) => void;
  setSelectedType: (type: IssueType) => void;
  updateIssue: (id: string, updates: Partial<IssueX>) => void;
  getIssueGroupList: () => IssueX[];
  rescanIssues: () => void; // Rescan the document for issues
}
