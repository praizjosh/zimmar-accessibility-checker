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
	"INDEX" | "ISSUE_OVERVIEW_LIST_VIEW" | "ISSUE_LIST_VIEW" | "TOUCH_TARGET_ISSUE_LIST_VIEW";

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
	/** Only set on issues from a full-file (all-pages) scan - see tagIssuesWithPage (figmaUtils/collectIssues). */
	pageId?: string;
	pageName?: string;
};

export interface DetectedIssue {
	description?: string;
	type?: IssueType;
	severity: Severity;
	status?: string;
	nodeData: NodeDataType;
}

export interface IssuesStore {
	detectedIssues: DetectedIssue[];
	currentIssueIndex: number;
	startScan: () => void; // Start the scan
	setDetectedIssues: (newIssues: DetectedIssue[]) => void; // Setter for issues
	setCurrentIssueIndex: (index: number) => void;
	navigateToIssue: (index: number) => void; // Navigate to a specific issue
}

export type FileScanProgress = {
	pageIndex: number;
	pageCount: number;
	pageName: string;
};

export interface EnhancedIssuesStore extends IssuesStore {
	/** An instance of a detected issue. */
	singleIssue: DetectedIssue | null;
	/** All type-matching issues in the current quick-check selection - populated
	 * only when there's more than one, so the UI can show a pick-list instead of
	 * silently dropping every match but the first. */
	selectionIssues: DetectedIssue[];
	scanning: boolean;
	/** Selected issue type. Empty string (`""`) means no scan has run yet. */
	selectedType: IssueType | "";
	currentRoute: Routes;
	targetLevel: TargetLevel;
	deviceType: DeviceType;
	/** Non-null only while a full-file (all-pages) scan is in progress - see startFileScan. */
	fileScanProgress: FileScanProgress | null;
	/** True once the user cancels an in-progress file scan, until the next scan starts. */
	fileScanCancelled: boolean;
	/** True once the user cancels an in-progress single-page scan, until the next scan starts. */
	pageScanCancelled: boolean;
	/** True once the user has opened the "scan entire file" caret menu at least once, ever - persisted via figma.clientStorage so the "new" badge doesn't reappear after reopening Figma. */
	hasSeenFileScanOption: boolean;
	/** Number of pages in the current file - drives whether "Scan entire file" is offered at all (meaningless on a single-page file). Defaults to 1 (hides the option) until LOAD_PAGE_COUNT arrives. */
	pageCount: number;
	setScanning: (isScanning: boolean) => void;
	setSingleIssue: (newIssue: DetectedIssue | null) => void;
	setSelectionIssues: (issues: DetectedIssue[]) => void;
	navigateTo: (route: Routes) => void;
	setSelectedType: (type: IssueType) => void;
	setTargetLevel: (level: TargetLevel) => void;
	setDeviceType: (device: DeviceType) => void;
	hydrateScanSettings: (settings: { deviceType: DeviceType; targetLevel: TargetLevel }) => void;
	updateIssue: (id: string, updates: Partial<DetectedIssue>) => void;
	getIssueGroupList: () => DetectedIssue[];
	rescanIssues: () => void;
	/** Scans every page in the file, not just the current one - see plugin/code.ts's handleScanFile. */
	startFileScan: () => void;
	/** Requests the in-progress file scan stop after its current page; already-collected issues are still shown. */
	cancelFileScan: () => void;
	setFileScanProgress: (progress: FileScanProgress | null) => void;
	/** Requests the in-progress single-page scan stop after its current phase; already-collected issues are still shown. */
	cancelPageScan: () => void;
	/** Marks the file-scan option as seen and persists it - idempotent, no-ops (and doesn't repost) once already true. */
	markFileScanOptionSeen: () => void;
	/** Applies a just-loaded seen flag from clientStorage - no repost, mirrors hydrateScanSettings. */
	hydrateFileScanOptionSeen: (seen: boolean) => void;
	/** Applies a just-broadcast page count - no repost, mirrors hydrateFileScanOptionSeen. */
	hydratePageCount: (count: number) => void;
}

export type copyToClipboardProps = {
	text: string;
	onSuccess: () => void;
	onError: (error: Error) => void;
};
