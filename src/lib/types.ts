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
  /**
   * Identity of the node that contributed backgroundColor, and how many
   * other nodes share its fill - undefined when backgroundColor is
   * undefined, or when the node came from resolving a contributing solid
   * fill couldn't be determined. Used by the contrast "fix it" suggester
   * (roadmap/COLOR_FIX_SUGGESTER_PLAN.md) to know which node to mutate for
   * the "lighten background" direction, and whether to disclose that it's
   * shared with other layers before applying.
   */
  backgroundNodeId?: string;
  backgroundNodeName?: string;
  backgroundSharedWithCount?: number;
  /** Needed to correctly apply WCAG's large-text ratio threshold when
   * suggesting a contrast fix - not derivable after the fact from
   * contrastScore alone, since a "Fail" result doesn't say whether it was
   * measured as large or normal text. */
  isBold?: boolean;
  nodeType: NodeType | NodeType[];
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
