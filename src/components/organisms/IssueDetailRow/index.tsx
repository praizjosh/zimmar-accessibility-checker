import { ReactNode } from "react";
import InfoPopover from "@/components/organisms/InfoPopover";

export type IssueDetailRowProps = {
	icon?: ReactNode;
	label: ReactNode;
	value?: ReactNode;
	tooltip?: string | boolean;
};

export default function IssueDetailRow({ label, value, icon, tooltip }: IssueDetailRowProps) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<div className="flex items-center text-sm">
				{icon}
				{label}
			</div>
			<div className="flex items-center text-sm">
				{typeof tooltip === "string" && <InfoPopover content={tooltip} align="center" />}
				{value}
			</div>
		</div>
	);
}
