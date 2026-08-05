import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";

export type InfoPopoverProps = {
  title?: string;
  content: string;
  /**
   * Which edge of the trigger the content aligns to. Defaults to "end" for
   * triggers near the panel's right edge (e.g. a header icon); triggers
   * positioned mid-row with room to their right should pass "start" instead,
   * otherwise the content anchors past the trigger's left side and overlaps
   * whatever precedes it.
   */
  align?: "start" | "center" | "end";
};

export default function InfoPopover({
  title,
  content,
  align = "end",
}: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger aria-label={title ? `About ${title}` : "More info"}>
        <Info className="ml-2 size-5 text-grey hover:text-accent" />
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
