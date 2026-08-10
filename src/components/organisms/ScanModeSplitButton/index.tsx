import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, Files, Radar } from "lucide-react";
import { useState } from "react";

export type ScanModeSplitButtonProps = {
	scanning: boolean;
	onScanPage: () => void;
	onScanFile: () => void;
	hasSeenFileScanOption: boolean;
	onOpenMenu: () => void;
	/** False on a single-page file, where "Scan entire file" would be identical to "Scan entire page" - collapses to a plain button with no caret at all rather than an empty/pointless dropdown. */
	showFileScanOption: boolean;
};

export default function ScanModeSplitButton({
	scanning,
	onScanPage,
	onScanFile,
	hasSeenFileScanOption,
	onOpenMenu,
	showFileScanOption,
}: ScanModeSplitButtonProps) {
	// Controlled (unlike ScanSettingsPopover's uncontrolled Popover) because
	// selecting the one menu item must both run the scan and close the popover
	// immediately - a plain button inside PopoverContent doesn't auto-close it.
	const [open, setOpen] = useState(false);

	const primaryButton = (
		<Button
			className={cn("h-full flex-1 bg-accent", showFileScanOption && "rounded-r-none")}
			title="Scan design for accessibility issues"
			onClick={onScanPage}
			disabled={scanning}
		>
			<Radar aria-hidden="true" />
			<span>Scan entire page</span>
		</Button>
	);

	if (!showFileScanOption) {
		return <div className="flex flex-1">{primaryButton}</div>;
	}

	return (
		<div className="flex flex-1">
			{primaryButton}

			<Popover
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (next) onOpenMenu();
				}}
			>
				<PopoverTrigger
					title="More scan options"
					aria-label="More scan options"
					disabled={scanning}
					className="relative flex h-full w-9 shrink-0 items-center justify-center rounded-l-none rounded-r-md border-l border-primary-foreground/50 bg-accent text-primary-foreground transition-colors hover:bg-[#2980b9] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark-shade focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
				>
					<ChevronDown aria-hidden="true" className="size-4" />
					{!hasSeenFileScanOption && (
						<span
							data-testid="file-scan-option-new-badge"
							aria-hidden="true"
							className="absolute top-0.5 right-0.5 size-2 rounded-full bg-amber-400 ring-2 ring-dark"
						/>
					)}
				</PopoverTrigger>
				<PopoverContent align="end" className="w-64 p-1">
					<button
						type="button"
						title="Scan every page in this file for accessibility issues"
						className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-grey transition-colors hover:bg-dark-shade hover:text-accent focus-visible:bg-dark-shade focus-visible:text-accent focus-visible:outline-hidden"
						onClick={() => {
							setOpen(false);
							onScanFile();
						}}
					>
						<Files aria-hidden="true" className="size-4" />
						<span>Scan entire file</span>
					</button>
				</PopoverContent>
			</Popover>
		</div>
	);
}
