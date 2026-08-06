# Changelog

All notable changes to this plugin are documented here.

Two version numbers appear in this project and they are **not** the same thing:

- `package.json`'s semver (e.g. `1.1.0`) tracks the codebase/npm tooling and only bumps when this repo cuts a dev release.
- Figma's own **"Version N"** (visible on the plugin's Community page under "Version history") auto-increments once per publish and is entirely Figma-managed — it has no relationship to semver, and doesn't bump 1:1 with every semver change (there was no semver bump between the initial release and today, despite ten Figma publishes in between). Entries below reference both where a semver exists, and Figma's own version number always, since that's the authoritative full record and what users actually see.

Versions 2-10's descriptions are transcribed as originally published on Figma - full commit-level detail for that period isn't available since this changelog was only introduced retroactively (06/08/2026).

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
