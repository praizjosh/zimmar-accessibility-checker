import useIssuesStore from "@/lib/useIssuesStore";
import { CaseSensitive, X, Check, OctagonAlert } from "lucide-react";
import IssueDetailRow from "./IssueDetailRow";
import Input from "../ui/input";
import { MIN_FONT_SIZE } from "@/lib/constants";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { cn, getSeverityStyles } from "@/lib/utils";
import IssuesWrapper from "./IssuesWrapper";
import { IssueX } from "@/lib/types";

export default function IssuesNavigator() {
  const {
    currentIndex,
    singleIssue,
    selectedType,
    updateIssue,
    getIssueGroupList,
    setSingleIssue,
  } = useIssuesStore();

  const issueGroupList: IssueX[] = getIssueGroupList();
  const currentIssue: IssueX = issueGroupList[currentIndex] ?? {};

  const handleFontSizeChange = (
    id: string,
    value: string,
    isSingleIssue: boolean = false,
  ) => {
    const newSize = Number(value);
    if (newSize >= 0) {
      const payload = { id, fontSize: newSize };

      if (isSingleIssue && singleIssue) {
        setSingleIssue({
          ...singleIssue,
          nodeData: { ...singleIssue.nodeData, fontSize: newSize },
        });
      } else {
        updateIssue(id, {
          nodeData: { ...currentIssue.nodeData, fontSize: newSize },
        });
      }

      postMessageToBackend("updateFontSize", payload);
    }
  };

  const renderIssueDetails = (issue: typeof singleIssue | null) => {
    if (!issue) {
      return (
        <p className="px-3 font-open-sans text-lg font-medium text-gray">
          No {selectedType} issue detected.
        </p>
      );
    }

    const { type, severity } = issue;
    const { characters, fontSize, contrastScore, id } = issue.nodeData ?? {};
    const getFontSize = () => fontSize ?? singleIssue?.nodeData?.fontSize ?? 0;
    const fontSizeIsValid = getFontSize() >= MIN_FONT_SIZE;

    return (
      <div className="relative flex w-full flex-col space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
        <IssueDetailRow
          icon={<CaseSensitive className="mr-3 size-5" />}
          label="Text:"
          value={
            <span className="line-clamp-1 w-full max-w-[10.938rem] text-right font-mono">
              {characters}
            </span>
          }
        />

        <IssueDetailRow
          icon={
            fontSizeIsValid ? (
              <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
            ) : (
              <X
                className={cn(
                  "mr-3 size-5 rounded-full p-1",
                  (!fontSizeIsValid && severity === "major") ||
                    (!fontSizeIsValid && severity === "critical")
                    ? "bg-orange-500 text-dark-shade"
                    : "bg-rose-600 text-dark-shade",
                )}
              />
            )
          }
          label={
            <span
              className={cn(
                "text-sm",
                !fontSizeIsValid &&
                  type === "Contrast" &&
                  getSeverityStyles("major", { isBold: true }),
                !fontSizeIsValid &&
                  type === "Typography" &&
                  getSeverityStyles(severity, { isBold: true }),
              )}
            >
              Font size:
            </span>
          }
          value={
            <Input
              type="number"
              min={0}
              value={fontSize || ""}
              onInput={(e) =>
                handleFontSizeChange(
                  singleIssue?.nodeData.id || id || "",
                  e.currentTarget.value,
                  Boolean(singleIssue),
                )
              }
              className={cn(
                "ml-2.5 h-full !w-fit max-w-[4.4rem] bg-transparent font-black",
                {
                  "text-orange-500":
                    (!fontSizeIsValid && severity === "major") ||
                    (!fontSizeIsValid && severity === "critical"),
                },
              )}
            />
          }
          tooltip={
            !fontSizeIsValid &&
            `The text size is below recommended standards for readability. Consider increasing it to at least ${MIN_FONT_SIZE}px to ensure better legibility.`
          }
        />

        {type === "Contrast" && (
          <>
            <IssueDetailRow
              icon={
                contrastScore?.compliance === "Fail" ? (
                  <X
                    className={cn(
                      getSeverityStyles(severity, { isIcon: true }),
                    )}
                  />
                ) : (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                )
              }
              label={
                <span
                  className={cn(
                    "text-sm",
                    contrastScore?.compliance === "Fail" &&
                      getSeverityStyles(severity, { isBold: true }),
                  )}
                >
                  WCAG score:
                </span>
              }
              value={
                <span
                  className={cn(
                    "font-bold ml-2.5 text-base",
                    contrastScore?.compliance === "Fail" &&
                      getSeverityStyles(severity, { isBold: true }),
                  )}
                >
                  {contrastScore?.compliance}
                </span>
              }
              tooltip={
                contrastScore?.compliance === "Fail" &&
                "The color contrast between the text and the background on this screen is insufficient to meet the enhanced contrast requirements. In some edge cases, the test may fail when the background element is a “GROUP,” “COMPONENT,” or “INSTANCE. Other times, a background couldn't be detected."
              }
            />

            <IssueDetailRow
              icon={
                contrastScore?.compliance === "Fail" ? (
                  <X
                    className={cn(
                      getSeverityStyles(severity, { isIcon: true }),
                    )}
                  />
                ) : (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                )
              }
              label={
                <span
                  className={cn(
                    "text-sm",
                    contrastScore?.compliance === "Fail" &&
                      getSeverityStyles(severity, { isBold: true }),
                  )}
                >
                  Contrast ratio:
                </span>
              }
              value={
                <span
                  className={cn(
                    "font-bold ml-2.5 text-base",
                    contrastScore?.compliance === "Fail" &&
                      getSeverityStyles(severity, { isBold: true }),
                  )}
                >
                  {contrastScore?.ratio.toFixed(2)}
                </span>
              }
            />
          </>
        )}

        <IssueDetailRow
          label="Severity:"
          value={
            <span
              className={cn("font-bold capitalize text-base", {
                "text-rose-600": severity === "critical",
                "text-orange-500": severity === "major",
                "text-amber-500": severity === "minor",
              })}
            >
              {severity}
            </span>
          }
          icon={<OctagonAlert className="mr-3 size-5" />}
        />
      </div>
    );
  };

  return (
    <IssuesWrapper>
      {issueGroupList.length === 0
        ? renderIssueDetails(singleIssue)
        : renderIssueDetails(currentIssue)}
    </IssuesWrapper>
  );
}
