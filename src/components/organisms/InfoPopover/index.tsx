import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";

export type InfoPopoverProps = {
	title?: string;
	content: string;
	align?: "start" | "center" | "end";
};

export default function InfoPopover({ title, content, align = "end" }: InfoPopoverProps) {
	return (
		<Popover>
			<PopoverTrigger aria-label={title ? `About ${title}` : "More info"}>
				<Info aria-hidden="true" className="ml-2 size-5 text-grey hover:text-accent" />
			</PopoverTrigger>
			<PopoverContent align={align} className="w-64 text-pretty">
				<div className="space-y-2">
					{title && <h5 className="font-medium text-accent">{title}</h5>}
					<p className="text-sm">{content}</p>
				</div>
			</PopoverContent>
		</Popover>
	);
}
