import { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IssueDetailRowType = {
  icon?: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  tooltip?: string | boolean;
};

export default function IssueDetailRow({
  label,
  value,
  icon,
  tooltip,
}: IssueDetailRowType) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center text-sm">
        {icon}
        {label}
      </div>
      <div className="flex items-center text-sm">
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CircleAlert className="ml-2 size-4" />
              </TooltipTrigger>
              <TooltipContent
                avoidCollisions
                align="end"
                className="w-full max-w-52 text-pretty"
              >
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {value}
      </div>
    </div>
  );
}
