@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install                    # install deps (also run: npm install --save-dev @figma/plugin-typings)
npm run start                  # dev mode: runs tsc:watch + build:main:watch + build:ui:watch concurrently (aliased by npm run dev)
npm run build                  # tsc -b && vite build --emptyOutDir=false && npm run build:main
npm run build:main             # esbuild-bundle plugin/code.ts -> dist/code.js (sandbox bundle only)
npm run build:ui:watch         # vite build --watch --emptyOutDir=false -> dist/index.html (UI bundle, watch mode)
npm run lint                   # eslint src/**/*.{js,jsx,ts,tsx}, --max-warnings=0
npm run lint:fix               # eslint --fix, same scope
npm run preview                # vite preview
```

There is no automated test suite (no jest/vitest/mocha configured). `test.js` and `foundIssues.js` at the repo root are ad-hoc scratch scripts for manually exercising contrast math, not part of any run script.

Commits are enforced via Husky + commitlint (`config/commitlint.config.mjs`, extends `@commitlint/config-conventional`, 80-char header max) and `lint-staged` (runs `lint:fix` + prettier on staged files). Use Conventional Commit messages.

## Architecture

This is a Figma plugin, which means the build produces **two separate JS runtimes that only talk via `postMessage`** — this split drives most of the structure:

- **Plugin sandbox** (`plugin/code.ts` → bundled by esbuild to `dist/code.js`): runs in Figma's plugin sandbox. Has access to the `figma` global API (scene graph, node mutation, `figma.notify`, etc.) but no DOM and no `fetch`. Note it starts with `// @ts-nocheck` — this file is intentionally excluded from type checking.
- **UI iframe** (`src/`, React + Vite → `dist/index.html`): a normal DOM environment (has `fetch`, `window`, `document`) but no access to the `figma` API. Built with `vite-plugin-singlefile` because Figma plugin UI must ship as one self-contained HTML file — check `vite.config.ts`'s `assetsInlineLimit`/`cssCodeSplit` settings before adding new asset-loading patterns. Figma reads `dist/index.html` straight off disk, so the UI must always be built via `vite build` (what `build:ui:watch` runs in watch mode) — the plain `vite` dev server serves from memory over HTTP and never writes `dist/index.html`, so it won't reflect in Figma.

Communication between the two is one-directional message-passing, wrapped in helpers in `src/lib/figmaUtils.ts`:

- UI → sandbox: `postMessageToBackend(type, payload)` → `parent.postMessage({ pluginMessage: {...} }, "*")`, received by `figma.ui.onmessage` in `plugin/code.ts`.
- Sandbox → UI: `postMessageToUI(type, data)` → `figma.ui.postMessage(...)`, received via `window.addEventListener("message", ...)` in UI components.

Message type strings are centralized in `src/lib/constants.ts` (`MESSAGE_TYPES`) and switched on in `plugin/code.ts`'s `figma.ui.onmessage` handler — add new message types there.

`manifest.json` declares `main: dist/code.js`, `ui: dist/index.html`, and `networkAccess.allowedDomains`/`devAllowedDomains` — any new external endpoint the UI calls must be added here or the request will be blocked by Figma at runtime.

### Issue detection

Detection logic lives in `plugin/code.ts` (orchestration: `handleScan` for a full-page scan, `figma.on("selectionchange")` + `handleStartQuickCheck`/`handleCancelQuickCheck` for "quick check" mode that re-scans on every selection change) and is implemented in:

- `src/lib/figmaUtils.ts` — issue builders (`createTypographyIssue`, `createContrastIssue`, `createTouchTargetIssue`) and touch-target heuristics (name/component matching against `TOUCH_TARGET_KEYWORDS`, size vs `MIN_TOUCH_TARGET_SIZE`, spacing vs `MIN_TOUCH_TARGET_SPACING`).
- `src/lib/utils.ts` — WCAG contrast math (`getContrastCompliance`, via the `wcag-contrast` package) and background-color inference (`getBackgroundColorForNode`/`getBackgroundColorForTextNode`), which has to walk up the parent chain and check earlier siblings because Figma nodes don't expose an "effective background color" — there is no single API call for this.

All detected issues are shaped as `IssueX` (`src/lib/types.ts`), tagged with an `IssueType` and `Severity`, and carry a `NodeDataType` payload (the node id, name, and whatever fields are relevant to that issue type) used later for navigation and display.

### AI alt-text generation (separate network path)

This feature crosses the sandbox/UI/network boundary in three hops because only the UI has `fetch` and only the sandbox has `figma.exportAsync`:

1. UI sends `get-image-data` → `plugin/code.ts` calls `generateAltTextForLayer()` (`src/lib/helpers/generateAltTextForLayer.ts`), which validates the selection (single, visible, exportable, within size limits), exports it as a scaled-down PNG, base64-encodes it, and posts a `GENERATE_ALT_TEXT` message back to the UI with the data URL.
2. `AltTextGenerator.tsx` receives that message and does the actual `fetch()` to the external Cloudflare Worker (`https://zimmar-d1.praizjosh.workers.dev/generate-alt-text`), including a per-user id from `src/lib/helpers/getUniqueUserId.ts` for quota tracking.
3. The response (alt text + remaining quota) is rendered directly in that component.

### UI state and routing

`src/lib/useIssuesStore.ts` is a single Zustand store holding all UI state: `issues`, `scanning`, `selectedType`, `currentIndex`, and `currentRoute`. There is no router library — `App.tsx` maps the `Routes` union (`src/lib/types.ts`) to components via a plain object (`RoutesMap`) keyed by `currentRoute`, and screens navigate by calling `navigateTo(route)` on the store. `navigateToIssue`/`updateIssue`/`getIssueGroupList` on the store are how issue list screens page through and mutate scan results (including round-tripping a `navigate`/`updateFontSize` message back to the sandbox to move the Figma viewport or apply a fix).

### UI components and styling

Components under `src/components/ui` are shadcn/ui primitives (`components.json`: style `default`, base color `stone`, no CSS variables) composed with Tailwind + Radix; `src/components/organisms` holds the plugin's actual feature screens/panels. Class composition goes through the `cn()` helper (`src/lib/utils.ts`, `clsx` + `tailwind-merge`), and variant styling uses `class-variance-authority`. The path alias `@/*` maps to `src/*` (defined in both `tsconfig.app.json` and `vite.config.ts` — keep them in sync if it changes).
