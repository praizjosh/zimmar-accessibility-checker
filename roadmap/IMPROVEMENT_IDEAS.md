# Improvement Ideas — Zimmar Accessibility Checker

Notes from a codebase review (02/08/2026). Nothing here has been actioned yet — treat as a backlog to revisit and prioritise.

## Code quality / cleanup

- [ ] Remove `// @ts-nocheck` from `plugin/code.ts` and fix the resulting type errors. This is the file doing the most direct Figma API work and it currently has no type checking at all.
- [ ] Deduplicate `src/lib/utils.ts`:
  - `getSeverityStylesa` vs `getSeverityStyles` — the former looks like an abandoned draft of the latter.
  - `extractForegroundColorX` duplicates `extractForegroundColor` in `src/lib/figmaUtils.ts`.
  - `getBackgroundColorOfNode`, `getBackgroundColorForTextNode`, `getBackgroundColorForNode` — three overlapping implementations of "find the effective background colour"; consolidate to one.
  - Dead commented-out `overlaps` implementation above the live one.
- [ ] `AltTextGenerator.tsx` uses the deprecated `document.execCommand("copy")` instead of the existing `copyToClipboard` helper (`src/lib/utils.ts`), which uses the modern Clipboard API. Switch it over.
- [ ] `IssuesWrapper.tsx` vs `IssuesWrapperOriginal.tsx` — look like one is a stale draft of the other; confirm which is live (check imports) and delete the unused one.
- [ ] Add a test suite (vitest) for the pure logic that currently has zero coverage: `getContrastCompliance`, `isTouchTargetTooSmall`/`isTouchTargetTooClose`, background-colour inference. These are the functions whose correctness the whole plugin's credibility rests on.
- [ ] Add a CI workflow (GitHub Actions) running lint + typecheck + build on PRs. There's currently no server-side gate — only the local Husky pre-commit hook, which can be bypassed.
- [ ] Minor type-safety hole: `selectedType` in `useIssuesStore` is initialised to `""`, which isn't a member of the `IssueType` union.

## Potential new features

**Detection coverage** (currently limited to contrast, min font size, touch target size/spacing)
- Non-text contrast checks (WCAG 1.4.11) — icons, borders, and focus indicators against adjacent colours, not just text.
- Missing alt-text *audit* — flag images/exportable layers with no alt text set, rather than only generating it on demand per selection.
- Text spacing/line-length checks (WCAG 1.4.8) — overly long line lengths, insufficient line-height.
- Heading hierarchy / reading order checks, useful for design-to-dev handoff.
- Focus indicator presence check — flag interactive components with no visible focus style variant.
- Flash/motion checks for prototypes (WCAG 2.3.1 seizure risk) on auto-playing or smart-animate transitions.

**Workflow / usability**
- Color-blindness simulation overlay on the canvas (protanopia, deuteranopia, tritanopia).
- Full-file/multi-page scan with a summary dashboard, not just the current page.
- "Ignore/dismiss with reason" for a flagged node so re-scans stop re-surfacing accepted exceptions.
- Batch-apply fixes (e.g. "fix all typography issues") instead of one at a time.
- Configurable thresholds (min font size, touch target size/spacing are currently hardcoded in `constants.ts`) via a settings panel.
- Exportable report (CSV/PDF) of scan results for stakeholder or QA handoff.
- Auto-post a Figma comment on flagged layers (via the REST API) so issues surface where reviewers already look.

**Design system integration**
- Flag raw hex/detached fills instead of library colour styles/tokens — nudges toward an accessible, token-based palette.
- Org-specific rule presets (approved colour pairs, custom touch-target minimums) for design system teams.

Worth discussing before committing to any of these: some (contrast simulation overlay, REST API comments, file-wide scanning) are materially bigger than the current single-page/single-selection model and would need real design/scoping first.
