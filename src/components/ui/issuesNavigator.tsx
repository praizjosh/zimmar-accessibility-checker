/* eslint-disable no-console */
import React from "react";
import useIssuesStore from "@/lib/useIssuesStore";
import {
  CaseSensitive,
  CircleAlert,
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
import { MIN_FONT_SIZE } from "@/lib/constants";
import IssuesWrapper from "./IssuesWrapper";

const IssuesNavigator: React.FC = () => {
  const { currentIndex, updateIssue, getIssueGroupList } = useIssuesStore();

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
  const fontSizeIsValid = (fontSize ?? 0) >= MIN_FONT_SIZE;

  return (
    <IssuesWrapper>
      <div className="mb-2 flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center text-sm">
            <CaseSensitive className="mr-3 size-5" />
            <span className="text-sm">Text: </span>
          </div>
          <span className="whitespace-normal font-mono text-sm">
            {characters}
          </span>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5">
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
                      readability. Consider increasing it to at least
                      {MIN_FONT_SIZE}px to ensure better legibility for all
                      users.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Input
              type="number"
              min={0}
              value={currentIssue.nodeData.fontSize || ""}
              onInput={(e) => handleFontSizeChange(id, e.currentTarget.value)}
              className="ml-2.5 h-full !w-fit max-w-[4.4rem] bg-transparent font-extrabold"
            />
          </div>
        </div>

        {currentIssue.type === "Contrast" && (
          <div className="flex items-center justify-between px-3 py-1.5">
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
                      avoidCollisions
                      align="start"
                      alignOffset={-120}
                      className="w-full max-w-52 text-pretty"
                    >
                      <p className="text-xs font-light">
                        The color contrast between the text and the background
                        on this screen is insufficient to meet the enhanced
                        contrast requirements. In some edge cases, the test may
                        fail when the background element is a “GROUP,”
                        “COMPONENT,” or “INSTANCE.”
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span
                className={`${contrastScore === "Fail" ? "text-rose-600" : ""} ml-2.5 text-sm`}
              >
                {contrastScore}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center text-sm">
            <OctagonAlert className="mr-3 size-5" />
            <span className="text-sm">Severity: </span>
          </div>
          <span
            className={`font-medium capitalize ${
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
    </IssuesWrapper>
  );
};

export default IssuesNavigator;
