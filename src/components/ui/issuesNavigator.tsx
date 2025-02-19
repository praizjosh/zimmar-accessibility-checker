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
import { postMessageToBackend } from "@/lib/figmaUtils";

const IssuesNavigator: React.FC = () => {
  const {
    currentIndex,
    singleIssue,
    selectedType,
    updateIssue,
    getIssueGroupList,
    setSingleIssue,
  } = useIssuesStore();

  const handleFontSizeChange = (
    id: string,
    value: string,
    isSingleIssue: boolean = false,
  ) => {
    const newSize = Number(value);

    if (newSize >= 0) {
      // Update singleIssue if applicable
      if (isSingleIssue && singleIssue) {
        const updatedSingleIssue = {
          ...singleIssue,
          nodeData: {
            ...singleIssue.nodeData,
            fontSize: newSize,
          },
        };

        setSingleIssue(updatedSingleIssue); // Update the singleIssue in the global store

        postMessageToBackend("updateFontSize", { id, fontSize: newSize });
      } else {
        // Update current issue in the issues list
        updateIssue(id, {
          nodeData: { ...currentIssue.nodeData, fontSize: newSize },
        });

        postMessageToBackend("updateFontSize", { id, fontSize: newSize });
      }
    }
  };

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex] ?? {};
  const { type, severity } = currentIssue ?? {};
  const { id, fontSize, characters, contrastScore } =
    currentIssue?.nodeData ?? {};

  const getFontSize = () => fontSize ?? singleIssue?.nodeData?.fontSize ?? 0;
  const fontSizeIsValid = getFontSize() >= MIN_FONT_SIZE;

  return (
    <IssuesWrapper>
      {issueGroupList.length === 0 ? (
        <>
          {singleIssue === null && (
            <p className="my-4 text-pretty px-3 font-open-sans text-lg font-semibold text-gray">
              No {selectedType} issue detected
            </p>
          )}
          <div className="my-2 flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
            <div className="flex items-center justify-between gap-x-6 py-1.5">
              <div className="flex items-center text-sm">
                <CaseSensitive className="mr-3 size-5" />
                <span className="text-sm">Text: </span>
              </div>
              <span className="line-clamp-1 w-full max-w-xs whitespace-normal text-right font-mono text-sm">
                {singleIssue?.nodeData.characters}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
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
                  value={singleIssue?.nodeData.fontSize || ""}
                  onInput={(e) =>
                    handleFontSizeChange(
                      singleIssue?.nodeData.id || "",
                      e.currentTarget.value,
                      true,
                    )
                  }
                  className="ml-2.5 h-full !w-fit max-w-[4.4rem] bg-transparent font-extrabold"
                />
              </div>
            </div>

            {singleIssue?.type === "Contrast" && (
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center text-sm">
                  {singleIssue?.nodeData.contrastScore === undefined ||
                  singleIssue?.nodeData.contrastScore === "Fail" ? (
                    <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                  ) : (
                    <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                  )}
                  <span className="text-sm">WCAG score: </span>
                </div>

                <div className="flex items-center text-sm">
                  {singleIssue?.nodeData.contrastScore === "Fail" && (
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
                            The color contrast between the text and the
                            background on this screen is insufficient to meet
                            the enhanced contrast requirements. In some edge
                            cases, the test may fail when the background element
                            is a “GROUP,” “COMPONENT,” or “INSTANCE.”
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span
                    className={`${singleIssue?.nodeData.contrastScore === "Fail" ? "text-rose-600" : "font-bold text-green-500"} ml-2.5 text-sm`}
                  >
                    {singleIssue?.nodeData.contrastScore}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center text-sm">
                <OctagonAlert className="mr-3 size-5" />
                <span className="text-sm">Severity: </span>
              </div>
              <span
                className={`font-medium capitalize ${
                  singleIssue?.severity === "critical"
                    ? "text-red-500"
                    : singleIssue?.severity === "major"
                      ? "text-amber-500"
                      : "text-orange-500"
                }`}
              >
                {singleIssue?.severity}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="mb-2 flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
          <div className="flex items-center justify-between gap-x-6 py-1.5">
            <div className="flex items-center text-sm">
              <CaseSensitive className="mr-3 size-5" />
              <span className="text-sm">Text: </span>
            </div>
            <span className="line-clamp-1 w-full max-w-xs whitespace-normal text-right font-mono text-sm">
              {characters}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
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
                value={fontSize || ""}
                onInput={(e) => handleFontSizeChange(id, e.currentTarget.value)}
                className="ml-2.5 h-full !w-fit max-w-[4.4rem] bg-transparent font-extrabold"
              />
            </div>
          </div>

          {type !== undefined && type === "Contrast" && (
            <div className="flex items-center justify-between py-1.5">
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
                          contrast requirements. In some edge cases, the test
                          may fail when the background element is a “GROUP,”
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

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center text-sm">
              <OctagonAlert className="mr-3 size-5" />
              <span className="text-sm">Severity: </span>
            </div>
            <span
              className={`font-medium capitalize ${
                severity === "critical"
                  ? "text-red-500"
                  : severity === "major"
                    ? "text-amber-500"
                    : "text-orange-500"
              }`}
            >
              {severity}
            </span>
          </div>
        </div>
      )}
    </IssuesWrapper>
  );
};

export default IssuesNavigator;
