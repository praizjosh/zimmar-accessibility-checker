import RadioToggle from "@/components/organisms/RadioToggle";
import { TARGET_LEVELS } from "@/lib/constants";
import { TargetLevel } from "@/lib/types";
import { ReactNode } from "react";

export type TargetLevelToggleProps = {
  value: TargetLevel;
  onChange: (level: TargetLevel) => void;
  label?: ReactNode;
};

const options = TARGET_LEVELS.map((level) => ({
  value: level,
  label: level,
  title: `Target WCAG ${level}`,
}));

export default function TargetLevelToggle({
  value,
  onChange,
  label,
}: TargetLevelToggleProps) {
  return (
    <RadioToggle
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel="Target compliance level"
      label={label}
    />
  );
}
