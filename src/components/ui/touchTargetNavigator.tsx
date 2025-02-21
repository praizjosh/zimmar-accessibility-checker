import React from "react";
import {
  Target,
  CircleAlert,
  X,
  Check,
  OctagonAlert,
  Ruler,
  MoveHorizontal,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useIssuesStore from "@/lib/useIssuesStore";
import { MIN_TOUCH_TARGET_SIZE } from "@/lib/constants";
import IssuesWrapper from "./IssuesWrapper";
import cn from "@/lib/utils";

const TouchTargetNavigator: React.FC = () => {
  const { currentIndex, singleIssue, selectedType, getIssueGroupList } =
    useIssuesStore();

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex];
  const { severity } = currentIssue ?? {};
  const { characters, width, height, name, requiredSize } =
    currentIssue?.nodeData ?? {};

  return (
    <IssuesWrapper>
      {issueGroupList.length === 0 ? (
        <>
          {singleIssue === null && (
            <p className="text-pretty px-3 font-open-sans text-lg font-medium text-gray">
              No {selectedType} issue detected.
            </p>
          )}

          <div className="flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade p-4 font-medium">
            <div className="flex items-center justify-between gap-x-6 py-1.5">
              <div className="flex items-center text-sm">
                <Target className="mr-3 size-5" />
                <span className="text-sm">Element: </span>
              </div>
              <span className="line-clamp-1 w-full max-w-xs whitespace-normal text-right font-mono text-sm">
                {singleIssue?.nodeData.characters ?? singleIssue?.nodeData.name}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center text-sm">
                {(singleIssue?.nodeData.width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
                (singleIssue?.nodeData.height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                ) : (
                  <X
                    className={cn(
                      "mr-3 size-5 rounded-full p-1 text-dark-shade",
                      (singleIssue?.nodeData.width ?? 0) <
                        MIN_TOUCH_TARGET_SIZE ||
                        (singleIssue?.nodeData.height ?? 0) <
                          MIN_TOUCH_TARGET_SIZE
                        ? singleIssue?.severity === "minor"
                          ? "bg-amber-500"
                          : "bg-rose-600"
                        : "",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "text-sm",
                    (singleIssue?.nodeData.width ?? 0) <
                      MIN_TOUCH_TARGET_SIZE ||
                      (singleIssue?.nodeData.height ?? 0) <
                        MIN_TOUCH_TARGET_SIZE
                      ? singleIssue?.severity === "minor"
                        ? "text-amber-500"
                        : "text-inherit"
                      : "",
                  )}
                >
                  Current size:
                </span>
              </div>
              <div className="flex items-center text-sm">
                {selectedType === "Touch Target Size" &&
                singleIssue?.nodeData.width !== undefined &&
                singleIssue?.nodeData.height !== undefined &&
                (singleIssue.nodeData.width < MIN_TOUCH_TARGET_SIZE ||
                  singleIssue.nodeData.height < MIN_TOUCH_TARGET_SIZE) ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CircleAlert className="ml-2 size-4 text-gray" />
                      </TooltipTrigger>
                      <TooltipContent className="w-full max-w-52 text-pretty">
                        <p className="text-xs">
                          Touch targets should be at least 44x44px to ensure
                          they are easily tappable on mobile devices.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}

                {singleIssue?.nodeData.width !== undefined &&
                  singleIssue?.nodeData.height !== undefined && (
                    <div className="ml-2.5 inline-flex gap-x-1">
                      <span
                        className={cn(
                          (singleIssue?.nodeData.width ?? 0) <
                            MIN_TOUCH_TARGET_SIZE
                            ? singleIssue?.severity === "minor"
                              ? "text-amber-500"
                              : "text-inherit"
                            : "",
                        )}
                      >
                        {(singleIssue?.nodeData.width ?? 0)?.toFixed(1)}
                      </span>
                      <span>x</span>
                      <span
                        className={cn(
                          (singleIssue?.nodeData.height ?? 0) <
                            MIN_TOUCH_TARGET_SIZE
                            ? singleIssue?.severity === "minor"
                              ? "text-amber-500"
                              : "text-inherit"
                            : "",
                        )}
                      >
                        {(singleIssue?.nodeData.height ?? 0)?.toFixed(1)}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center text-sm">
                {selectedType === "Touch Target Spacing" &&
                (singleIssue?.nodeData.width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
                (singleIssue?.nodeData.height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
                  <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
                ) : (
                  <Ruler className="mr-3 size-5" />
                )}
                <span className="text-sm">Required size: </span>
              </div>
              <span className="text-sm">
                {singleIssue?.nodeData.requiredSize}
              </span>
            </div>

            {selectedType === "Touch Target Spacing" && (
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center text-sm">
                  <MoveHorizontal className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
                  <span className="text-sm">Element spacing: </span>
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
                    ? "text-rose-600"
                    : singleIssue?.severity === "major"
                      ? "text-orange-500"
                      : "text-amber-500"
                }`}
              >
                {singleIssue?.severity}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="mb-2 flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade px-3 py-4 font-medium">
          <div className="flex items-center justify-between gap-x-6 py-1.5">
            <div className="flex items-center text-sm">
              <Target className="mr-3 size-5" />
              <span className="text-sm">Element: </span>
            </div>
            <span className="line-clamp-1 w-full max-w-xs whitespace-normal text-right font-mono text-sm">
              {characters ?? name}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center text-sm">
              {(width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
              (height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
                <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
              ) : (
                <X
                  className={cn(
                    "mr-3 size-5 rounded-full p-1 text-dark-shade",
                    (width ?? 0) < MIN_TOUCH_TARGET_SIZE ||
                      (height ?? 0) < MIN_TOUCH_TARGET_SIZE
                      ? severity === "minor"
                        ? "bg-amber-500"
                        : "bg-rose-600"
                      : "",
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm",
                  (width ?? 0) < MIN_TOUCH_TARGET_SIZE ||
                    (height ?? 0) < MIN_TOUCH_TARGET_SIZE
                    ? severity === "minor"
                      ? "text-amber-500"
                      : "text-inherit"
                    : "",
                )}
              >
                Current size:
              </span>
            </div>
            <div className="flex items-center text-sm">
              {selectedType === "Touch Target Size" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CircleAlert className="ml-2 size-4 text-gray" />
                    </TooltipTrigger>
                    <TooltipContent className="w-full max-w-52 text-pretty">
                      <p className="text-xs">
                        Touch targets should be at least 44x44px to ensure they
                        are easily tappable on mobile devices.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <div className="ml-2.5 inline-flex gap-x-1">
                <span
                  className={cn(
                    (width ?? 0) < MIN_TOUCH_TARGET_SIZE
                      ? severity === "minor"
                        ? "text-amber-500"
                        : "text-inherit"
                      : "",
                  )}
                >
                  {(width ?? 0).toFixed(1)}
                </span>
                <span>x</span>
                <span
                  className={cn(
                    (height ?? 0) < MIN_TOUCH_TARGET_SIZE
                      ? severity === "minor"
                        ? "text-amber-500"
                        : "text-inherit"
                      : "",
                  )}
                >
                  {(height ?? 0).toFixed(1)}px
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center text-sm">
              {selectedType === "Touch Target Spacing" &&
              (width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
              (height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
                <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
              ) : (
                <Ruler className="mr-3 size-5" />
              )}
              <span className="text-sm">Required size: </span>
            </div>
            <span className="text-sm">{requiredSize}</span>
          </div>

          {selectedType === "Touch Target Spacing" && (
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center text-sm">
                <MoveHorizontal className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />

                <span className="text-sm">Element spacing: </span>
              </div>

              <span className="text-sm text-rose-600">Fail</span>
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
                  ? "text-rose-600"
                  : severity === "major"
                    ? "text-orange-500"
                    : "text-amber-500"
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

export default TouchTargetNavigator;
