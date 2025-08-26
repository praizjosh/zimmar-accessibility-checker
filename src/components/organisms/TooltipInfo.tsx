import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

/**
 * TooltipInfo component for displaying tooltips with info icon.
 *
 * @param {string} title - The title of the tooltip.
 * @param {string} content - The content of the tooltip.
 * @returns {JSX.Element}
 */
export default function TooltipInfo({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Info className="ml-2 size-5 text-grey hover:text-accent" />
        </TooltipTrigger>
        <TooltipContent
          avoidCollisions
          align="start"
          alignOffset={-290}
          className="w-full max-w-80 text-pretty p-5"
        >
          <div className="space-y-2">
            <h5 className="mb-2.5 text-lg font-medium text-accent">{title}</h5>
            <p>{content}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
