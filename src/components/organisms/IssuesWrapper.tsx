import Recommendations from "@/components/organisms/Recommendations";
import TooltipInfo from "@/components/organisms/TooltipInfo";
import { Button } from "@/components/ui/button";
import Separator from "@/components/ui/separator";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { ISSUE_RECOMMENDATIONS } from "@/lib/issuesData";
import { IssueType, IssueX } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type TooltipDataType = Record<string, { title: string; content: string }>;

const tooltipData: TooltipDataType = {
  "Touch Target Size": {
    title: "About Touch Target Detection",
    content:
      "Our touch target analysis helps identify potential accessibility issues. This is an experimental feature and should be verified manually.",
  },
  "Touch Target Spacing": {
    title: "About Touch Target Detection",
    content:
      "Our touch target analysis helps identify potential accessibility issues. This is an experimental feature and should be verified manually.",
  },
  Contrast: {
    title: "About Contrast Detection",
    content:
      "Our contrast analysis is designed to help identify potential accessibility issues. While this experimental feature generally provides accurate results, it requires manual verification. In cases involving complex layer structures (e.g., overlapping elements) or intricate color configurations (e.g., multiple colors or gradients), the calculations may sometimes be inaccurate or infeasible. If this happens, we recommend duplicating and isolating the foreground and background elements onto a clean area of the canvas before performing the evaluation again.",
  },
};

export default function IssuesWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isQuickCheckActive, setIsQuickCheckActive] = useState(false);
  const [isSelection, setIsSelection] = useState(true);
  const [hasBackground, setHasBackground] = useState("");
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
        setSingleIssue(null);
        return;
      }

      setSingleIssue(matchingIssues[0] || data[0] || null);
    }

    if (type === "layer-selected" && data) {
      setIsSelection(true);
    }

    if (type === "no-selection" && data) {
      setSingleIssue(null);
      setIsSelection(false);
    }

    if (type === "quickcheck-active") {
      setIsQuickCheckActive(data);
    }

    if (type === "no-background") {
      setHasBackground(data);
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

  const suggestions = getIssueRecommendations(selectedType);

  const renderWrapper = (issue: typeof singleIssue | null) => {
    if (!issue) {
      return (
        <div className="flex w-full flex-col items-start text-grey">
          <p className="mb-1.5 font-open-sans text-lg font-medium">
            No {selectedType} issue detected
          </p>

          {!isSelection && (
            <p className="text-sm">
              Select a{" "}
              {selectedType === "Typography" || selectedType === "Contrast"
                ? "Text"
                : "Touch Target"}{" "}
              layer to check for {selectedType} issues.
            </p>
          )}

          {isSelection && hasBackground && selectedType === "Contrast" && (
            <p className="text-sm">{hasBackground}</p>
          )}
        </div>
      );
    }

    return (
      <>
        {description && (
          <p className="px-3 font-open-sans font-medium text-grey">
            {description}
          </p>
        )}

        {children}

        <Recommendations recommendations={suggestions || []} />
      </>
    );
  };

  return (
    <div className="flex size-full flex-col items-start gap-y-4 last:!pb-5">
      <div className="grid w-full">
        <div className="flex w-full items-center justify-between gap-x-0.5">
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

          <div className="inline-flex items-center gap-x-1">
            <span className="font-medium capitalize tracking-wide">
              {type ?? selectedType}
            </span>
            {tooltipData[selectedType] && (
              <TooltipInfo
                title={tooltipData[selectedType].title}
                content={tooltipData[selectedType].content}
              />
            )}
          </div>
        </div>

        <Separator className="my-1 h-px !bg-rose-50/10" />

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
              <ChevronLeft strokeWidth={1.5} className="!size-6" />
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
              <ChevronRight strokeWidth={1.5} className="!size-6" />
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
