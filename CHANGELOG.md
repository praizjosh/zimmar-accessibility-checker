# Changelog

All notable changes to this plugin are documented here.

Two version numbers appear in this project and they are **not** the same thing:

- `package.json`'s semver (e.g. `1.1.0`) tracks the codebase/npm tooling and bumps with each dev release cut from this repo.
- Figma's own **"Version N"** (visible on the plugin's Community page under "Version history") auto-increments once per publish and is entirely Figma-managed — it has no relationship to semver. Entries below reference both where known, so either can be used to look up the same release.

Versions prior to Figma's Version 11 are not itemized here — this changelog was only introduced retroactively (06/08/2026) and earlier release-to-version mapping isn't available.

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

## [1.0.0] - Initial release

- First public release: full-page and quick-check accessibility scans for contrast, typography, and touch-target issues, AI-assisted alt text generation, and issue navigation/reporting.
