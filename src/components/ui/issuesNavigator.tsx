/* eslint-disable no-console */
import React, { useEffect } from "react";
import useIssuesStore from "@/lib/useIssuesStore";
import { Button } from "./button";
import {
  CaseSensitive,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleX,
  X,
  Check,
  OctagonAlert,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Input from "./input";

const IssuesNavigator: React.FC = () => {
  const {
    currentIndex,
    updateIssue,
    navigateTo,
    navigateToIssue,
    getIssueGroupList,
    rescanIssues,
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

  const handleFontSizeChange = (id: string, value: string) => {
    const newSize = Number(value);

    if (newSize >= 0) {
      updateIssue(id, {
        nodeData: { ...currentIssue.nodeData, fontSize: newSize },
      });

      parent.postMessage(
        {
          pluginMessage: {
            type: "updateFontSize",
            id,
            fontSize: newSize,
          },
        },
        "*",
      );
    }
  };

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex];
  const { id, fontSize, characters, contrastScore } =
    currentIssue?.nodeData ?? {};
  const fontSizeIsValid = (fontSize ?? 0) >= 12;

  // console.log("issueGroupList is what? ", issueGroupList);
  console.log("issueGroupList is what? ", getIssueGroupList());

  return (
    <>
      <button
        onClick={() => {
          navigateTo("INDEX");
          rescanIssues();
        }}
        className="mb-4 text-blue-500 underline"
      >
        Back to Issues Overview
      </button>

      {issueGroupList.length > 0 ? (
        <>
          <p className="mb-2 text-pretty text-lg font-semibold text-plum-light">
            {currentIssue.description}
          </p>
          <p className="mb-2.5 text-xs uppercase tracking-wide text-[#C9C9E0]">
            {currentIssue.type} issues
          </p>

          <div className="mb-2 flex w-full flex-col justify-center space-y-2 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center text-sm">
                <CaseSensitive className="mr-3 size-7 rounded-md bg-stone-900 p-1.5" />
                <span className="text-sm">Text: </span>
              </div>
              <pre className="whitespace-normal text-sm">{characters}</pre>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center text-sm">
                {fontSizeIsValid ? (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                ) : (
                  <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                )}

                <span className="text-sm">Font size: </span>
              </div>
              <div className="flex items-center text-sm">
                {!fontSizeIsValid && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CircleAlert className="ml-2 size-4" />
                      </TooltipTrigger>
                      <TooltipContent
                        sideOffset={5}
                        className="w-full max-w-52 text-pretty"
                      >
                        <p className="text-xs font-light">
                          The text size is below recommended standards for
                          readability. Consider increasing it to at least 11px
                          to ensure better legibility for all users.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <Input
                  type="number"
                  min={0}
                  value={currentIssue.nodeData.fontSize || ""}
                  onInput={(e) =>
                    handleFontSizeChange(id, e.currentTarget.value)
                  }
                  className="ml-2.5 h-full !w-fit max-w-[4.4rem] bg-transparent font-extrabold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center text-sm">
                <CircleX className="mr-3 size-7 rounded-md bg-stone-900 p-1.5" />
                <span className="text-sm">WCAG score: </span>
              </div>
              <span className="text-sm">{contrastScore}</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center text-sm">
                <OctagonAlert className="mr-3 size-7 rounded-md bg-stone-900 p-1.5" />
                <span className="text-sm">Severity: </span>
              </div>
              <span
                className={`font-bold capitalize ${
                  currentIssue.severity === "critical"
                    ? "text-red-500"
                    : currentIssue.severity === "major"
                      ? "text-amber-500"
                      : "text-orange-500"
                }`}
              >
                {currentIssue.severity}
              </span>
            </div>
          </div>

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
        <p>No issues found!</p>
      )}
    </>
  );
};

export default IssuesNavigator;
