import { DEVICE_TYPE_LABELS } from "@/lib/constants";
import { DeviceType, TargetLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ScanSettingsReadoutProps = {
	targetLevel: TargetLevel;
	deviceType: DeviceType;
	className?: string;
};

export default function ScanSettingsReadout({
	targetLevel,
	deviceType,
	className,
}: ScanSettingsReadoutProps) {
	return (
		<p className={cn("text-right text-xs text-grey", className)}>
			Scanning against {targetLevel} · {DEVICE_TYPE_LABELS[deviceType]}
		</p>
	);
}
