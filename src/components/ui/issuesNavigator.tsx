/* eslint-disable no-console */
import React, { useEffect } from "react";
import useIssuesStore from "@/lib/useIssuesStore";
import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  CaseSensitive,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  X,
  Check,
  OctagonAlert,
  ChevronsUpDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Input from "./input";
import Separator from "./separator";

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
  const fontSizeIsValid = (fontSize ?? 0) >= 11;

  // console.log("issueGroupList is what? ", issueGroupList);
  // console.log("issueGroupList is what? ", getIssueGroupList());

  return (
    <>
      <div className="flex w-full items-center justify-start gap-x-0.5">
        <Button
          title="Back to Issues Overview"
          variant="nude"
          size={"icon"}
          onClick={() => {
            navigateTo("INDEX");
            rescanIssues();
          }}
          className="p-2 transition-transform delay-100 ease-in-out hover:!-translate-x-0.5"
        >
          <ChevronLeft className="!size-6" />
        </Button>

        <p className="text-lg capitalize tracking-wide text-white">
          {currentIssue.type}
        </p>
      </div>

      <Separator className="my-2 h-px !bg-rose-50/10" />

      {issueGroupList.length > 0 ? (
        <>
          <p className="mb-2.5 text-pretty text-lg font-semibold text-plum-light">
            {currentIssue.description}
          </p>
          <p className="mb-1 text-xs uppercase tracking-wide text-[#C9C9E0]">
            {currentIssue.type} issues
          </p>

          <div className="mb-2 flex w-full flex-col justify-center space-y-2 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center text-sm">
                <CaseSensitive className="mr-3 size-7 rounded-md bg-stone-900 p-1.5" />
                <span className="text-sm">Text: </span>
              </div>
              <span className="whitespace-normal font-mono text-sm">
                {characters}
              </span>
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
                {contrastScore !== "Fail" ? (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                ) : (
                  <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                )}
                <span className="text-sm">WCAG score: </span>
              </div>

              <div className="flex items-center text-sm">
                {contrastScore === "Fail" && (
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
                          The color contrast between the text and the background
                          on this screen is insufficient to meet the enhanced
                          contrast requirements. In some edge cases, the test
                          may fail when the background element is a “GROUP,”
                          “COMPONENT,” or “INSTANCE.”
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <span className="ml-2.5 text-sm">{contrastScore}</span>
              </div>
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

          <Collapsible className="mb-6">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between space-x-4 rounded-md border border-rose-50/40 px-4">
                <h4 className="text-sm font-semibold">Recommendations</h4>
                <Button title="View recommendations" variant="ghost" size="sm">
                  <ChevronsUpDown className="size-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="my-2">
              <div>
                {currentIssue.type === "Contrast" &&
                contrastScore === "Fail" ? (
                  <p>
                    Increasing the font size to at least 11px should help
                    improve readability for all users. Also Consider using a
                    darker text color or a lighter background color to improve
                    the contrast ratio.
                  </p>
                ) : (
                  <p>
                    Increasing the font size to at least 11px should help
                    improve readability for all users and ensure better
                    legibility to meet WCAG "AA" standards.
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

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
