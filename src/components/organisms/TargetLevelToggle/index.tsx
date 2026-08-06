import { Button } from "@/components/ui/button";
import { TARGET_LEVELS } from "@/lib/constants";
import { TargetLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { KeyboardEvent, ReactNode, useRef } from "react";

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
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusAndSelect(index: number) {
    const nextIndex = (index + TARGET_LEVELS.length) % TARGET_LEVELS.length;
    radioRefs.current[nextIndex]?.focus();
    onChange(TARGET_LEVELS[nextIndex]);
  }

  function handleRadioKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusAndSelect(index - 1);
        break;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusAndSelect(index + 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {label}
      <div
        role="radiogroup"
        aria-label="Target compliance level"
        className="inline-flex items-center gap-x-1"
      >
        {TARGET_LEVELS.map((level, index) => (
          <Button
            key={level}
            ref={(node) => {
              radioRefs.current[index] = node;
            }}
            type="button"
            title={`Target WCAG ${level}`}
            role="radio"
            aria-checked={value === level}
            tabIndex={value === level ? 0 : -1}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs",
              value === level && "bg-dark text-accent ring-1 ring-accent",
            )}
            onClick={() => onChange(level)}
            onKeyDown={(event) => handleRadioKeyDown(event, index)}
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );
}
