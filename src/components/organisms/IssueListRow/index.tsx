import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export type IssueListRowProps = {
	title: string;
	ariaLabel: string;
	description: ReactNode;
	leading: ReactNode;
	trailing: ReactNode;
	onClick: () => void;
};

export default function IssueListRow({
	title,
	ariaLabel,
	description,
	leading,
	trailing,
	onClick,
}: IssueListRowProps) {
	return (
		<li
			title={title}
			className="group flex items-center justify-between rounded-xl border border-rose-50/10 bg-dark-shade text-grey transition-all duration-200 ease-in-out hover:cursor-pointer hover:ring-1 hover:ring-accent"
		>
			<button
				className="flex w-full flex-col gap-y-2 px-4 py-3.5 text-left"
				aria-label={ariaLabel}
				onClick={onClick}
			>
				<div className="flex w-full items-center justify-between gap-x-2">
					<div className="flex w-full items-center justify-start space-x-2.5 text-xs">
						{leading}
					</div>

					<div className="flex w-auto items-center justify-end space-x-2">{trailing}</div>
				</div>

				<div className="flex w-full items-center justify-between gap-3">
					<span className="w-full max-w-62.5 text-sm font-medium text-pretty group-hover:text-white">
						{description}
					</span>

					<ChevronRight
						strokeWidth={1.5}
						aria-hidden="true"
						className="size-5 shrink-0 text-rose-50/55 transition-transform delay-100 ease-in-out group-hover:translate-x-1 group-hover:text-accent"
					/>
				</div>
			</button>
		</li>
	);
}
