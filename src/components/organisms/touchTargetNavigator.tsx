import {
  Target,
  Check,
  OctagonAlert,
  Ruler,
  MoveHorizontal,
  X,
} from "lucide-react";
import useIssuesStore from "@/lib/useIssuesStore";
import { MIN_TOUCH_TARGET_SIZE } from "@/lib/constants";
import { cn, getSeverityStyles } from "@/lib/utils";
import IssueDetailRow from "./IssueDetailRow";
import IssuesWrapper from "./IssuesWrapper";

export default function TouchTargetNavigator() {
  const { currentIndex, singleIssue, selectedType, getIssueGroupList } =
    useIssuesStore();

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex] ?? {};

  const renderIssueDetails = (issue: typeof singleIssue | null) => {
    if (!issue) {
      return (
        <p className="px-3 font-open-sans text-lg font-medium text-gray">
          No {selectedType} issue detected.
        </p>
      );
    }

    const { type, severity } = issue;
    const { characters, width, height, name, requiredSize } =
      issue?.nodeData ?? {};
    const isWidthFail = (width ?? 0) < MIN_TOUCH_TARGET_SIZE;
    const isHeightFail = (height ?? 0) < MIN_TOUCH_TARGET_SIZE;

    return (
      <div className="relative flex w-full flex-col space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
        <IssueDetailRow
          icon={<Target className="mr-3 size-5" />}
          label="Element:"
          value={
            <span className="w-full max-w-44 truncate text-right font-mono text-sm">
              {characters ?? name}
            </span>
          }
        />

        <IssueDetailRow
          icon={
            (width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
            (height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
              <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
            ) : (
              <X
                className={cn(getSeverityStyles(severity, { isIcon: true }))}
              />
            )
          }
          tooltip="Touch targets should be at least 44x44 pixels to ensure they are easily tappable on mobile devices."
          label={
            <span
              className={cn(
                "text-sm",
                type === "Touch Target Size" &&
                  getSeverityStyles(severity, {
                    isBold: isWidthFail || isHeightFail,
                  }),
              )}
            >
              Current size:
            </span>
          }
          value={
            <div className="ml-2.5 inline-flex gap-x-1 text-base">
              <span
                className={cn(
                  { "!text-[#ffffffde]": !isWidthFail },
                  getSeverityStyles(severity, {
                    isBold: isWidthFail,
                  }),
                )}
              >
                {width?.toFixed(1)}
              </span>
              <span>x</span>
              <span
                className={cn(
                  { "!text-[#ffffffde]": !isHeightFail },
                  getSeverityStyles(severity, {
                    isBold: isHeightFail,
                  }),
                )}
              >
                {height?.toFixed(1)}px
              </span>
            </div>
          }
        />

        <IssueDetailRow
          icon={<Ruler className="mr-3 size-5" />}
          label="Required size:"
          value={<span className="text-base">{requiredSize}</span>}
        />

        {selectedType === "Touch Target Spacing" && (
          <IssueDetailRow
            icon={
              <MoveHorizontal
                className={cn(getSeverityStyles(severity, { isIcon: true }))}
              />
            }
            label={
              <span
                className={cn(
                  "text-sm",
                  getSeverityStyles(severity, { isBold: true }),
                )}
              >
                Element spacing:
              </span>
            }
            value={
              <span
                className={`text-base ${getSeverityStyles(severity, { isBold: true })}`}
              >
                Fail
              </span>
            }
          />
        )}

        <IssueDetailRow
          icon={<OctagonAlert className="mr-3 size-5" />}
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
