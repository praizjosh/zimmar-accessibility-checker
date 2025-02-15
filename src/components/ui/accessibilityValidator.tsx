/* eslint-disable no-console */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Progress from "@/components/ui/progress";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Keyboard,
  TextCursorInput,
  Radar,
  ChevronRight,
} from "lucide-react";
import { IssueX } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import ISSUES_DATA_SCHEMA from "@/lib/isssuesDataSchema";

const AccessibilityValidator: React.FC = () => {
  const {
    issues,
    scanning,
    startScan,
    setIssues,
    setScanning,
    setSelectedType,
    navigateTo,
  } = useIssuesStore();

  console.log("scanning status", scanning);

  // Listen for messages from the backend
  onmessage = (event) => {
    // eslint-disable-next-line no-console
    console.log("window event data ==> ", event.data);

    const { type, issues } = event.data.pluginMessage;
    if (type === "loadIssues") {
      setIssues(issues);
      setScanning(false);
    }
  };

  const handleIssuesListClick = (type: string) => {
    // type: typography, contrast, touch target
    console.log("issue list clicked: ", type);

    setSelectedType(type);

    // Log the filtered issues for debugging
    // const relatedIssues = getIssueGroupList();

    // console.log("relatedIssues length in backend: ", relatedIssues.length);
    navigateTo("ISSUE_LIST_VIEW");
  };

  const filteredIssues = ISSUES_DATA_SCHEMA.filter((issue) =>
    issues?.some((i: IssueX) => i.type === issue.type),
  );

  return (
    <div className="flex w-full flex-col space-y-5">
      <Card className="border border-rose-50/10 bg-dark-shade text-white">
        <CardContent className="flex flex-col items-center p-6">
          <h2 className="text-lg font-semibold">Accessibility Score</h2>
          <Progress value={68} className="mb-4 mt-2 h-4 w-full" />
          <span className="mb-4 text-sm">68% Compliance</span>

          <Button className="bg-accent" title="Start scan" onClick={startScan}>
            <Radar className="mr-2" />
            <span>{scanning ? "Scanning..." : "Start Scan"}</span>
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="issues">
        <TabsList className="mb-2 flex space-x-4 bg-dark-shade !py-6">
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="simulate">Simulate</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <h3 className="mb-4 text-lg font-semibold tracking-wide text-[#C9C9E0]">
            Identified Issues
          </h3>

          {issues.length > 0 && (
            <p className="mb-4 text-sm">
              There are {issues.length} issues detected on this screen.
            </p>
          )}

          {filteredIssues.length > 0 ? (
            <ul className="space-y-4">
              {filteredIssues.map((issue) => {
                const issueCount = issues.filter(
                  (i: IssueX) => i.type === issue.type,
                ).length;

                return (
                  <li
                    key={issue.id}
                    className="group flex items-center justify-between rounded-xl bg-dark-shade px-4 py-3.5 transition-all duration-200 ease-in-out hover:cursor-pointer hover:ring-1 hover:ring-plum-light"
                  >
                    <button
                      className="flex w-full flex-col gap-y-2 text-left"
                      aria-label={issue.type}
                      onClick={() => handleIssuesListClick(issue.type)}
                    >
                      <div className="flex w-full items-center justify-between gap-x-2">
                        <div className="flex w-full items-center justify-start space-x-1.5">
                          {issue.icon}
                          <span>{issue.type}</span>
                        </div>

                        <div className="flex w-auto items-center justify-end space-x-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium tracking-wide text-dark-shade
                           ${
                             issue.severity === "critical"
                               ? "bg-red-500"
                               : issue.severity === "major"
                                 ? "bg-orange-500"
                                 : "bg-yellow-400"
                           }
                            `}
                          >
                            {issueCount}
                          </span>
                          <span
                            className={`!capitalize ${
                              issue.severity === "critical"
                                ? "text-red-500"
                                : issue.severity === "major"
                                  ? "text-orange-500"
                                  : "text-yellow-400"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                      </div>

                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="w-full max-w-sm text-pretty text-base">
                          {issue.description}
                        </span>

                        <ChevronRight className="size-5 shrink-0 text-rose-50/55 transition-transform delay-100 ease-in-out group-hover:translate-x-1 group-hover:text-plum-light" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="w-full text-left text-slate-400">No issues found</p>
          )}
        </TabsContent>

        <TabsContent value="simulate">
          <h3 className="mb-4 text-lg font-semibold tracking-wide text-[#C9C9E0]">
            Simulations
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Button title="Color Blindness">
              <Eye className="mr-2" />
              Color Blindness
            </Button>
            <Button title="Keyboard Navigation">
              <Keyboard className="mr-2" />
              Keyboard Navigation
            </Button>
            <Button title="Screen Reader">
              <TextCursorInput className="mr-2" />
              Screen Reader
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="report">
          <h3 className="mb-4 text-lg font-semibold tracking-wide text-[#C9C9E0]">
            Export Report
          </h3>
          <p className="mb-4 text-sm">
            Generate a detailed report of all identified issues and suggestions.
          </p>
          <Button title="Download Report" variant="default">
            Download Report
          </Button>
        </TabsContent>
      </Tabs>

      {/* {showCard && (
        <Card className="fixed bottom-4 right-4 w-96 border bg-dark shadow-lg">
          <CardContent>
            <IssuesNavigator />
            <Button title="View Suggestions" variant="outline">
              View Suggestions
            </Button>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
};

export default AccessibilityValidator;
