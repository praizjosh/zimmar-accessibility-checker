import React, { useState } from "react";
import {
  Target,
  CircleAlert,
  X,
  Check,
  OctagonAlert,
  Ruler,
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
import { IssueX } from "@/lib/types";

const TouchTargetNavigator: React.FC = () => {
  //   const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIssue, setSelectedIssue] = useState<IssueX | null>(null);
  const [passed, setPassed] = useState<boolean | null>(false);

  const { currentIndex, selectedType, getIssueGroupList } = useIssuesStore();

  //   const {
  //     //  currentIndex,
  //     //  updateIssue,
  //     navigateTo,
  //     //  navigateToIssue,
  //     //  getIssueGroupList,
  //     //  rescanIssues,
  //   } = useIssuesStore();

  // Example touch target issues array
  //   const touchTargetIssues = [
  //     {
  //       description: "Touch target size is too small (24x24px)",
  //       severity: "minor",
  //       type: "Touch Target Size",
  //       nodeData: {
  //         id: "53:426",
  //         name: "login-button",
  //         nodeType: "INSTANCE",
  //         width: 24,
  //         height: 24,
  //         requiredSize: "44 x 44px",
  //       },
  //     },
  //   ];

  //   const currentIssue = touchTargetIssues[currentIndex];
  // Listen for messages from the backend
  onmessage = (event) => {
    // eslint-disable-next-line no-console
    console.log("window event data ==> ", event.data);
    // const { pluginMessage } = event.data;
    const { type, data } = event.data.pluginMessage;

    if (type === "issue") {
      setSelectedIssue(data); // Update state with identified issues
    }

    if (type === "passed") {
      setSelectedIssue(data);
      setPassed(true);
    }
  };

  console.log("selectedIssue ----->", selectedIssue);
  console.log("passed", passed);

  const issueGroupList = getIssueGroupList();
  const currentIssue = issueGroupList[currentIndex];
  const { severity } = currentIssue ?? {};
  const { characters, width, height, requiredSize } =
    currentIssue?.nodeData ?? {};

  return (
    <IssuesWrapper>
      {issueGroupList.length === 0 ? (
        <div className="mb-2 flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade py-4 font-medium">
          <div className="flex items-center justify-between gap-x-6 py-1.5">
            <div className="flex items-center text-sm">
              <Target className="mr-3 size-5" />
              <span className="text-sm">Element: </span>
            </div>
            <span className="line-clamp-1 w-full max-w-xs whitespace-normal text-right font-mono text-sm">
              {selectedIssue?.nodeData.characters}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center text-sm">
              {(selectedIssue?.nodeData.width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
              (selectedIssue?.nodeData.height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
                <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
              ) : (
                <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
              )}
              <span className="text-sm">Current size: </span>
            </div>
            <div className="flex items-center text-sm">
              {selectedType === "Touch Target Size" &&
              selectedIssue?.nodeData.width !== undefined &&
              selectedIssue?.nodeData.height !== undefined &&
              (selectedIssue.nodeData.width < MIN_TOUCH_TARGET_SIZE ||
                selectedIssue.nodeData.height < MIN_TOUCH_TARGET_SIZE) ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CircleAlert className="ml-2 size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="w-full max-w-52 text-pretty">
                      <p className="text-xs font-light">
                        Touch targets should be at least 44x44px to ensure they
                        are easily tappable on mobile devices.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}

              <span className="ml-2.5">
                {(selectedIssue?.nodeData.width ?? 0) &&
                (selectedIssue?.nodeData.height ?? 0)
                  ? `${selectedIssue?.nodeData.width ?? 0} x ${selectedIssue?.nodeData.height ?? 0}px`
                  : null}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center text-sm">
              {selectedType === "Touch Target Spacing" &&
              (selectedIssue?.nodeData.width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
              (selectedIssue?.nodeData.height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
                <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
              ) : (
                <Ruler className="mr-3 size-5" />
              )}
              <span className="text-sm">Required size: </span>
            </div>
            <span className="text-sm">
              {selectedIssue?.nodeData.requiredSize}
            </span>
          </div>

          {selectedIssue?.status !== "passed" && (
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center text-sm">
                <OctagonAlert className="mr-3 size-5" />
                <span className="text-sm">Severity: </span>
              </div>
              <span
                className={`font-medium capitalize ${
                  selectedIssue?.severity === "critical"
                    ? "text-red-500"
                    : selectedIssue?.severity === "major"
                      ? "text-amber-500"
                      : "text-orange-500"
                }`}
              >
                {selectedIssue?.severity}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-2 flex w-full flex-col justify-center space-y-1 divide-y divide-rose-50/5 rounded-xl bg-dark-shade px-3 py-4 font-medium">
          <div className="flex items-center justify-between gap-x-6 py-1.5">
            <div className="flex items-center text-sm">
              <Target className="mr-3 size-5" />
              <span className="text-sm">Element: </span>
            </div>
            <span className="line-clamp-1 w-full max-w-xs whitespace-normal text-right font-mono text-sm">
              {characters}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center text-sm">
              {(width ?? 0) >= MIN_TOUCH_TARGET_SIZE &&
              (height ?? 0) >= MIN_TOUCH_TARGET_SIZE ? (
                <Check className="mr-3 size-5 rounded-full bg-green-500 p-1 text-dark-shade" />
              ) : (
                <X className="mr-3 size-5 rounded-full bg-rose-600 p-1 text-dark-shade" />
              )}
              <span className="text-sm">Current size: </span>
            </div>
            <div className="flex items-center text-sm">
              {selectedType === "Touch Target Size" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CircleAlert className="ml-2 size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="w-full max-w-52 text-pretty">
                      <p className="text-xs font-light">
                        Touch targets should be at least 44x44px to ensure they
                        are easily tappable on mobile devices.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span className="ml-2.5">
                {width ?? 0} x {height ?? 0}px
              </span>
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

export default TouchTargetNavigator;
