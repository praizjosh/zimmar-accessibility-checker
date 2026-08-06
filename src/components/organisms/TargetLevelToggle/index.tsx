import { Button } from "@/components/ui/button";
import { TARGET_LEVELS } from "@/lib/constants";
import { TargetLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type TargetLevelToggleProps = {
  value: TargetLevel;
  onChange: (level: TargetLevel) => void;
  label?: ReactNode;
};

export default function TargetLevelToggle({
  value,
  onChange,
  label,
}: TargetLevelToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {label}
      <div
        role="radiogroup"
        aria-label="Target compliance level"
        className="inline-flex items-center gap-x-1"
      >
        {TARGET_LEVELS.map((level) => (
          <Button
            key={level}
            type="button"
            title={`Target WCAG ${level}`}
            role="radio"
            aria-checked={value === level}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs",
              value === level && "bg-dark text-accent ring-1 ring-accent",
            )}
            onClick={() => onChange(level)}
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );
}
