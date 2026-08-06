# Changelog

All notable changes to this plugin are documented here. Versions correspond to `package.json`.

## [1.1.0] - 06/08/2026

### Added

- Contrast fix suggester: for a failing contrast issue, suggests two WCAG-compliant colour options (darken the text or lighten the background), computed via a perceptually-uniform CIELAB lightness search that stays as close as possible to the original colour rather than picking an arbitrary "safe" one. Includes an AA/AAA target-level toggle that recomputes both suggestions live, tap-to-navigate colour swatches, and one-click apply. (#40)
- Lateral issue-type switcher in the issue detail pager, so you can move between Contrast, Typography, and Touch Target issues without going back to the list. (#32)
- Category breakdown chart on the Report tab. (#33)
- Colour swatches on contrast issues showing the actual foreground/background colours, plus tooltips for truncated layer names. (#29)

### Changed

- Replaced hover tooltips throughout the issue panels with click-to-open popovers, so explanatory text no longer disappears before you've finished reading it. (#31, #36)
- Consistent card border styling across all issue-detail panels. (#40)
- Alt Text Generator now uses the Clipboard API for copying, falling back only where the Figma iframe requires it. (#13)

### Fixed

- Contrast detection now reads the topmost visible fill colour on a layer instead of always the first one in its fill list, fixing inaccurate contrast readings on layers with multiple fills. (#17)
- Consolidated severity colour styling, fixing inconsistencies across issue panels. (#28)

### Accessibility

- Decorative icons are now hidden from screen readers throughout the plugin. (#38)
- The Alt Text Generator's collapse control is now a properly labelled, keyboard-accessible button rather than an unlabelled click target. (#38)

### Security

- Resolved all outstanding dependency vulnerabilities flagged by Dependabot. None were reachable in the shipped plugin bundle (all were build-time tooling), but all are now patched. (#39)

## [1.0.0] - Initial release

- First public release: full-page and quick-check accessibility scans for contrast, typography, and touch-target issues, AI-assisted alt text generation, and issue navigation/reporting.
