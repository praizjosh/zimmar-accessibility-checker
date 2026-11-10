# Zimmar Accessibility Checker [Figma Plugin]

A Figma plugin that helps designers and developers catch accessibility problems before hand-off. It scans designs for contrast, typography and touch-target issues, cites the relevant WCAG success criterion for each one, and can generate alt text for layers using AI.

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## Features

- **Contrast checking:** flags text with insufficient contrast, scored against both WCAG 2.x and APCA, with a global AA/AAA target-level toggle and suggested colour fixes.
- **Typography analysis:** flags text that is too small to read comfortably.
- **Touch-target checks:** flags interactive elements that are too small or too close together (24px AA, 44px AAA, 8px minimum spacing).
- **Flexible scanning:** scan the current page, the entire file (with progress and cancel), or use quick check to re-scan on every selection change.
- **WCAG citations:** each issue links to the specific W3C success criterion it relates to.
- **Export:** download results as CSV, JSON or Markdown.
- **AI-powered alt text:** generate descriptive alt text for images and exportable layers.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [Figma Desktop App](https://www.figma.com/downloads/)

### Installation

```sh
git clone https://github.com/praizjosh/zimmar-accessibility-checker.git
cd zimmar-accessibility-checker
npm install
```

---

## Development

The plugin builds two separate bundles: the sandbox code (`plugin/code.ts` to `dist/code.js`) and the React UI (`src/` to `dist/index.html`). Figma reads both straight from `dist/`, so the plain Vite dev server is not enough.

### Run in development

```sh
npm run dev
```

This runs the TypeScript watcher and both build watchers concurrently. Then, in the Figma desktop app, go to `Plugins > Development > Import plugin from manifest...` and select `manifest.json` from this repo.

### Build for production

```sh
npm run build
```

### Lint and test

```sh
npm run lint        # ESLint, zero warnings allowed
npm run lint:fix    # ESLint with autofix
npm run test        # Vitest, single run
npm run test:watch  # Vitest, watch mode
```

Vitest covers pure logic only. Anything that depends on the `figma` global or Figma's plugin iframe (for example clipboard access) must be verified manually in Figma dev mode.

---

## Usage

1. **Open Figma and run the plugin.**
2. **Scan:** choose "Scan entire page" (or "Scan entire file" from the split-button menu on multi-page files), or start quick check to inspect whatever you select.
3. **Review issues:** browse by type (contrast, typography, touch target), open an issue to jump to the layer in Figma, and read the recommendation and WCAG citation.
4. **Adjust the target level:** switch between AA and AAA to see how the results change without re-scanning.
5. **Export:** download the results as CSV, JSON or Markdown.
6. **Generate alt text:** select a single visible, exportable layer and use the alt text generator. The plugin exports the layer as a PNG, sends it for AI analysis and shows the result in the UI.

---

## Project Structure

```
plugin/
  code.ts                  # Figma sandbox: scan orchestration, message handling
src/
  components/
    ui/                    # shadcn/ui primitives
    organisms/             # Feature screens and panels
  lib/
    constants.ts           # Message types, size limits, thresholds
    figmaUtils/            # Issue builders, touch-target heuristics, messaging helpers
    utils/                 # Contrast maths, background inference, clipboard
    apcaContrast/          # APCA scoring
    colorFix/              # Contrast fix suggestions
    wcagCitations/         # Issue to WCAG criterion mapping
    helpers/               # Alt text export and user id helpers
    useIssuesStore/        # Zustand store for UI state and routing
  App.tsx
manifest.json              # Figma plugin manifest
```

The sandbox and the UI only communicate through `postMessage`. Message types are centralised in `MESSAGE_TYPES` in [`src/lib/constants.ts`](src/lib/constants.ts). See [CLAUDE.md](CLAUDE.md) for a fuller architecture walkthrough.

---

## Troubleshooting

- **"Please select a layer to generate alt text for":** select exactly one visible, exportable layer.
- **"Selected layer cannot be exported":** only frames, components and other exportable layers are supported.
- **"Image is too large for processing":** select a smaller layer or scale down your selection.
- **UI changes do not appear in Figma:** make sure `npm run dev` (or `npm run build`) is running, since Figma loads `dist/index.html` from disk.
- **A new network request is blocked:** add the domain to `networkAccess` in `manifest.json`.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Work happens on a dedicated branch per change, and commits follow [Conventional Commits](https://www.conventionalcommits.org/). See [AGENTS.md](AGENTS.md) for the full workflow.

---

## License

MIT, as declared in `package.json`.
