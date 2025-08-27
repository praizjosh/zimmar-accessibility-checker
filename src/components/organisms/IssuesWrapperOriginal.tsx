import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Separator from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { ISSUE_RECOMMENDATIONS } from "@/lib/issuesData";
import { IssueType, IssueX } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Info } from "lucide-react";
import { useEffect, useState } from "react";

export default function IssuesWrapperOriginal({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [IsQuickCheckModeActive, setIsQuickCheckModeActive] =
    useState<boolean>(false);
  const {
    currentIndex,
    singleIssue,
    selectedType,
    navigateTo,
    setSingleIssue,
    navigateToIssue,
    getIssueGroupList,
  } = useIssuesStore();

  onmessage = (event) => {
    const { type, data } = event.data.pluginMessage;

    if (type === "detected-issue") {
      const singleIssue = data.filter(
        (issue: IssueX) =>
          issue.type?.toLowerCase() === selectedType.toLowerCase(),
      );

      if (singleIssue.length === 0) {
        setSingleIssue(null);
        return;
      }

      setSingleIssue(singleIssue[0] || data[0]); // Fallback to the first issue
    }

    if (type === "no-selection") {
      if (data) return setSingleIssue(null);
    }

    if (type === "quickcheck-active") {
      setIsQuickCheckModeActive(data);
    }

    if (type === "single-issue") {
      const singleIssue = data.filter(
        (issue: IssueX) =>
          issue.type?.toLowerCase() === selectedType.toLowerCase(),
      );

      setSingleIssue(singleIssue[0]);
    }
  };

  useEffect(() => {
    navigateToIssue(0); // Navigate to the first issue when Issue view has been navigated to
  }, [navigateToIssue]);

  const handleBackBtnClick = () => {
    if (IsQuickCheckModeActive) {
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
    <div className="flex size-full flex-col items-start gap-y-4 last:!pb-5">
      <div className="grid w-full">
        <div className="flex w-full items-center justify-between gap-x-0.5">
          <div className="group inline-flex items-center justify-start gap-x-0.5">
            <Button
              title="Go back"
              variant="nude"
              size={"icon"}
              className="!w-fit gap-0.5 group-hover:text-accent"
              onClick={handleBackBtnClick}
            >
              <ChevronLeft
                strokeWidth={1.5}
                className="!size-6 transition-transform delay-100 ease-in-out group-hover:!-translate-x-0.5"
              />
              <span className="text-base">Back</span>
            </Button>
          </div>

          <div className="inline-flex items-center gap-x-1">
            <span className="font-medium capitalize tracking-wide">
              {type ?? selectedType}
            </span>

            {(selectedType === "Touch Target Size" ||
              selectedType === "Touch Target Spacing") && (
              <div className="ml-auto">
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
                        <h5 className="mb-2.5 text-lg font-medium leading-none tracking-tight text-accent">
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
                            these results as a starting point for your
                            accessibility review. Please use the results as a
                            reference and verify them manually.
                          </p>
                        </>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-2 h-px !bg-rose-50/10" />

        {issueGroupList.length > 0 && (
          <div className="flex w-full items-center justify-end space-x-2">
            {/* Pagination */}
            <Button
              title="Goto previous issue"
              variant="ghost"
              size={"icon"}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2.5"
            >
              <ChevronLeft strokeWidth={1.5} className="!size-6" />
            </Button>
            <span className="text-sm text-slate-200">
              Issue {currentIndex + 1} of {issueGroupList.length}
            </span>
            <Button
              title="Goto next issue"
              variant="ghost"
              size={"icon"}
              onClick={handleNext}
              disabled={currentIndex === issueGroupList.length - 1}
              className="p-2.5"
            >
              <ChevronRight strokeWidth={1.5} className="!size-6" />
            </Button>
          </div>
        )}
      </div>

      {issueGroupList.length > 0 ? (
        <>
          {description && (
            <p className="px-3 font-open-sans font-medium text-grey">
              {description}
            </p>
          )}

          {children}

          {recommendations && recommendations.length > 0 && (
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between space-x-4 rounded-md border border-rose-50/40 px-4 py-2">
                  <h4 className="font-open-sans text-sm font-semibold">
                    Recommendations
                  </h4>
                  <Button title="View recommendations" variant="nude" size="sm">
                    <ChevronsUpDown strokeWidth={1.5} className="size-4" />
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
      ) : (
        <>
          {singleIssue?.description && (
            <p className="px-3 font-open-sans font-medium text-grey">
              {singleIssue?.description}
            </p>
          )}

          {children}

          {singleIssue && recommendations && recommendations.length > 0 && (
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <div className="flex cursor-pointer items-center justify-between space-x-4 rounded-md border border-rose-50/40 px-4 py-2">
                  <h4 className="font-open-sans text-sm font-semibold">
                    Recommendations
                  </h4>
                  <Button title="View recommendations" variant="nude" size="sm">
                    <ChevronsUpDown className="size-4" />
                    <span className="sr-only">Toggle Recommendations</span>
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
