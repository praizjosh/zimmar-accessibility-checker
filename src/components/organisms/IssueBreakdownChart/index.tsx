import Progress from "@/components/ui/progress";
import ISSUE_TYPE_LABELS from "@/lib/issueTypeLabels";
import { IssueType } from "@/lib/types";

const ISSUE_TYPE_CHART_COLORS: Record<IssueType, string> = {
	CONTRAST: "#3987e5",
	TYPOGRAPHY: "#d95926",
	TOUCH_TARGET_SIZE: "#199e70",
	TOUCH_TARGET_SPACING: "#c98500",
};

export type IssueBreakdownChartItem = {
	type: IssueType;
	count: number;
};

export type IssueBreakdownChartProps = {
	items: IssueBreakdownChartItem[];
};

export default function IssueBreakdownChart({ items }: IssueBreakdownChartProps) {
	const maxCount = Math.max(...items.map((item) => item.count), 1);
	const summary = items
		.map((item) => `${ISSUE_TYPE_LABELS[item.type]}: ${item.count}`)
		.join(", ");

	return (
		<div role="img" aria-label={`Issues by category — ${summary}`} className="space-y-3">
			{items.map((item) => {
				const color = ISSUE_TYPE_CHART_COLORS[item.type];

				return (
					<div key={item.type} aria-hidden="true">
						<div className="mb-1 flex items-center justify-between text-sm">
							<span className="inline-flex items-center gap-x-1.5">
								<span
									className="size-2.5 shrink-0 rounded-full"
									style={{ backgroundColor: color }}
								/>
								<span className="text-grey">{ISSUE_TYPE_LABELS[item.type]}</span>
							</span>
							<span className="font-medium">{item.count}</span>
						</div>
						<Progress
							value={(item.count / maxCount) * 100}
							className="h-2 bg-dark"
							indicatorStyle={{ backgroundColor: color }}
						/>
					</div>
				);
			})}
		</div>
	);
}
