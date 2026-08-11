import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WcagCitation } from "@/lib/wcagCitations";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export type RecommendationsProps = {
	recommendations: string[];
	/**
	 * Shown as a link under the "Recommendations" heading, in the trigger row
	 * itself rather than inside CollapsibleContent - so it stays visible even
	 * while collapsed, unlike the recommendation bullets it sits above. Optional
	 * since not every caller resolves a citation (e.g. no selectedType yet).
	 */
	citation?: WcagCitation | null;
};

export default function Recommendations({ recommendations, citation }: RecommendationsProps) {
	const [open, setOpen] = useState(false);
	if (!recommendations || recommendations.length === 0) return null;

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="w-full">
			<CollapsibleTrigger asChild>
				<div className="flex cursor-pointer items-center justify-between space-x-4 rounded-md border border-rose-50/20 px-4 py-2">
					<div>
						<h4 className="font-open-sans text-sm font-semibold">Recommendations</h4>
						{citation && (
							<a
								href={citation.url}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(event) => event.stopPropagation()}
								className="mt-0.5 inline-block text-xs text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
							>
								{citation.citation}
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

			<CollapsibleContent className="my-2">
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
