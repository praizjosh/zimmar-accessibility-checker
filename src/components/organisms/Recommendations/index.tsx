import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { WcagCitation } from "@/lib/wcagCitations";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

export type RecommendationsProps = {
	recommendations: string[];
	citation?: WcagCitation | null;
};

export default function Recommendations({ recommendations, citation }: RecommendationsProps) {
	const [open, setOpen] = useState(false);
	if (!recommendations || recommendations.length === 0) return null;

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="w-full">
			<CollapsibleTrigger asChild>
				<div
					className={cn(
						"flex cursor-pointer items-center justify-between gap-x-2 rounded-md border border-rose-50/20 px-3 py-2",
						{ "rounded-b-none border-b-0!": open },
					)}
				>
					<div>
						<h4 className="font-open-sans text-sm font-semibold">Recommendations</h4>
						{citation && (
							<a
								href={citation.url}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(event) => event.stopPropagation()}
								className="mt-0.5 inline-flex items-center gap-1 rounded-sm text-xs text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark-shade focus-visible:outline-hidden"
							>
								{citation.citation}
								<span className="sr-only"> (opens in a new tab)</span>

								<ExternalLink aria-hidden="true" className="size-4" />
							</a>
						)}
					</div>
					<Button title="View recommendations" variant="nude" size="sm">
						<ChevronDown
							aria-hidden="true"
							className={`size-4 transition-all duration-75 ease-in-out ${open ? "rotate-180" : ""} `}
						/>
						<span className="sr-only">Toggle Recommendations</span>
					</Button>
				</div>
			</CollapsibleTrigger>

			<CollapsibleContent
				className={cn("rounded-md border border-rose-50/20", {
					"rounded-t-none border-t-0!": open,
				})}
			>
				<div className="p-2.5 text-sm">
					{recommendations.length === 1 ? (
						<p>{recommendations[0]}</p>
					) : (
						<ul className="ml-4 list-disc space-y-4">
							{recommendations.map((recommendation, index) => (
								<li key={index}>{recommendation}</li>
							))}
						</ul>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
