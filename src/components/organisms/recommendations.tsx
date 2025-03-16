import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";

export default function Recommendations({
  recommendations,
}: {
  recommendations: string[];
}) {
  const [open, setOpen] = useState(false);
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <div className="flex cursor-pointer items-center justify-between space-x-4 rounded-md border border-rose-50/20 px-4 py-2">
          <h4 className="font-open-sans text-sm font-semibold">
            Recommendations
          </h4>
          <Button title="View recommendations" variant="nude" size="sm">
            <ChevronDown
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
