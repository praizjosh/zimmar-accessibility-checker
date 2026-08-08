/// <reference types="@figma/plugin-typings" />

import { convertHexColorToRgbColor } from "@create-figma-plugin/utilities";
import { RGBColor } from "wcag-contrast";

import { CLIENT_STORAGE_KEYS, MESSAGE_TYPES } from "@/lib/constants";
import { postMessageToUI, replaceTopmostVisibleSolidFillColor } from "@/lib/figmaUtils";
import {
	collectIssues,
	collectTextNodeIssues,
	collectTouchTargetIssues,
	detectIssuesInSelection,
	isScannable,
	tagIssuesWithPage,
} from "@/lib/figmaUtils/collectIssues";
import generateAltTextForLayer from "@/lib/helpers/generateAltTextForLayer";
import { DeviceType, TargetLevel } from "@/lib/types";
import {
	figmaRGBtoHex,
	getIsFileScanCancelled,
	getIsPageScanCancelled,
	getIsQuickCheckModeActive,
	getScanSettings,
	setIsFileScanCancelled,
	setIsPageScanCancelled,
	setIsQuickCheckModeActive,
	setScanSettings,
} from "@/lib/utils";

type ScanSettings = {
	deviceType?: DeviceType;
	targetLevel?: TargetLevel;
};

figma.showUI(__html__);
figma.ui.resize(375, 550);

// Whether "Scan entire file (all pages)" should be offered at all - a
// single-page file makes it identical to "Scan entire page", so the UI hides
// it entirely rather than offer a redundant, confusing option. Re-broadcast
// on every currentpagechange (not just once at startup) since creating,
// duplicating, or deleting the current page all fire that event in Figma's
// normal UI behaviour - a cheap proxy for "page count may have changed"
// that doesn't need documentchange/loadAllPagesAsync (which would force
// loading every page up front, the exact cost dynamic-page access exists to
// avoid). Known gap: deleting a page other than the current one doesn't fire
// currentpagechange, so that specific case stays stale until the next
// plugin restart.
function broadcastPageCount() {
	postMessageToUI(MESSAGE_TYPES.LOAD_PAGE_COUNT, { pageCount: figma.root.children.length });
}

figma.on("currentpagechange", broadcastPageCount);

// Restore the last-saved scan settings (if any) before the UI ever asks -
// clientStorage is per-plugin-per-user and persists across files/restarts,
// unlike the in-memory Zustand store the UI iframe gets recreated with
// every time the plugin reopens.
(async () => {
	const [stored, storedSeen] = await Promise.all([
		figma.clientStorage.getAsync(CLIENT_STORAGE_KEYS.SCAN_SETTINGS) as Promise<
			{ deviceType?: DeviceType; targetLevel?: TargetLevel } | undefined
		>,
		figma.clientStorage.getAsync(CLIENT_STORAGE_KEYS.FILE_SCAN_OPTION_SEEN) as Promise<
			boolean | undefined
		>,
	]);

	const settings = {
		deviceType: stored?.deviceType ?? "touch",
		targetLevel: stored?.targetLevel ?? "AA",
	};

	setScanSettings(settings);
	postMessageToUI(MESSAGE_TYPES.LOAD_SCAN_SETTINGS, settings);
	postMessageToUI(MESSAGE_TYPES.LOAD_FILE_SCAN_OPTION_SEEN, { seen: storedSeen ?? false });
	broadcastPageCount();
})();

figma.ui.onmessage = async (message) => {
	try {
		switch (message.type) {
			case MESSAGE_TYPES.START_QUICKCHECK:
				handleStartQuickCheck(message);
				break;

			case MESSAGE_TYPES.CANCEL_QUICKCHECK:
				handleCancelQuickCheck();
				break;

			case MESSAGE_TYPES.SCAN:
				await handleScan(message);
				break;

			case MESSAGE_TYPES.CANCEL_SCAN:
				handleCancelScan();
				break;

			case MESSAGE_TYPES.SCAN_FILE:
				await handleScanFile(message);
				break;

			case MESSAGE_TYPES.CANCEL_SCAN_FILE:
				handleCancelScanFile();
				break;

			case MESSAGE_TYPES.SAVE_SCAN_SETTINGS:
				await handleSaveScanSettings(message);
				break;

			case MESSAGE_TYPES.MARK_FILE_SCAN_OPTION_SEEN:
				await handleMarkFileScanOptionSeen();
				break;

			case MESSAGE_TYPES.UPDATE_FONT_SIZE:
				await handleUpdateFontSize(message);
				break;

			case MESSAGE_TYPES.UPDATE_FILL_COLOR:
				await handleUpdateFillColor(message);
				break;

			case MESSAGE_TYPES.NAVIGATE:
				await handleNavigate(message);
				break;

			case MESSAGE_TYPES.SELECT_MULTIPLE:
				await handleSelectMultiple(message);
				break;

			case MESSAGE_TYPES.GET_IMAGE_DATA:
				await generateAltTextForLayer();
				break;

			case MESSAGE_TYPES.NOTIFY:
				handleNotify(message);
				break;

			default:
				console.warn(`Unhandled request. Message type does not exist: ${message.type}`);
		}
	} catch (error) {
		figma.notify("An error occurred while executing task.");
		console.error("Error in onmessage handler:", error);
	}
};

// Set right before handleNavigate reassigns figma.currentPage.selection, so
// the resulting selectionchange event (Figma fires it for programmatic
// reassignment same as a manual click) doesn't get treated as a real new
// selection - without this, drilling into an issue from the multi-match list
// would immediately re-trigger quick-check's own scan against the narrowed
// selection and clobber the list/detail state the click just set.
let suppressNextSelectionChange = false;

figma.on("selectionchange", async () => {
	if (suppressNextSelectionChange) {
		suppressNextSelectionChange = false;
		return;
	}

	const isQuickCheckModeActive = getIsQuickCheckModeActive();
	if (!isQuickCheckModeActive) return;

	const selection = figma.currentPage.selection;

	if (selection.length === 0) {
		postMessageToUI(MESSAGE_TYPES.NO_SELECTION, true);
		return;
	}

	if (selection.length > 0) {
		postMessageToUI(MESSAGE_TYPES.LAYER_SELECTED, true);
	}

	try {
		const { deviceType, targetLevel } = getScanSettings();
		const detectedIssues = await detectIssuesInSelection(selection, deviceType, targetLevel, [
			...figma.currentPage.children,
		]);
		if (detectedIssues.length) {
			postMessageToUI(MESSAGE_TYPES.DETECTED_ISSUE, detectedIssues);
		}
	} catch (error) {
		console.error("Error in selectionchange handler:", error);
	}
});

async function handleStartQuickCheck(message: ScanSettings) {
	const deviceType = message.deviceType ?? "touch";
	const targetLevel = message.targetLevel ?? "AA";
	setScanSettings({ deviceType, targetLevel });
	setIsQuickCheckModeActive(true);

	postMessageToUI(MESSAGE_TYPES.QUICKCHECK_ACTIVE, getIsQuickCheckModeActive());

	const selection = figma.currentPage.selection;

	if (selection.length === 0) {
		postMessageToUI(MESSAGE_TYPES.NO_SELECTION, true);
		return;
	}

	try {
		const detectedIssues = await detectIssuesInSelection(selection, deviceType, targetLevel, [
			...figma.currentPage.children,
		]);
		if (detectedIssues.length) {
			postMessageToUI(MESSAGE_TYPES.DETECTED_ISSUE, detectedIssues);
		}
	} catch (error) {
		console.error("Error in selectionchange handler:", error);
	}
}

function handleCancelQuickCheck() {
	setIsQuickCheckModeActive(false);
}

async function handleScan(message: ScanSettings) {
	const deviceType = message.deviceType ?? "touch";
	const targetLevel = message.targetLevel ?? "AA";
	setScanSettings({ deviceType, targetLevel });
	setIsPageScanCancelled(false);

	const allTextNodes = figma.currentPage.findAll(
		(node) => node.type === "TEXT" && isScannable(node),
	) as TextNode[];
	// const allVectorNodes = figma.currentPage.findAll(
	//   (node) => node.type === "VECTOR",
	// ) as VectorNode[];
	const allPageNodes = figma.currentPage.findAll((node) => isScannable(node)) as SceneNode[];

	// Run the two phases sequentially (collectIssues runs them concurrently
	// via Promise.all) so there's a point between them to check for a
	// cancellation - the only yield point in a single-page scan, since each
	// phase itself is still one uninterrupted pass. Coarser than
	// handleScanFile's between-page cancellation, but still lets the (often
	// slower) touch-target phase be skipped if the user cancels while the
	// text-node phase is still running.
	const textNodeIssues = await collectTextNodeIssues(allTextNodes);

	await new Promise((resolve) => setTimeout(resolve, 0));

	const touchTargetIssues =
		!getIsPageScanCancelled() && deviceType === "touch"
			? await collectTouchTargetIssues(allPageNodes, targetLevel)
			: [];

	postMessageToUI(MESSAGE_TYPES.LOAD_ISSUES, [...textNodeIssues, ...touchTargetIssues]);
}

// Boolean gate checked once, between the two phases above - not a true
// mid-phase abort. Whatever the text-node phase already found is still sent
// via the final LOAD_ISSUES rather than discarded.
function handleCancelScan() {
	setIsPageScanCancelled(true);
}

// Scans every page in the file, not just the current one. documentAccess is
// "dynamic-page" (manifest.json), so every page other than figma.currentPage
// needs an explicit PageNode.loadAsync() before it can be traversed -
// figma.root.children itself is available synchronously without loading
// anything, so the page list (names/count) can be enumerated up front.
async function handleScanFile(message: ScanSettings) {
	const deviceType = message.deviceType ?? "touch";
	const targetLevel = message.targetLevel ?? "AA";
	setScanSettings({ deviceType, targetLevel });
	setIsFileScanCancelled(false);

	// Scan the page the user is currently looking at first, then the rest of
	// the file in file order - this is what makes streaming worthwhile, since
	// the first results to land are for the page the user is actually on.
	const currentPage = figma.currentPage;
	const pages = [
		currentPage,
		...figma.root.children.filter((page) => page.id !== currentPage.id),
	];

	for (let i = 0; i < pages.length; i++) {
		if (getIsFileScanCancelled()) break;

		const page = pages[i];
		await page.loadAsync();

		const allTextNodes = page.findAll(
			(node) => node.type === "TEXT" && isScannable(node),
		) as TextNode[];
		const allPageNodes = page.findAll((node) => isScannable(node)) as SceneNode[];

		const pageIssues = await collectIssues(allTextNodes, allPageNodes, deviceType, targetLevel);
		const taggedPageIssues = tagIssuesWithPage(pageIssues, page.id, page.name);

		// Stream this page's results immediately instead of accumulating them
		// in memory - each page's own array is naturally already a bounded
		// chunk, so this is both progressive delivery and chunking at once.
		if (taggedPageIssues.length > 0) {
			postMessageToUI(MESSAGE_TYPES.SCAN_FILE_PAGE_ISSUES, taggedPageIssues);
		}

		postMessageToUI(MESSAGE_TYPES.SCAN_FILE_PROGRESS, {
			pageIndex: i + 1,
			pageCount: pages.length,
			pageName: page.name,
		});

		// Yield to the event loop so the messages above actually flush to the
		// UI, and so a CANCEL_SCAN_FILE message sent while this page was being
		// scanned gets processed before the next page starts.
		await new Promise((resolve) => setTimeout(resolve, 0));
	}

	// Unconditional, same as the old final LOAD_ISSUES send - tells the UI the
	// scan is over whether it finished naturally or was cancelled partway.
	postMessageToUI(MESSAGE_TYPES.SCAN_FILE_COMPLETE, { cancelled: getIsFileScanCancelled() });
}

// Requests the loop above stop after its current page - a boolean gate
// checked between pages, not a true mid-page abort, same granularity as
// handleCancelQuickCheck. Issues already collected from completed pages are
// still sent via the final LOAD_ISSUES rather than discarded.
function handleCancelScanFile() {
	setIsFileScanCancelled(true);
}

async function handleSaveScanSettings(message: ScanSettings) {
	const deviceType = message.deviceType ?? "touch";
	const targetLevel = message.targetLevel ?? "AA";
	setScanSettings({ deviceType, targetLevel });
	await figma.clientStorage.setAsync(CLIENT_STORAGE_KEYS.SCAN_SETTINGS, {
		deviceType,
		targetLevel,
	});
}

async function handleMarkFileScanOptionSeen() {
	await figma.clientStorage.setAsync(CLIENT_STORAGE_KEYS.FILE_SCAN_OPTION_SEEN, true);
}

async function handleUpdateFontSize(message: { id: string; fontSize: number }) {
	const node = (await figma.getNodeByIdAsync(message.id)) as TextNode | null;
	if (node && node.type === "TEXT") {
		await figma.loadFontAsync(node.fontName as FontName);
		node.fontSize = message.fontSize;
	} else {
		console.warn(`Failed to update font size for node ${message.id}`);
	}
}

async function handleUpdateFillColor(message: { nodeId: string; color: RGBColor }) {
	const node = await figma.getNodeByIdAsync(message.nodeId);
	if (!node || !("fills" in node) || !Array.isArray(node.fills)) {
		console.warn(`Failed to update fill color for node ${message.nodeId}`);
		return;
	}

	const figmaColor = convertHexColorToRgbColor(figmaRGBtoHex(message.color).slice(1));
	if (!figmaColor) {
		console.warn(`Failed to convert suggested color for node ${message.nodeId}`);
		return;
	}

	const updatedFills = replaceTopmostVisibleSolidFillColor(node.fills as Paint[], figmaColor);
	if (!updatedFills) {
		console.warn(`No visible solid fill found on node ${message.nodeId}`);
		return;
	}

	node.fills = updatedFills;
}

function handleNotify(message: { message: string }) {
	figma.notify(message.message);
}

async function handleNavigate(message: { id: string; pageId?: string }) {
	// A node from a full-file scan can be on a different page than the one
	// currently open - Figma won't select a node that isn't on currentPage,
	// so that page has to become current first.
	if (message.pageId && message.pageId !== figma.currentPage.id) {
		const page = (await figma.getNodeByIdAsync(message.pageId)) as PageNode | null;
		if (page) {
			await figma.setCurrentPageAsync(page);
		}
	}

	const node = (await figma.getNodeByIdAsync(message.id)) as SceneNode;
	if (node) {
		suppressNextSelectionChange = true;
		figma.currentPage.selection = [node];
		figma.viewport.scrollAndZoomIntoView([node]);
	} else {
		console.warn(`Node with ID ${message.id} not found.`);
	}
}

// Re-selects every element behind a multi-match quick-check list, used by
// "Back to list" (IssuesWrapper) to restore the full highlight after a
// drill-in click narrowed the canvas selection down to just one of them -
// otherwise the panel says "N issues found" while Figma's selection shows
// only whichever single element was last drilled into.
async function handleSelectMultiple(message: { ids: string[] }) {
	const nodes = (await Promise.all(message.ids.map((id) => figma.getNodeByIdAsync(id)))).filter(
		(node): node is SceneNode => node !== null,
	);

	if (nodes.length > 0) {
		suppressNextSelectionChange = true;
		figma.currentPage.selection = nodes;
		figma.viewport.scrollAndZoomIntoView(nodes);
	}
}
