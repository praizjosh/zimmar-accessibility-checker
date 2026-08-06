import DeviceTypeToggle from "@/components/organisms/DeviceTypeToggle";
import TargetLevelToggle from "@/components/organisms/TargetLevelToggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DeviceType, TargetLevel } from "@/lib/types";
import { Settings } from "lucide-react";

export type ScanSettingsPopoverProps = {
	targetLevel: TargetLevel;
	onTargetLevelChange: (level: TargetLevel) => void;
	deviceType: DeviceType;
	onDeviceTypeChange: (device: DeviceType) => void;
};

export default function ScanSettingsPopover({
	targetLevel,
	onTargetLevelChange,
	deviceType,
	onDeviceTypeChange,
}: ScanSettingsPopoverProps) {
	return (
		<Popover>
			<PopoverTrigger
				title="Scan settings"
				aria-label="Scan settings"
				className="flex size-11 shrink-0 items-center justify-center rounded-md border border-rose-50/20 text-grey transition-colors hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark-shade focus-visible:outline-hidden"
			>
				<Settings aria-hidden="true" className="size-5" />
			</PopoverTrigger>
			<PopoverContent align="end" className="w-64 space-y-4">
				<TargetLevelToggle
					value={targetLevel}
					onChange={onTargetLevelChange}
					label={<span className="text-sm font-medium text-grey">WCAG target</span>}
				/>
				<DeviceTypeToggle
					value={deviceType}
					onChange={onDeviceTypeChange}
					label={<span className="text-sm font-medium text-grey">Designing for</span>}
				/>
			</PopoverContent>
		</Popover>
	);
}
