import { useEffect, useState } from "react";
import useIssuesStore from "@/lib/useIssuesStore";
import { Button } from "../ui/button";
import Separator from "../ui/separator";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IssueType, IssueX } from "@/lib/types";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { ISSUE_RECOMMENDATIONS } from "@/lib/schemas";
import Recommendations from "./recommendations";

export default function IssuesWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isQuickCheckActive, setIsQuickCheckActive] = useState(false);
  const {
    currentIndex,
    singleIssue,
    selectedType,
    navigateTo,
    setSingleIssue,
    navigateToIssue,
    getIssueGroupList,
  } = useIssuesStore();

  onmessage = (event: MessageEvent) => {
    const { type, data } = event.data.pluginMessage || {};

    if (type === "detected-issue") {
      const matchingIssues = data.filter(
        (issue: IssueX) =>
          issue.type?.toLowerCase() === selectedType.toLowerCase(),
      );

      if (matchingIssues.length === 0) {
        // console.log("No issues found for selected type:", selectedType);
        setSingleIssue(null);
        return;
      }

      setSingleIssue(matchingIssues[0] || data[0] || null);
      setShowRecommendations(true);
    }

    if (type === "no-selection" && data) {
      setSingleIssue(null);
      setShowRecommendations(!true);
    }

    if (type === "quickcheck-active") {
      setIsQuickCheckActive(data);
    }

    if (type === "single-issue") {
      const matchingIssues = data.filter(
        (issue: IssueX) =>
          issue.type?.toLowerCase() === selectedType.toLowerCase(),
      );
      setSingleIssue(matchingIssues[0] || null);
    }
  };

  useEffect(() => {
    navigateToIssue(0);
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

  const handleNavigation = (direction: "prev" | "next") => {
    if (direction === "prev" && currentIndex > 0) {
      navigateToIssue(currentIndex - 1);
    }
    if (direction === "next" && currentIndex < issueGroupList.length - 1) {
      navigateToIssue(currentIndex + 1);
    }
  };

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex];
  const { type, description } = currentIssue || {};

  const getIssueRecommendations = (issueType: IssueType | string) => {
    const entry = ISSUE_RECOMMENDATIONS.find(
      (item) => item[issueType.toLowerCase()] !== undefined,
    );
    return entry ? entry[issueType.toLowerCase()] : null;
  };

  const recommendations = getIssueRecommendations(selectedType);

  const renderWrapper = (issue: typeof singleIssue | null) => {
    if (!issue) {
      return (
        <p className="text-pretty px-3 font-open-sans text-lg font-medium text-gray">
          No {selectedType} issue detected.
        </p>
      );
    }

    return (
      <>
        {description && (
          <p className="px-3 font-open-sans font-medium text-gray">
            {description}
          </p>
        )}

        {children}

        {showRecommendations && (
          <Recommendations recommendations={recommendations || []} />
        )}
      </>
    );
  };

  return (
    <div className="flex size-full flex-col items-start gap-y-4 last:!pb-5">
      <div className="grid w-full">
        <div className="flex w-full items-center justify-between gap-x-0.5">
          <Button
            title="Back to Home"
            variant="nude"
            size="icon"
            className="!w-fit gap-0.5 group-hover:text-accent"
            onClick={handleBackBtnClick}
          >
            <ChevronLeft className="!size-6 transition-transform group-hover:!-translate-x-0.5" />
            <span className="text-base">Back</span>
          </Button>

          <div className="inline-flex items-center gap-x-1">
            <span className="font-medium capitalize tracking-wide">
              {type ?? selectedType}
            </span>
            {(selectedType === "Touch Target Size" ||
              selectedType === "Touch Target Spacing") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="ml-2 size-5 text-gray hover:text-accent" />
                  </TooltipTrigger>
                  <TooltipContent
                    avoidCollisions
                    align="start"
                    alignOffset={-290}
                    className="w-full max-w-80 text-pretty p-5"
                  >
                    <div className="space-y-2">
                      <h5 className="mb-3 text-lg font-medium text-accent">
                        About Touch Target Detection
                      </h5>
                      <p>
                        Our touch target analysis helps identify potential
                        accessibility issues. This is an experimental feature
                        and should be verified manually.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <Separator className="my-2 h-px !bg-rose-50/10" />

        {issueGroupList.length > 0 && (
          <div className="flex w-full items-center justify-end space-x-2">
            <Button
              title="Goto previous issue"
              variant="ghost"
              size="icon"
              onClick={() => handleNavigation("prev")}
              disabled={currentIndex === 0}
              className="p-2.5"
            >
              <ChevronLeft className="!size-6" />
            </Button>
            <span className="text-sm text-slate-200">
              Issue {currentIndex + 1} of {issueGroupList.length}
            </span>
            <Button
              title="Goto next issue"
              variant="ghost"
              size="icon"
              onClick={() => handleNavigation("next")}
              disabled={currentIndex === issueGroupList.length - 1}
              className="p-2.5"
            >
              <ChevronRight className="!size-6" />
            </Button>
          </div>
        )}
      </div>

      {issueGroupList.length === 0
        ? renderWrapper(singleIssue)
        : renderWrapper(currentIssue)}
    </div>
  );
}
