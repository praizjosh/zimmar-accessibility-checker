console.log("Navigate to IssuesWrapper.tsx");

import { useEffect } from "react";
import useIssuesStore from "@/lib/useIssuesStore";
import { Button } from "./button";
import Separator from "./separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MIN_FONT_SIZE } from "@/lib/constants";
import { IssueType } from "@/lib/types";

type IssueRecommendations = {
  [key: string]: string[];
};

const ISSUE_RECOMMENDATIONS: IssueRecommendations[] = [
  {
    contrast: [
      "Increase the contrast ratio to at least 4.5:1 for normal text and 3:1 for large text.",
      "To improve contrast, use a darker text color or a lighter background color",
    ],
  },
  {
    typography: [
      `Ensure font size is at least ${MIN_FONT_SIZE}px to enhance readability and comply with WCAG "AA" standards.`,
      "Use a minimum font size of 16px for body text and 14px for buttons and other interactive elements.",
    ],
  },
  {
    "touch target size": [
      "Increase the touch target size to at least 44x44 pixels to ensure better accessibility on mobile devices. Maintain adequate spacing between interactive elements.",
    ],
  },
  {
    "touch target spacing": [
      "The touch target spacing should be at least 8px to the nearest element in all directions.",
    ],
  },
];

export default function IssuesWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    currentIndex,
    selectedType,
    navigateTo,
    navigateToIssue,
    getIssueGroupList,
    // rescanIssues,
  } = useIssuesStore();

  useEffect(() => {
    navigateToIssue(0); // Navigate to the first issue when Issue view has been navigated to
  }, [navigateToIssue]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigateToIssue(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < issueGroupList.length - 1) {
      navigateToIssue(currentIndex + 1);
    }
  };

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex];
  const { type, description } = currentIssue ?? {};
  function getIssueRecommendations(issueType: IssueType | string) {
    const issue = ISSUE_RECOMMENDATIONS.find(
      (entry) => entry[issueType.toLowerCase()] !== undefined,
    );
    return issue ? issue[issueType.toLowerCase()] : null;
  }

  const recommendations = getIssueRecommendations(selectedType);

  return (
    <div className="w-full px-3">
      <div className="flex w-full items-center justify-start gap-x-0.5">
        <Button
          title="Back to Issues Overview"
          variant="nude"
          size={"icon"}
          className="!w-fit transition-transform delay-100 ease-in-out hover:!-translate-x-0.5 hover:text-plum-light"
          onClick={() => {
            navigateTo("INDEX");
            // rescanIssues();
          }}
        >
          <ChevronLeft className="!size-6" />
        </Button>
        <p className="text-lg capitalize tracking-wide text-white">
          {type !== undefined && type}
        </p>

        {(selectedType === "Touch Target Size" ||
          selectedType === "Touch Target Spacing") && (
          <div className="ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="ml-2 size-5 text-sky-500" />
                </TooltipTrigger>
                <TooltipContent
                  avoidCollisions
                  align="start"
                  alignOffset={-290}
                  className="w-full max-w-80 text-pretty p-5"
                >
                  <div className="space-y-2">
                    <h5 className="mb-3 text-lg font-medium leading-none tracking-tight">
                      About Touch Target Detection
                    </h5>
                    <>
                      Our touch target analysis helps identify potential
                      accessibility issues related to interactive elements.
                      While we strive for accuracy, this is an experimental
                      feature that uses:
                      <ul className="ml-4 mt-2 list-disc">
                        <li>
                          Interactive element identification through common
                          keywords (button, link, touch, btn).
                        </li>
                        <li>
                          Analysis of spacing and proximity between design
                          elements
                        </li>
                      </ul>
                      <p className="mt-2">
                        As this is an automated process, we recommend using
                        these results as a starting point for your accessibility
                        review. Please use the results as a reference and verify
                        them manually.
                      </p>
                    </>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <Separator className="my-2 h-px !bg-rose-50/10" />

      {issueGroupList.length > 0 ? (
        <>
          <p className="mb-2.5 text-pretty px-3 text-lg font-semibold text-plum-light">
            {description}
          </p>

          {children}

          {recommendations && recommendations.length > 0 && (
            <Collapsible className="mb-6">
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between space-x-4 rounded-md border border-rose-50/40 px-4 py-2">
                  <h4 className="text-sm font-semibold">Recommendations</h4>
                  <Button title="View recommendations" variant="nude" size="sm">
                    <ChevronsUpDown className="size-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="my-2">
                <div className="p-2.5 text-sm">
                  {Array.isArray(recommendations) &&
                  recommendations.length === 1 ? (
                    <p>{recommendations[0]}</p>
                  ) : Array.isArray(recommendations) ? (
                    <ul className="ml-4 list-disc space-y-4">
                      {recommendations.map(
                        (recommendation: string, index: number) => (
                          <li key={index}>{recommendation}</li>
                        ),
                      )}
                    </ul>
                  ) : null}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="my-4 flex w-full items-center justify-between space-x-2">
            <Button
              title="Goto previous issue"
              variant="ghost"
              size={"icon"}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2.5"
            >
              <ChevronLeft className="!size-6" />
            </Button>
            <span className="text-sm text-slate-200">
              {currentIndex + 1} of {issueGroupList.length}
            </span>
            <Button
              title="Goto next issue"
              variant="ghost"
              size={"icon"}
              onClick={handleNext}
              disabled={currentIndex === issueGroupList.length - 1}
              className="p-2.5"
            >
              <ChevronRight className="!size-6" />
            </Button>
          </div>
        </>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
