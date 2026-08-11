# Changelog

All notable changes to this plugin are documented here.

Two version numbers appear in this project and they are **not** the same thing:

- `package.json`'s semver (e.g. `1.1.0`) tracks the codebase/npm tooling and only bumps when this repo cuts a dev release.
- Figma's own **"Version N"** (visible on the plugin's Community page under "Version history") auto-increments once per publish and is entirely Figma-managed — it has no relationship to semver, and doesn't bump 1:1 with every semver change (there was no semver bump between the initial release and today, despite ten Figma publishes in between). Entries below reference both where a semver exists, and Figma's own version number always, since that's the authoritative full record and what users actually see.

Versions 2-10's descriptions are transcribed as originally published on Figma - full commit-level detail for that period isn't available since this changelog was only introduced retroactively (06/08/2026).

## [1.4.0] - Figma Version 15 (provisional - Figma's version number auto-increments on publish, confirm once actually published) - 11/08/2026

### Added

- Every issue now cites the specific WCAG success criterion it relates to (e.g. "WCAG 2.5.8 Target Size (Minimum) (AA)"), with a link to the official W3C page so you can verify it yourself - shown right in the app next to Recommendations, and in the CSV/JSON/Markdown exports. Where no exact criterion exists (minimum font size has none in WCAG), the citation says so explicitly rather than guessing. (#64, #66)
- New Markdown export option alongside CSV/JSON - a readable report grouped by severity, with clickable WCAG citation links, better suited to pasting into a PR description or handoff doc than a spreadsheet dump. (#64)

### Fixed

- A long file scan's progress banner is now visibly and audibly live instead of looking frozen: a spinner shows in the Cancel button while scanning, and screen readers now hear each page-progress update as it happens. (#69)

## [1.3.0] - Figma Version 14 - 10/08/2026

### Added

- Full-file (all-pages) scan: scan every page in the file, not just the current one, with progress feedback and a cancel button. Results now stream in progressively as each page finishes scanning, current page first, so you see results almost immediately instead of waiting for the whole file. (#56, #57)
- Contrast issues are now scored against both WCAG 2.x and APCA, the perceptually-uniform contrast algorithm under evaluation for WCAG 3, with a note when the two disagree on whether a pair passes. (#61)
- Selecting a container (frame, group, section) during quick-check now recurses into its descendants and, if more than one matching issue is found, shows all of them in a list instead of silently keeping only the first. (#51, #56)

### Changed

- "Scan entire file" moved into a split-button option off the primary "Scan entire page" action, and is hidden entirely on single-page files where it would be redundant. A dismissible "new" badge marks the option until you've opened it once. (#56)
- A cancel button was added to the single-page scan flow too - previously only file scans had one. (#56)
- Rescan now repeats whichever scan type produced the results currently on screen (page or file) instead of always defaulting to a page scan. (#57)
- Issue recommendation and description copy is now target-level aware (AA vs AAA) instead of always describing the AA standard. (#52)
- Issue-type tabs with no currently-active issues are now hidden instead of shown empty. (#53)

### Fixed

- The Back button on the results screen is now disabled while a scan is running, so navigating away mid-scan can no longer lose in-progress results. (#58)
- File-scan progress could be silently dropped if you navigated to an issue's detail view mid-scan and back; results and progress now update correctly regardless of which screen you're on. (#57)
- Touch-target checks no longer incorrectly flag a directly-selected text layer, which can never legitimately be a touch target. (#56)
- A contrast issue's Severity row now reflects its live pass/fail state instead of staying on a stale value after a fix is applied. (#56)

## [1.2.0] - Figma Version 13 - 07/08/2026

### Added

- Global AA/AAA target-level toggle for contrast issue detection, in addition to the existing fix-suggester toggle: text that passes AA but fails the stricter AAA standard is no longer invisible as an issue. Recomputes instantly, no rescan needed. (#43)
- Device-aware touch target sizing: new Device Type setting (Touch/Pointer) alongside the target-level toggle, behind a new Scan Settings popover. AA now checks against the WCAG 2.5.8 24px minimum instead of always using the AAA 2.5.5 44px threshold, and touch-target checks are skipped entirely for Pointer designs, since WCAG defines no separate desktop minimum. Settings persist across plugin restarts and files. (#44)

### Changed

- Upgraded Tailwind CSS to v4 and ESLint to v9 (tooling/build only; no user-facing behaviour change). (#46)
- Re-themed all shared UI components (buttons, cards, alerts, inputs, popovers, tabs, etc.) through semantic design tokens instead of hardcoded colours - root-cause fix for an intermittent white-on-white button bug, plus two related latent styling bugs caught along the way. (#47)

### Fixed

- A touch-target issue scanned at the AA level no longer shows a contradictory "at least 44x44 pixels" message alongside a correct "Required size: 24 x 24px" row. (#45)
- The target-level and device-type toggles' accessible names now always match their visible labels (WCAG SC 2.5.3). (#45)

### Performance

- Large pages with many frames/sections no longer risk freezing the plugin during a full-page scan: touch-target spacing detection now uses a spatial index instead of comparing every node against every other node on the page. (#48)

## [1.1.0] - Figma Version 12 - 06/08/2026

### Added

- Contrast fix suggester: for a failing contrast issue, suggests two WCAG-compliant colour options (darken the text or lighten the background), computed via a perceptually-uniform CIELAB lightness search that stays as close as possible to the original colour rather than picking an arbitrary "safe" one. Includes an AA/AAA target-level toggle that recomputes both suggestions live, tap-to-navigate colour swatches, and one-click apply. (#40)
- Lateral issue-type switcher in the issue detail pager, so you can move between Contrast, Typography, and Touch Target issues without going back to the list. (#32)
- Category breakdown chart on the Report tab. (#33)
- Colour swatches on contrast issues showing the actual foreground/background colours, plus tooltips for truncated layer names. (#29)

### Changed

- Replaced hover tooltips throughout the issue panels with click-to-open popovers, so explanatory text no longer disappears before you've finished reading it. (#31, #36)
- Consistent card border styling across all issue-detail panels. (#40)

### Fixed

- Consolidated severity colour styling, fixing inconsistencies across issue panels. (#28)

### Accessibility

- Decorative icons are now hidden from screen readers throughout the plugin. (#38)
- The Alt Text Generator's collapse control is now a properly labelled, keyboard-accessible button rather than an unlabelled click target. (#38)

### Security

- Resolved all outstanding dependency vulnerabilities flagged by Dependabot. None were reachable in the shipped plugin bundle (all were build-time tooling), but all are now patched. (#39)

## Figma Version 11 - 04/08/2026

### Fixed

- Contrast checks occasionally read the wrong text colour on layers with multiple fills; contrast is now measured against the actual topmost visible colour, matching what's rendered on screen. (#17)
- "Copy to clipboard" in the Alt Text Generator wasn't working reliably inside Figma's plugin panel; it now falls back automatically when the browser Clipboard API isn't available. (#13)

## Figma Version 10 - 27/08/2025

- Updated the backend handshake.

## Figma Version 9 - 27/08/2025

- Updated the plugin's Community page description.

## Figma Version 8 - 26/08/2025

- Added AI Assistant tools (AI-generated alt text for images, via a Cloudflare Worker backend).

## Figma Version 7 - 29/03/2025

- Improved contrast UX.

## Figma Version 6 - 21/03/2025

- Improved user experience.

## Figma Version 5 - 16/03/2025

- Improved UI and added a re-scan option.

## Figma Version 4 - 25/02/2025

- Minor bug fixes.

## Figma Version 3 - 25/02/2025

- UI updates.

## Figma Version 2 - 24/02/2025

- Minor bug fixes.

## [1.0.0] - Figma Version 1 - 23/02/2025

- Initial release: full-page and quick-check accessibility scans for contrast, typography, and touch-target issues, and issue navigation/reporting.
