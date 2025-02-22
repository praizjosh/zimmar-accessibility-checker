import { getContrastScore } from "@/lib/utils";
import React, { useState } from "react";

const ContrastChecker = () => {
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#FFFFFF");
  const [score, setScore] = useState("AA");

  const handleCheckContrast = () => {
    const contrastScore = getContrastScore(foreground, background);
    setScore(contrastScore);
  };

  return (
    <div className="max-w-sm space-y-4 rounded-md border p-4">
      <h2 className="text-lg font-bold">WCAG Contrast Checker</h2>
      <div className="space-y-2">
        <label className="block">
          Foreground Color:
          <input
            aria-label="Select Foreground Color"
            type="color"
            value={foreground}
            onChange={(e) => setForeground(e.target.value)}
            className="ml-2"
          />
        </label>
        <label className="block">
          Background Color:
          <input
            aria-label="Select Background Color"
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="ml-2"
          />
        </label>
      </div>
      <button
        onClick={handleCheckContrast}
        className="w-full rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
      >
        Check Contrast
      </button>
      <p className="text-center font-medium text-red-500">
        Contrast Score: <span className="font-bold">{score}</span>
      </p>
    </div>
  );
};

export default ContrastChecker;
