import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { rgb, RGBColor, score } from "wcag-contrast";
import { copyToClipboardProps, DeviceType, IssueType, Routes, TargetLevel } from "../types";

export function cn(...inputs: ClassValue[]) {
	// eslint-disable-next-line tailwindcss/no-custom-classname -- false positive: the plugin treats the `inputs` variable reference as if it were a classname string literal.
	return twMerge(clsx(inputs));
}

/**
 * Maps an issue type to the route that displays its issue-detail pager.
 * Touch target issues share one pager (TouchTargetNavigator); everything
 * else shares another (IssuesNavigator).
 */
export function getRouteForIssueType(type: IssueType): Routes {
	return type === "TOUCH_TARGET_SIZE" || type === "TOUCH_TARGET_SPACING"
		? "TOUCH_TARGET_ISSUE_LIST_VIEW"
		: "ISSUE_LIST_VIEW";
}

/**
 * Whether a contrast result should be flagged as a failing issue at the
 * given target level. `getContrastCompliance` reports the highest tier a
 * pair actually achieved ("AAA"/"AA"/"AAA Large"/"AA Large"/"Fail"), not a
 * pass/fail against one specific level - text that clears AA but not AAA
 * comes back as "AA", which is a real issue if the target is AAA but not
 * if it's AA. `compliance` is untyped (contrastScore.compliance: string)
 * since it can be undefined when no contrast score exists yet.
 */
export function contrastFailsTargetLevel(
	compliance: string | undefined,
	targetLevel: TargetLevel,
): boolean {
	if (!compliance) return false;
	if (compliance === "Fail") return true;
	if (targetLevel === "AAA") {
		return compliance === "AA" || compliance === "AA Large";
	}
	return false;
}

/**
 * Contrast issue description text for the given compliance tier and target
 * level - computed at render/report time rather than baked into the issue
 * at scan time, since contrast target-level filtering is instant/client-side
 * (toggling AA/AAA doesn't rescan) and the same stored issue is shown or
 * exported under whichever level is currently selected. A pair that passes
 * AA but only fails AAA (`compliance: "AA"`/`"AA Large"`) needs different
 * copy from one that fails outright - "below WCAG AA standard" would be
 * false for the former.
 */
export function getContrastIssueDescription(
	compliance: string | undefined,
	targetLevel: TargetLevel,
): string {
	if (!contrastFailsTargetLevel(compliance, targetLevel)) {
		return "Text contrast meets the selected WCAG standard.";
	}
	if (compliance === "Fail") {
		return "Text contrast is below WCAG AA standard.";
	}
	return "Text contrast meets WCAG AA but is below the stricter WCAG AAA standard.";
}

// Global state
const state = {
	IsQuickCheckModeActive: false,
	scanSettings: { deviceType: "touch", targetLevel: "AA" } as {
		deviceType: DeviceType;
		targetLevel: TargetLevel;
	},
};

export const getIsQuickCheckModeActive = (): boolean => state.IsQuickCheckModeActive;
export const setIsQuickCheckModeActive = (value: boolean) => {
	state.IsQuickCheckModeActive = value;
};

/**
 * The device type/target level most recently sent from the UI (via a SCAN
 * or START_QUICKCHECK message) - cached here so the selectionchange
 * listener in plugin/code.ts, which fires without a message payload of its
 * own, can check newly-selected nodes against the same settings the user
 * last chose rather than always falling back to the defaults.
 */
export const getScanSettings = (): {
	deviceType: DeviceType;
	targetLevel: TargetLevel;
} => state.scanSettings;
export const setScanSettings = (settings: { deviceType: DeviceType; targetLevel: TargetLevel }) => {
	state.scanSettings = settings;
};

export const getSeverityStyles = (
	severity: string | undefined,
	{
		isIcon = false,
		isBold = false,
		isBadge = false,
	}: { isIcon?: boolean; isBold?: boolean; isBadge?: boolean } = {},
) => {
	const baseStyles = {
		critical: "text-rose-500",
		major: "text-orange-500",
		minor: "text-amber-500",
	};

	const boldStyles = {
		critical: "font-bold",
		major: "font-bold",
		minor: "font-bold",
	};

	const iconStyles = {
		critical: "mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade",
		major: "mr-3 size-5 rounded-full bg-orange-600 p-1 text-dark-shade",
		minor: "mr-3 size-5 rounded-full bg-amber-500 p-1 text-dark-shade",
	};

	const badgeStyles = {
		critical: "bg-rose-500 text-dark-shade",
		major: "bg-orange-500 text-dark-shade",
		minor: "bg-amber-500 text-dark-shade",
	};

	return cn(
		baseStyles[(severity as keyof typeof baseStyles) ?? ""] || "",
		isBold && boldStyles[(severity as keyof typeof baseStyles) ?? ""],
		isIcon && iconStyles[(severity as keyof typeof baseStyles) ?? ""],
		isBadge && badgeStyles[(severity as keyof typeof baseStyles) ?? ""],
	);
};

/**
 * Recursively collects all nodes in a scene graph starting from the given node.
 *
 * @param node - The starting node from which to begin collecting nodes.
 * @param collectedNodes - An array to store the collected nodes.
 */
export const collectNodes = (node: SceneNode, collectedNodes: SceneNode[]) => {
	collectedNodes.push(node);
	if ("children" in node) {
		for (const child of node.children) {
			collectNodes(child, collectedNodes);
		}
	}
};

/**
 * Determines if the specified font weight or range of font weights is bold.
 *
 * @param {number | symbol} fontWeight - The font weight to evaluate.
 * @param {TextNode} [node] - The Figma TextNode, required for mixed font weight ranges.
 * @param {number} [start] - The start of the range to check (inclusive).
 * @param {number} [end] - The end of the range to check (exclusive).
 * @returns {boolean} True if the font or range contains bold font weight, otherwise false.
 */
export const isBoldFont = (
	fontWeight: number | symbol,
	node: TextNode,
	start?: number,
	end?: number,
): boolean => {
	if (!fontWeight) return false;

	// Handle mixed font weight
	if (
		fontWeight === figma.mixed &&
		node &&
		typeof start === "number" &&
		typeof end === "number"
	) {
		const textLength = node.characters.length;

		// Ensure valid range
		if (start < 0 || end > textLength || start >= end) {
			console.warn("Invalid range:", { start, end, textLength });
			return false;
		}

		for (let i = start; i < end; i++) {
			try {
				const rangeFontWeight = node.getRangeFontWeight(i, i + 1);
				if (typeof rangeFontWeight === "number" && rangeFontWeight >= 700) {
					return true; // Found bold within the range
				}
			} catch (error) {
				console.error("Error getting font weight for range:", { i, error });
				return false;
			}
		}
		return false; // No bold font found in the range
	}

	// Validate and evaluate single font weight
	if (typeof fontWeight !== "number") {
		console.warn("Invalid fontWeight value:", fontWeight);
		return false;
	}

	// Return true if fontWeight is bold
	return fontWeight >= 700;
};

/**
 * Evaluate the WCAG contrast score between two colors.
 * @param foreground - The foreground color in hex (e.g., "#FFFFFF").
 * @param background - The background color in hex (e.g., "#000000").
 * @returns A string indicating the WCAG score ("AA", "AA Large", "AAA", etc.) or "Fail".
 */
export function getContrastScore(
	foreground: RGBColor,
	background: RGBColor,
	// foreground: string,
	// background: string,
): string {
	// const pairContrastScore = hex(foreground, background); // for hex
	const pairContrastRatio = rgb(foreground, background); // returns a number

	// console.log("pairContrastRatio res: ", pairContrastRatio);
	return score(pairContrastRatio);
}

/**
 * Determines the WCAG compliance level for text contrast.
 *
 * @param foregroundColor - The foreground color in rgb format.
 * @param backgroundColor - The background color in rgb format.
 * @param fontSize - The font size in pixels.
 * @param isBold - Whether the text is bold. Defaults to `false`.
 * @returns The WCAG compliance level as one of "AAA", "AA", "AAA Large", "AA Large", or "Fail" and the contrast ratio.
 */
export function getContrastCompliance(
	foregroundColor: RGBColor,
	backgroundColor: RGBColor,
	fontSize: number | symbol,
	isBold: boolean = false,
): {
	compliance: "AAA" | "AA" | "AAA Large" | "AA Large" | "Fail";
	ratio: number;
} {
	if (typeof fontSize !== "number" || isNaN(fontSize) || typeof fontSize === "symbol") {
		console.error("Invalid fontSize:", fontSize);
		return { compliance: "Fail", ratio: 0 }; // Fallback for invalid inputs
	}

	const ratio: number = rgb(foregroundColor, backgroundColor); // Ensure `rgb` handles errors gracefully

	// Check if the font qualifies as "large text" under WCAG standards
	const isLargeText: boolean = fontSize >= 18 || (isBold && fontSize >= 14);

	// Determine compliance level based on contrast ratio and text size
	if (isLargeText) {
		if (ratio >= 4.5) {
			return { compliance: "AAA Large", ratio }; // Large text meeting AAA standards
		} else if (ratio >= 3) {
			return { compliance: "AA Large", ratio }; // Large text meeting AA standards
		}
	} else {
		if (ratio >= 7) {
			return { compliance: "AAA", ratio }; // Normal text meeting AAA standards
		} else if (ratio >= 4.5) {
			return { compliance: "AA", ratio }; // Normal text meeting AA standards
		}
	}

	return { compliance: "Fail", ratio }; // Text does not meet any WCAG standards
}

/**
 * Determines if two Figma nodes visually overlap based on their bounding boxes.
 *
 * @param {SceneNode} nodeA - The first node to compare.
 * @param {SceneNode} nodeB - The second node to compare.
 * @returns {boolean} True if the nodes overlap, false otherwise.
 */
export function overlaps(nodeA: SceneNode, nodeB: SceneNode): boolean {
	if (!("absoluteBoundingBox" in nodeA) || !("absoluteBoundingBox" in nodeB)) {
		return false;
	}

	const boxA = nodeA.absoluteBoundingBox;
	const boxB = nodeB.absoluteBoundingBox;

	if (!boxA || !boxB) return false;

	return (
		boxA.x < boxB.x + boxB.width &&
		boxA.x + boxA.width > boxB.x &&
		boxA.y < boxB.y + boxB.height &&
		boxA.y + boxA.height > boxB.y
	);
}

export type BackgroundColorResult = {
	color: RGBColor;
	nodeId: string;
	nodeName: string;
	/**
	 * How many other nodes also depend on this same contributing node's fill.
	 * Case 1 (direct parent fill): every other child of that parent sits on
	 * the same fill by definition of nesting, so this is exact, not a guess.
	 * Case 2 (sibling-overlap fallback): how many other siblings also overlap
	 * the same contributing sibling - i.e. other elements sitting on the same
	 * background shape. Used by the contrast "fix it" suggester
	 * (roadmap/COLOR_FIX_SUGGESTER_PLAN.md) to disclose when changing this
	 * fill could visually affect more than just the node being fixed.
	 */
	sharedWithCount: number;
};

export function getBackgroundColorForNode(node: SceneNode): BackgroundColorResult | null {
	if (!node.parent) return null;

	const parent = node.parent;

	// Case 1: Parent has a solid fill
	if ("fills" in parent && parent.fills && Array.isArray(parent.fills)) {
		const solidFill = parent.fills.find((fill) => fill.type === "SOLID" && fill.visible);
		if (solidFill && "color" in solidFill) {
			const sharedWithCount =
				"children" in parent
					? parent.children.filter((child) => child.id !== node.id).length
					: 0;

			return {
				color: figmaRGBtoRGBColor(solidFill.color),
				nodeId: parent.id,
				nodeName: parent.name,
				sharedWithCount,
			};
		}
	}

	// Case 2: Check siblings beneath the node
	if ("children" in parent) {
		const nodeIndex = parent.children.indexOf(node);
		for (let i = 0; i < nodeIndex; i++) {
			const sibling = parent.children[i];
			if ("fills" in sibling && sibling.fills && Array.isArray(sibling.fills)) {
				if (overlaps(sibling, node)) {
					const solidFill = sibling.fills.find(
						(fill) => fill.type === "SOLID" && fill.visible,
					);
					if (solidFill && "color" in solidFill) {
						const sharedWithCount = parent.children.filter(
							(other) =>
								other.id !== node.id &&
								other.id !== sibling.id &&
								overlaps(sibling, other),
						).length;

						return {
							color: figmaRGBtoRGBColor(solidFill.color),
							nodeId: sibling.id,
							nodeName: sibling.name,
							sharedWithCount,
						};
					}
				}
			}
		}
	}

	return null;
}

/**
 * Converts a Figma RGB color (0-1 range) to a standard RGB color (0-255 range).
 *
 * @param {RGB} figmaColor - The RGB color object from Figma, with values in the 0-1 range.
 * @returns {RGBColor} An array representing the RGB color in the 0-255 range.
 *
 * @example
 * const figmaColor: RGB = { r: 0.5, g: 0.7, b: 0.2 };
 * const convertedColor = figmaRGBtoRGBColor(figmaColor);
 * console.log(convertedColor); // Output: [128, 179, 51]
 */
export function figmaRGBtoRGBColor(figmaColor: RGB): RGBColor {
	return [
		Math.round(figmaColor.r * 255),
		Math.round(figmaColor.g * 255),
		Math.round(figmaColor.b * 255),
	];
}

export function figmaRGBtoHex(rgb: [number, number, number]): string {
	const [r, g, b] = rgb;

	// Ensure the values are clamped between 0 and 255
	const clamp = (value: number) => Math.max(0, Math.min(255, value));

	const toHex = (value: number) => {
		const hex = clamp(value).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function copyWithExecCommand(text: string): boolean {
	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();

	try {
		return document.execCommand("copy");
	} finally {
		document.body.removeChild(textarea);
	}
}

/**
 * Copies text to the clipboard, preferring the async Clipboard API and
 * falling back to document.execCommand("copy") when it's unavailable
 * (e.g. Figma's plugin UI iframe doesn't expose navigator.clipboard).
 */
export async function copyToClipboard({
	text,
	onSuccess,
	onError,
}: copyToClipboardProps): Promise<void> {
	if (navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(text);
			onSuccess();
			return;
		} catch {
			// Fall through to the execCommand fallback below.
		}
	}

	try {
		if (copyWithExecCommand(text)) {
			onSuccess();
		} else {
			onError(new Error("Clipboard copy command was unsuccessful"));
		}
	} catch (err) {
		onError(err instanceof Error ? err : new Error(String(err)));
	}
}
