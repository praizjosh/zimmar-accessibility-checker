import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

export type ScreenHeaderProps = {
	onBack: () => void;
	children: ReactNode;
};

export default function ScreenHeader({ onBack, children }: ScreenHeaderProps) {
	return (
		<div className="flex w-full items-center justify-between">
			<div className="group inline-flex items-center justify-start gap-x-0.5">
				<Button
					title="Go back"
					variant="nude"
					size="icon"
					className="w-fit! gap-0.5 group-hover:text-accent"
					onClick={onBack}
				>
					<ChevronLeft
						strokeWidth={1.5}
						aria-hidden="true"
						className="size-6! transition-transform delay-100 ease-in-out group-hover:-translate-x-0.5!"
					/>
					<span className="text-base">Back</span>
				</Button>
			</div>

			{children}
		</div>
	);
}
