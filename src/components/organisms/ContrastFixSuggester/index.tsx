import TargetLevelToggle from "@/components/organisms/TargetLevelToggle";
import { Button } from "@/components/ui/button";
import { ColorFixDirection, ColorFixSuggestion } from "@/lib/colorFix";
import { TargetLevel } from "@/lib/types";
import { cn, figmaRGBtoHex, getSeverityStyles } from "@/lib/utils";
import { Check } from "lucide-react";

export type ContrastFixSuggesterProps = {
  targetLevel: TargetLevel;
  onTargetLevelChange: (level: TargetLevel) => void;
  foregroundSuggestion: ColorFixSuggestion | null;
  backgroundSuggestion: ColorFixSuggestion | null;
  backgroundSharedWithCount?: number;
  onSelectSwatchNode: (direction: ColorFixDirection) => void;
  onApplySuggestion: (
    direction: ColorFixDirection,
    suggestion: ColorFixSuggestion,
  ) => void;
};

export default function ContrastFixSuggester({
  targetLevel,
  onTargetLevelChange,
  foregroundSuggestion,
  backgroundSuggestion,
  backgroundSharedWithCount,
  onSelectSwatchNode,
  onApplySuggestion,
}: ContrastFixSuggesterProps) {
  return (
    <div className="grid w-full rounded-xl border border-rose-50/10 bg-dark-shade p-3">
      <div className="mb-2">
        <TargetLevelToggle
          value={targetLevel}
          onChange={onTargetLevelChange}
          label={
            <h4 className="text-sm font-medium text-grey">Suggested fixes</h4>
          }
        />
      </div>

      {!foregroundSuggestion && !backgroundSuggestion ? (
        <p className="text-xs text-grey">
          No {targetLevel}-compliant suggestion found for this pair.
        </p>
      ) : (
        <div className="divide-y divide-rose-50/5">
          {foregroundSuggestion && (
            <div className="py-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-x-2">
                  <Button
                    type="button"
                    variant="nude"
                    size="icon"
                    title="Select the text layer in Figma"
                    className="size-4 shrink-0 rounded border border-white/20 p-0"
                    style={{
                      backgroundColor: figmaRGBtoHex(
                        foregroundSuggestion.color,
                      ),
                    }}
                    onClick={() => onSelectSwatchNode("foreground")}
                  />
                  {foregroundSuggestion.adjustment === "darker"
                    ? "Darken"
                    : "Lighten"}{" "}
                  text
                </span>
                <span className="inline-flex items-center gap-x-1 font-mono text-green-500">
                  <Check aria-hidden="true" className="size-4" />
                  {foregroundSuggestion.ratio.toFixed(2)}:1
                </span>
              </div>
              <div className="mt-1.5 flex justify-end">
                <Button
                  type="button"
                  title={`${
                    foregroundSuggestion.adjustment === "darker"
                      ? "Darken"
                      : "Lighten"
                  } the text colour`}
                  size="sm"
                  variant="default"
                  className="h-6 px-3 text-xs"
                  onClick={() =>
                    onApplySuggestion("foreground", foregroundSuggestion)
                  }
                >
                  Apply
                </Button>
              </div>
            </div>
          )}

          {backgroundSuggestion && (
            <div className="py-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-x-2">
                  <Button
                    type="button"
                    variant="nude"
                    size="icon"
                    title="Select the background layer in Figma"
                    className="size-4 shrink-0 rounded border border-white/20 p-0"
                    style={{
                      backgroundColor: figmaRGBtoHex(
                        backgroundSuggestion.color,
                      ),
                    }}
                    onClick={() => onSelectSwatchNode("background")}
                  />
                  {backgroundSuggestion.adjustment === "darker"
                    ? "Darken"
                    : "Lighten"}{" "}
                  background
                </span>
                <span className="inline-flex items-center gap-x-1 font-mono text-green-500">
                  <Check aria-hidden="true" className="size-4" />
                  {backgroundSuggestion.ratio.toFixed(2)}:1
                </span>
              </div>
              {Boolean(backgroundSharedWithCount) && (
                <p className={cn("mt-1 text-xs", getSeverityStyles("minor"))}>
                  Shared with {backgroundSharedWithCount} other layer
                  {backgroundSharedWithCount === 1 ? "" : "s"}
                </p>
              )}
              <div className="mt-1.5 flex justify-end">
                <Button
                  type="button"
                  title={`${
                    backgroundSuggestion.adjustment === "darker"
                      ? "Darken"
                      : "Lighten"
                  } the background colour`}
                  size="sm"
                  variant="default"
                  className="h-6 px-3 text-xs"
                  onClick={() =>
                    onApplySuggestion("background", backgroundSuggestion)
                  }
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
