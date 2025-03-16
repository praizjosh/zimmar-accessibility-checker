import { rgb, score } from "wcag-contrast";

/* eslint-disable no-console */
function calculateContrast(foregroundColor, backgroundColor) {
  try {
    return rgb(foregroundColor, backgroundColor);
  } catch (error) {
    console.error("Error calculating contrast ratio:", error);
    return null;
  }
}

const ratio = calculateContrast([236, 236, 236], [29, 39, 52]);

console.log(ratio); // Output: numbers

console.log(score(ratio)); // Output: string

// The actual foregroundColor: [236, 236, 236];
// The actual bgcolor for the node: [29, 39, 52] or #1D2734

// calc grandparent: 246.000000536442, 251.000000238, 254.000000059605
// const obj = {
//   r: 0.11372549086809158,
//   g: 0.15294118225574493,
//   b: 0.20392157137393951,
// };

const obj = {
  r: 1,
  g: 1,
  b: 1,
};

const rectColor = [
  Math.round(obj.r * 255),
  Math.round(obj.g * 255),
  Math.round(obj.b * 255),
];

console.log("rectColor", rectColor);

// Helper function to convert RGB to hex
function rgbToHex(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

console.log("rgbToHex", rgbToHex(obj));
