# Zimmar Accessibility Checker Figma Plugin

A Figma plugin to help designers and developers ensure their designs are accessible. This plugin provides automated checks for text contrast, typography, and generates alt text for selected layers using AI.

---

## Features

- **Contrast Checking:** Automatically detects text layers with insufficient contrast according to WCAG standards.
- **Typography Analysis:** Flags text layers that are too small for readability.
- **AI-Powered Alt Text:** Generate descriptive alt text for images and exportable layers using AI.
- **User-Friendly Notifications:** Informs users of issues and guides them to resolve accessibility problems.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [Figma Desktop App](https://www.figma.com/downloads/)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended)

### Installation

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/praizjosh/zimmar-accessibility-checker.git
   
   cd zimmar-accessibility-checker
   ```

2. **Install Dependencies:**
   ```sh
   npm install
   ```

3. **Install Figma Plugin Typings:**
   ```sh
   npm install --save-dev @figma/plugin-typings
   ```

---

## Development

### Compile TypeScript

To compile TypeScript to JavaScript and watch for changes:

```sh
npm run watch
```

Or use VS Code:  
Go to `Terminal > Run Build Task...` and select `npm: watch`.

### Build for Production

```sh
npm run build
```

### Linting

This project uses ESLint with recommended rules for React and TypeScript.  
To lint your code:

```sh
npm run lint
```

---

## Usage

1. **Open Figma and run the plugin.**
2. **Select a layer** (frame, component, or exportable object).
3. **Generate Alt Text:**  
   - The plugin will check if the layer is visible, exportable, and within size limits.
   - If valid, it will export the layer as a PNG, encode it, and send it for AI analysis.
   - Alt text will be generated and displayed in the plugin UI.

4. **Review Accessibility Issues:**  
   - The plugin will highlight text layers with contrast or typography issues.
   - Follow the notifications to fix any problems.

---

## File Structure

```
src/
  lib/
    helpers/
      generateAltTextForLayer.ts   # Main logic for generating alt text
    ...
  components/
    ...
  App.tsx
  main.tsx
  ...
foundIssues.js                     # Contains sample accessibility issues
vite.config.ts
...
```

---

## Key Functions

- [`generateAltTextForLayer`](src/lib/helpers/generateAltTextForLayer.ts):  
  Handles selection validation, image export, size checks, and posts a message to the UI for AI-powered alt text generation.

---

## Troubleshooting

- **"Please select a layer to generate alt text for":**  
  Make sure you have exactly one visible, exportable layer selected.
- **"Selected layer cannot be exported":**  
  Only frames, components, and exportable layers are supported.
- **"Image is too large for processing":**  
  Try selecting a smaller layer or scaling down your selection.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)

---

## Resources