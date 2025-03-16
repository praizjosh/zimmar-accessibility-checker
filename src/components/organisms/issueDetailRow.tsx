import { CircleAlert } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const IssueDetailRow: React.FC<{
  icon?: React.ReactNode;
  label: React.ReactNode;
  value?: React.ReactNode;
  tooltip?: string | boolean;
}> = ({ label, value, icon, tooltip }) => (
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

export default IssueDetailRow;
