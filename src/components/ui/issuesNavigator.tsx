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
import cn from "@/lib/utils";

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

  // const textStyles = {
  //   critical: "text-rose-600",
  //   major: "text-amber-500",
  //   minor: "text-orange-500",
  // };

  // function getStyles(type) {
  //   switch (type) {
  //     case "contrast":
  //       return textStyles["critical"];
  //       break;

  //     default:
  //       break;
  //   }
  // }

  return (
    <IssuesWrapper>
      {issueGroupList.length === 0 ? (
        <>
          {singleIssue === null && (
            <p className="px-3 font-open-sans text-lg font-medium text-gray">
              No {selectedType} issue detected.
            </p>
          )}

          <div className="flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
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
                  <X
                    className={cn(
                      "mr-3 size-5 rounded-full p-1",
                      !fontSizeIsValid && singleIssue?.severity === "major"
                        ? "bg-orange-500 text-dark-shade"
                        : "bg-rose-600 text-dark-shade",
                    )}
                  />
                )}

                <span
                  className={cn("text-sm", {
                    "text-orange-500":
                      !fontSizeIsValid && singleIssue?.severity === "major",
                  })}
                >
                  Font size:
                </span>
              </div>
              <div className="flex items-center text-sm">
                {singleIssue?.nodeData.fontSize && (
                  <>
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
                            <p className="text-xs">
                              The text size is below recommended standards for
                              readability. Consider increasing it to at least{" "}
                              {MIN_FONT_SIZE}px to ensure better legibility for
                              all users.
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
                      className={cn(
                        "ml-2.5 h-full !w-fit max-w-[4.4rem] bg-transparent font-extrabold",
                        {
                          "text-orange-500":
                            !fontSizeIsValid &&
                            singleIssue?.severity === "major",
                        },
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            {singleIssue?.type === "Contrast" && (
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center text-sm">
                  {singleIssue?.nodeData.contrastScore === undefined ||
                  singleIssue?.nodeData.contrastScore?.compliance === "Fail" ? (
                    <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                  ) : (
                    <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                  )}
                  <span className="text-sm">WCAG score: </span>
                </div>

                <div className="flex items-center text-base">
                  {singleIssue?.nodeData.contrastScore?.compliance ===
                    "Fail" && (
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
                          <p className="text-xs">
                            The color contrast between the text and the
                            background on this screen is insufficient to meet
                            the enhanced contrast requirements. In some edge
                            cases, the test may fail when the background element
                            is a “GROUP,” “COMPONENT,” or “INSTANCE. Other
                            times, a background couldn't be detected.”
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <span
                    className={cn(
                      "font-bold ml-2.5",
                      singleIssue?.nodeData.contrastScore?.compliance ===
                        "Fail" && singleIssue?.severity === "critical"
                        ? "text-rose-600"
                        : "text-green-500",
                    )}
                  >
                    {singleIssue?.nodeData.contrastScore?.compliance}
                  </span>
                </div>
              </div>
            )}

            {singleIssue?.type === "Contrast" && (
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center text-sm">
                  {singleIssue?.nodeData.contrastScore === undefined ||
                  singleIssue?.nodeData.contrastScore?.compliance === "Fail" ? (
                    <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                  ) : (
                    <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                  )}
                  <span className="text-sm">Contrast ratio: </span>
                </div>

                <div className="flex items-center text-base">
                  <span
                    className={cn(
                      "font-bold",
                      singleIssue?.nodeData.contrastScore?.compliance ===
                        "Fail" && singleIssue?.severity === "critical"
                        ? "text-rose-600"
                        : "text-green-500",
                    )}
                  >
                    {singleIssue?.nodeData.contrastScore?.ratio.toFixed(1)}
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
                className={cn("font-bold capitalize text-base", {
                  "text-rose-600": singleIssue?.severity === "critical",
                  "text-orange-500": singleIssue?.severity === "major",
                  "text-amber-500": singleIssue?.severity === "minor",
                })}
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
                <X
                  className={cn(
                    "mr-3 size-5 rounded-full p-1",
                    !fontSizeIsValid && severity === "major"
                      ? "bg-orange-500 text-dark-shade"
                      : "bg-rose-600 text-dark-shade",
                  )}
                />
              )}

              <span
                className={cn("text-sm", {
                  "text-orange-500": !fontSizeIsValid && severity === "major",
                })}
              >
                Font size:{" "}
              </span>
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
                      <p className="text-xs">
                        The text size is below recommended standards for
                        readability. Consider increasing it to at least{" "}
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
                className={cn(
                  "ml-2.5 h-full !w-fit max-w-[4.4rem] bg-transparent font-extrabold",
                  {
                    "text-orange-500": !fontSizeIsValid && severity === "major",
                  },
                )}
              />
            </div>
          </div>

          {type !== undefined && type === "Contrast" && (
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center text-sm">
                {contrastScore?.compliance === "Fail" ? (
                  <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                ) : (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                )}
                <span className="text-sm">WCAG score: </span>
              </div>

              <div className="flex items-center text-sm">
                {contrastScore?.compliance === "Fail" && (
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
                        <p className="text-xs">
                          The color contrast between the text and the background
                          on this screen is insufficient to meet the enhanced
                          contrast requirements. In some edge cases, the test
                          may fail when the background element is a “GROUP,”
                          “COMPONENT,” or “INSTANCE. Other times, a background
                          couldn't be detected.”
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <span
                  className={cn("font-bold ml-2.5", {
                    "text-rose-600": contrastScore?.compliance === "Fail",
                  })}
                >
                  {contrastScore?.compliance}
                </span>
              </div>
            </div>
          )}

          {type !== undefined && type === "Contrast" && (
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center text-sm">
                {contrastScore?.compliance === "Fail" ? (
                  <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                ) : (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                )}
                <span className="text-sm">Contrast ratio: </span>
              </div>

              <div className="flex items-center text-base">
                <span
                  className={cn("font-bold", {
                    "text-rose-600": contrastScore?.compliance === "Fail",
                  })}
                >
                  {contrastScore?.ratio.toFixed(1)}
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
              className={cn("font-bold capitalize text-base", {
                "text-rose-600": severity === "critical",
                "text-orange-500": severity === "major",
                "text-amber-500": severity === "minor",
              })}
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
