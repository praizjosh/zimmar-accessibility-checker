import RadioToggle from "@/components/organisms/RadioToggle";
import { DEVICE_TYPE_LABELS, DEVICE_TYPES } from "@/lib/constants";
import { DeviceType } from "@/lib/types";
import { ReactNode } from "react";

export type DeviceTypeToggleProps = {
	value: DeviceType;
	onChange: (device: DeviceType) => void;
	label?: ReactNode;
};

const options = DEVICE_TYPES.map((device) => ({
	value: device,
	label: DEVICE_TYPE_LABELS[device],
	title: `Designing for ${DEVICE_TYPE_LABELS[device]} devices`,
}));

export default function DeviceTypeToggle({ value, onChange, label }: DeviceTypeToggleProps) {
	return (
		<RadioToggle
			value={value}
			onChange={onChange}
			options={options}
			ariaLabel="Device type"
			label={label}
		/>
	);
}
