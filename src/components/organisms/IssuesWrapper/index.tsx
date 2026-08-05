import InfoPopover from "@/components/organisms/InfoPopover";
import Recommendations from "@/components/organisms/Recommendations";
import { Button } from "@/components/ui/button";
import Separator from "@/components/ui/separator";
import { MESSAGE_TYPES } from "@/lib/constants";
import ISSUE_TYPE_LABELS from "@/lib/issueTypeLabels";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { ISSUE_RECOMMENDATIONS, ISSUES_DATA_SCHEMA } from "@/lib/issuesData";
import { IssueType, IssueX } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { cn, getRouteForIssueType } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type TooltipDataType = Record<string, { title: string; content: string }>;

const tooltipData: TooltipDataType = {
  TOUCH_TARGET_SIZE: {
    title: "Touch Target Detection",
    content:
      "Our touch target analysis helps identify potential accessibility issues. This is an experimental feature and should be verified manually.",
  },
  TOUCH_TARGET_SPACING: {
    title: "Touch Target Detection",
    content:
      "Our touch target analysis helps identify potential accessibility issues. This is an experimental feature and should be verified manually.",
  },
  CONTRAST: {
    title: "Contrast Detection",
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
  const [hasForeground, setHasForeground] = useState("");
  const {
    currentIndex,
    issues,
    singleIssue,
    selectedType,
    navigateTo,
    setCurrentIndex,
    setSelectedType,
    setSingleIssue,
    navigateToIssue,
    getIssueGroupList,
  } = useIssuesStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data.pluginMessage || {};

      if (type === MESSAGE_TYPES.DETECTED_ISSUE) {
        const matchingIssues = data.filter(
          (issue: IssueX) => issue.type === selectedType,
        );

        if (matchingIssues.length === 0) {
          setSingleIssue(null);
          return;
        }

        setSingleIssue(matchingIssues[0] || data[0] || null);
      }

      if (type === MESSAGE_TYPES.LAYER_SELECTED && data) {
        setIsSelection(true);
      }

      if (type === MESSAGE_TYPES.NO_SELECTION && data) {
        setSingleIssue(null);
        setIsSelection(false);
      }

      if (type === MESSAGE_TYPES.QUICKCHECK_ACTIVE) {
        setIsQuickCheckActive(data);
      }

      if (type === MESSAGE_TYPES.NO_BACKGROUND) {
        setHasBackground(data);
      }

      if (type === MESSAGE_TYPES.NO_FOREGROUND) {
        setHasForeground(data);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [selectedType, setSingleIssue]);

  useEffect(() => {
    navigateToIssue(0);
  }, [navigateToIssue]);

  const handleBackBtnClick = () => {
    if (isQuickCheckActive) {
      navigateTo("INDEX");
      setSingleIssue(null);
      postMessageToBackend(MESSAGE_TYPES.CANCEL_QUICKCHECK);
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

  const handleSwitchType = (nextType: IssueType) => {
    if (nextType === selectedType) return;
    setSelectedType(nextType);
    setCurrentIndex(0);
    navigateTo(getRouteForIssueType(nextType));
    navigateToIssue(0);
  };

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex];
  const { type, description } = currentIssue || {};
  const availableTypes = ISSUES_DATA_SCHEMA.filter((issue) =>
    issues.some((i) => i.type === issue.type),
  );
  const selectedTypeLabel = selectedType ? ISSUE_TYPE_LABELS[selectedType] : "";
  const currentOrSelectedType = type ?? selectedType;
  const headerLabel = currentOrSelectedType
    ? ISSUE_TYPE_LABELS[currentOrSelectedType]
    : "";

  const getIssueRecommendations = (issueType: IssueType | "") => {
    if (!issueType) return null;
    const label = ISSUE_TYPE_LABELS[issueType].toLowerCase();
    const entry = ISSUE_RECOMMENDATIONS.find(
      (item) => item[label] !== undefined,
    );
    return entry ? entry[label] : null;
  };

  const suggestions = getIssueRecommendations(selectedType);

  const renderWrapper = (issue: typeof singleIssue | null) => {
    if (!issue) {
      return (
        <div className="flex w-full flex-col items-start text-grey">
          <p className="mb-1.5 font-open-sans text-lg font-medium">
            No {selectedTypeLabel} issue detected
          </p>

          {!isSelection && (
            <p className="text-sm">
              Select a{" "}
              {selectedType === "TYPOGRAPHY" || selectedType === "CONTRAST"
                ? "Text"
                : "Touch Target"}{" "}
              layer to check for {selectedTypeLabel} issues.
            </p>
          )}

          {isSelection && hasBackground && selectedType === "CONTRAST" && (
            <p className="text-sm">{hasBackground}</p>
          )}

          {isSelection && hasForeground && selectedType === "CONTRAST" && (
            <p className="text-sm">{hasForeground}</p>
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
              aria-hidden="true"
              className="!size-6 transition-transform delay-100 ease-in-out group-hover:!-translate-x-0.5"
            />
            <span className="text-base">Back</span>
          </Button>

          <div className="inline-flex items-center gap-x-1">
            <span className="font-medium capitalize tracking-wide">
              {headerLabel}
            </span>
            {tooltipData[selectedType] && (
              <InfoPopover
                title={tooltipData[selectedType].title}
                content={tooltipData[selectedType].content}
              />
            )}
          </div>
        </div>

        {availableTypes.length > 1 && (
          <div
            role="tablist"
            aria-label="Switch issue type"
            className="flex w-full items-center justify-center gap-x-1 pb-1"
          >
            {availableTypes.map((issue) => (
              <Button
                key={issue.id}
                title={`Switch to ${ISSUE_TYPE_LABELS[issue.type as IssueType]} issues`}
                role="tab"
                aria-selected={selectedType === issue.type}
                variant="ghost"
                size="icon"
                className={cn(
                  "!size-8",
                  selectedType === issue.type &&
                    "bg-dark-shade text-accent ring-1 ring-accent",
                )}
                onClick={() => handleSwitchType(issue.type as IssueType)}
              >
                {issue.icon}
              </Button>
            ))}
          </div>
        )}

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
              <ChevronLeft
                strokeWidth={1.5}
                aria-hidden="true"
                className="!size-6"
              />
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
              <ChevronRight
                strokeWidth={1.5}
                aria-hidden="true"
                className="!size-6"
              />
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
