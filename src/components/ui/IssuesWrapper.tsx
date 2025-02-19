import { useEffect, useState } from "react";
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
import { IssueType, IssueX } from "@/lib/types";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { ISSUE_RECOMMENDATIONS } from "@/lib/schemas";

export default function IssuesWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isQuickCheckActive, setIsQuickCheckActive] = useState<boolean>(false);
  const {
    currentIndex,
    singleIssue,
    selectedType,
    navigateTo,
    setSingleIssue,
    navigateToIssue,
    getIssueGroupList,
    // rescanIssues,
  } = useIssuesStore();

  onmessage = (event) => {
    const { type, data } = event.data.pluginMessage;

    if (type === "detected-issue") {
      // console.log("detectedIssues onmessage: ", data);
      const singleIssue = data.filter(
        (issue: IssueX) =>
          issue.type?.toLowerCase() === selectedType.toLowerCase(),
      );

      if (singleIssue.length === 0) {
        // console.log("No issues found for selected type:", selectedType);
        setSingleIssue(null);
        return;
      }

      // console.log("singleIssue filtered: ", singleIssue);
      setSingleIssue(singleIssue[0] || data[0]); // Fallback to the first issue
    }

    if (type === "quickcheck-active") {
      // console.log("quickcheck-active onmessage frm backend: ", data);
      setIsQuickCheckActive(data);
    }
  };

  useEffect(() => {
    navigateToIssue(0); // Navigate to the first issue when Issue view has been navigated to
  }, [navigateToIssue]);

  const handleBackBtnClick = () => {
    if (isQuickCheckActive) {
      navigateTo("INDEX");
      setSingleIssue(null);

      postMessageToBackend("cancel-quickcheck");
    } else {
      navigateTo("ISSUE_OVERVIEW_LIST_VIEW");
    }
  };

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
    <div className="size-full last:!pb-10">
      <div className="grid">
        <div className="flex w-full items-center justify-start gap-x-0.5">
          <Button
            title="Back to Home"
            variant="nude"
            size={"icon"}
            className="!w-fit transition-transform delay-100 ease-in-out hover:!-translate-x-0.5 hover:text-accent"
            onClick={handleBackBtnClick}
          >
            <ChevronLeft className="!size-6" />
          </Button>
          <p className="capitalize tracking-wide">{type ?? selectedType}</p>
        </div>

        {(selectedType === "Touch Target Size" ||
          selectedType === "Touch Target Spacing") && (
          <div className="ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="ml-2 size-5 text-gray" />
                </TooltipTrigger>
                <TooltipContent
                  avoidCollisions
                  align="start"
                  alignOffset={-290}
                  className="w-full max-w-80 text-pretty p-5"
                >
                  <div className="space-y-2">
                    <h5 className="mb-3 text-lg font-medium leading-none tracking-tight text-accent">
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

        <Separator className="my-2 h-px !bg-rose-50/10" />
      </div>

      {issueGroupList.length > 0 ? (
        <>
          {description && (
            <p className="my-4 text-pretty px-3 font-open-sans text-lg font-medium text-gray">
              {description}
            </p>
          )}

          {children}

          {recommendations && recommendations.length > 0 && (
            <Collapsible className="mb-6">
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between space-x-4 rounded-md border border-rose-50/40 px-4 py-2">
                  <h4 className="font-open-sans text-sm font-semibold">
                    Recommendations
                  </h4>
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

          <div className="flex w-full items-center justify-between space-x-2">
            {/* Pagination */}
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
        <>
          {singleIssue?.description && (
            <p className="my-4 text-pretty px-3 font-open-sans text-lg font-medium text-gray">
              {singleIssue?.description}
            </p>
          )}

          {children}

          {singleIssue && recommendations && recommendations.length > 0 && (
            <Collapsible className="mb-6">
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between space-x-4 rounded-md border border-rose-50/40 px-4 py-2">
                  <h4 className="font-open-sans text-sm font-semibold">
                    Recommendations
                  </h4>
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
        </>
      )}
    </div>
  );
}
