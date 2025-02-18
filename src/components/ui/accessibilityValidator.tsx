import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radar, ChevronRight } from "lucide-react";
import { IssueType } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { ISSUES_DATA_SCHEMA } from "@/lib/schemas";
import { postMessageToBackend } from "@/lib/figmaUtils";
import LoadingSpinner from "./loadingSpinner";

const AccessibilityValidator: React.FC = () => {
  const {
    scanning,
    startScan,
    setIssues,
    setScanning,
    setSelectedType,
    navigateTo,
  } = useIssuesStore();

  // Listen for messages from the backend
  onmessage = (event) => {
    if (!event.data || !event.data.pluginMessage) {
      console.error("Invalid message format:", event.data);
      return;
    }

    const { type, data } = event.data.pluginMessage;

    if (type === "loadIssues") {
      setIssues(data);
      setScanning(false);
      navigateTo("ISSUE_OVERVIEW_LIST_VIEW");
    }
  };

  const handleIssuesListClick = (type: IssueType) => {
    postMessageToBackend("start-quickcheck");

    setSelectedType(type);

    navigateTo(
      type === "Touch Target Size" || type === "Touch Target Spacing"
        ? "TOUCH_TARGET_ISSUE_LIST_VIEW"
        : "ISSUE_LIST_VIEW",
    );
  };

  return (
    <div className="flex size-full flex-col space-y-5">
      <Card className="border border-rose-50/10 bg-dark-shade text-white">
        <CardContent className="flex flex-col items-center p-6">
          {/* <h2 className="text-lg font-semibold">Accessibility Score</h2>
          <Progress value={68} className="mb-4 mt-2 h-4 w-full" />
          <span className="mb-4 text-sm">68% Compliance</span> */}

          <Button
            className="w-full bg-accent"
            title="Start scan"
            onClick={startScan}
            disabled={scanning}
          >
            {scanning ? (
              <LoadingSpinner className="mr-2 fill-accent" />
            ) : (
              <Radar className="mr-2" />
            )}

            <span>{scanning ? "Scanning..." : "Start Scan"}</span>
          </Button>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {ISSUES_DATA_SCHEMA.map((issue) => {
          return (
            <li
              key={issue.id}
              title={`Find ${issue.type} issues`}
              className="group flex items-center justify-between rounded-xl bg-dark-shade transition-all duration-200 ease-in-out hover:cursor-pointer hover:ring-1 hover:ring-plum-light"
            >
              <button
                className="flex w-full flex-col gap-y-2 px-4 py-3.5 text-left"
                aria-label={issue.type}
                onClick={() => handleIssuesListClick(issue.type as IssueType)}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex w-full items-center justify-start space-x-2.5">
                    {issue.icon}
                    <span>{issue.type}</span>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-rose-50/55 transition-transform delay-100 ease-in-out group-hover:translate-x-1 group-hover:text-plum-light" />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex size-full max-w-lg flex-col items-center text-xs text-rose-50/40">
        <p className="mt-auto">
          &copy; {new Date().getFullYear()} Zimmar Technologies. All rights
          reserved.
        </p>
      </div>
    </div>
  );
};

export default AccessibilityValidator;
