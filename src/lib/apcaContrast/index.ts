import { APCAcontrast, sRGBtoY } from "apca-w3";
import { RGBColor } from "wcag-contrast";

export type ApcaTier = "body" | "large";

export type ApcaScore = {
	/**
	 * Signed Lc, exactly as apca-w3 returns it (~-108 to 106). Sign is
	 * text/background polarity - conflicting sources on which sign means which
	 * were found while scoping this feature (see roadmap notes), so it isn't
	 * resolved here. meetsMinimum below uses the absolute value only, per
	 * Bronze Simple Mode's own instruction to "ignore the minus sign ... when
	 * using the lookup table" - so this ambiguity never affects correctness,
	 * only how the raw number could someday be *labelled*.
	 */
	lc: number;
	tier: ApcaTier;
	requiredLc: number;
	/** Only set for the "large" tier - Bronze's Lc90 halation cap for big,
	 * bold headlines (readtech.org/ARC/tests/bronze-simple-mode/). null means
	 * no upper bound applies. */
	maxLc: number | null;
	meetsMinimum: boolean;
};

// Bronze Simple Mode's numbers (readtech.org/ARC/tests/bronze-simple-mode/,
// cross-referenced against git.apcacontrast.com and
// github.com/Myndex/SAPC-APCA, the canonical spec), isolated behind one small
// table so they can be swapped for the full Silver/Gold font-size+weight
// matrix later without restructuring any call site.
const BRONZE_LARGE_FLUENT_MIN_FONT_SIZE = 36; // px, exclusive ("larger than 36px")

const BRONZE_REQUIRED_LC: Record<ApcaTier, { min: number; max: number | null }> = {
	body: { min: 75, max: null },
	large: { min: 45, max: 90 },
};

/**
 * Bronze's real "Body" vs "Other Content" distinction (Lc75 vs Lc60) hinges
 * on paragraph line count, which this pipeline has no signal for at a single
 * scanned TextNode - so both collapse into the stricter "body" tier here. A
 * conservative simplification (may occasionally over-flag a short headline
 * that would only need Lc 60 under the full spec), not an incorrect one.
 */
export function getApcaTier(fontSize: number): ApcaTier {
	return fontSize > BRONZE_LARGE_FLUENT_MIN_FONT_SIZE ? "large" : "body";
}

/**
 * Computes the APCA Lc score for a text/background pair and evaluates it
 * against Bronze Simple Mode's conformance range for the text's size tier.
 *
 * `isBold` is accepted but currently unused - Bronze's tiers are
 * weight-independent; kept in the signature so this function's inputs
 * already match what a future Silver-level (size+weight matrix) swap-in
 * would need, without changing every call site again.
 */
export function getApcaScore(
	foreground: RGBColor,
	background: RGBColor,
	fontSize: number | symbol,
	_isBold: boolean = false,
): ApcaScore {
	if (typeof fontSize !== "number" || isNaN(fontSize)) {
		// Mirrors getContrastCompliance's own invalid-fontSize fallback
		// (src/lib/utils/index.ts) - same failure shape, safe default.
		return {
			lc: 0,
			tier: "body",
			requiredLc: BRONZE_REQUIRED_LC.body.min,
			maxLc: null,
			meetsMinimum: false,
		};
	}

	const lc = Number(APCAcontrast(sRGBtoY(foreground), sRGBtoY(background)));
	const tier = getApcaTier(fontSize);
	const { min, max } = BRONZE_REQUIRED_LC[tier];
	const magnitude = Math.abs(lc);

	return {
		lc,
		tier,
		requiredLc: min,
		maxLc: max,
		meetsMinimum: magnitude >= min && (max === null || magnitude <= max),
	};
}
