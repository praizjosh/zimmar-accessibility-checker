import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KeyboardEvent, ReactNode, useRef } from "react";

export type RadioToggleOption<TValue extends string> = {
  value: TValue;
  label: ReactNode;
  title: string;
};

export type RadioToggleProps<TValue extends string> = {
  value: TValue;
  onChange: (value: TValue) => void;
  options: readonly RadioToggleOption<TValue>[];
  ariaLabel: string;
  label?: ReactNode;
};

export default function RadioToggle<TValue extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  label,
}: RadioToggleProps<TValue>) {
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusAndSelect(index: number) {
    const nextIndex = (index + options.length) % options.length;
    radioRefs.current[nextIndex]?.focus();
    onChange(options[nextIndex].value);
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
        aria-label={ariaLabel}
        className="inline-flex items-center gap-x-1.5"
      >
        {options.map((option, index) => (
          <Button
            key={option.value}
            ref={(node) => {
              radioRefs.current[index] = node;
            }}
            type="button"
            title={option.title}
            role="radio"
            aria-checked={value === option.value}
            tabIndex={value === option.value ? 0 : -1}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs focus-visible:ring-accent focus-visible:ring-offset-dark-shade dark:focus-visible:ring-accent dark:focus-visible:ring-offset-dark-shade",
              value === option.value &&
                "bg-dark text-accent ring-1 ring-accent",
            )}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleRadioKeyDown(event, index)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
