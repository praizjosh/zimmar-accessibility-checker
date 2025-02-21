/* eslint-disable no-console */
import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IssueType, IssueX } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { ISSUES_DATA_SCHEMA } from "@/lib/schemas";
import { saveAs } from "file-saver";
import Separator from "./separator";
import LoadingScreen from "./LoadingScreen";
import { ISSUES_TYPES } from "@/lib/constants";

const IssuesOverviewList: React.FC = () => {
  const {
    scanning,
    issues,
    setIssues,
    setScanning,
    setSelectedType,
    navigateTo,
  } = useIssuesStore();

  const groupListRecords = issues.filter((issue) => {
    if (issue.type && ISSUES_TYPES.includes(issue.type)) {
      if (
        issue.type === "Contrast" &&
        issue.nodeData.contrastScore?.compliance === "Fail"
      ) {
        return true;
      }
      return issue.type !== "Contrast";
    }
    return false;
  });

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
    }
  };

  const handleIssuesListClick = (type: IssueType) => {
    setSelectedType(type);
    navigateTo(
      type === "Touch Target Size" || type === "Touch Target Spacing"
        ? "TOUCH_TARGET_ISSUE_LIST_VIEW"
        : "ISSUE_LIST_VIEW",
    );
  };

  const filteredIssues = ISSUES_DATA_SCHEMA.filter((issue) =>
    issues?.some((i: IssueX) => i.type === issue.type),
  );

  // Convert issues to structured data for reporting
  const formatIssuesForReport = () => {
    return groupListRecords.map((issue) => {
      const elementName =
        issue.nodeData?.nodeType === "TEXT"
          ? issue.nodeData?.characters
          : issue.nodeData?.name;
      return {
        elementType: issue.nodeData?.nodeType || "N/A",
        elementName: elementName || "N/A",
        description: issue.description,
        severity: issue.severity,
        type: issue.type,
        wcagContrastScore: issue.nodeData?.contrastScore?.compliance || "N/A",
        contrastRatio: issue.nodeData?.contrastScore?.ratio || "N/A",
        fontSize: issue.nodeData?.fontSize || "N/A",
      };
    });
  };

  // Generate CSV report
  const generateCSV = () => {
    const formattedIssues = formatIssuesForReport();
    const csvHeader =
      "Element Type,Element Name,Issue Type,Description,Severity,WCAG Contrast Score,Font Size\n";

    const csvRows = formattedIssues.map((issue) => {
      // Handle missing or undefined values gracefully
      return [
        `"${issue.elementType || "N/A"}"`, // Element Type
        `"${issue.elementName}"`, // Element Name
        `"${issue.type || "N/A"}"`, // Issue Type
        `"${issue.description || ""}"`, // Description
        `"${issue.severity || "N/A"}"`, // Severity
        `"${issue.wcagContrastScore || "N/A"}"`, // WCAG Score
        `"${issue.contrastRatio || "N/A"}"`, // Contrast ratio
        `"${issue.fontSize || "N/A"}"`, // Font Size
      ].join(",");
    });

    // Join the header and rows to form the CSV content
    const csvContent = [csvHeader, ...csvRows].join("\n");

    // Create a Blob for the CSV content
    const csvBlob = new Blob([csvContent], { type: "text/csv" });

    saveAs(csvBlob, "accessibility-issues-report.csv");
  };

  // Generate JSON report
  const generateJSON = () => {
    const formattedIssues = formatIssuesForReport();
    const jsonBlob = new Blob([JSON.stringify(formattedIssues, null, 2)], {
      type: "application/json",
    });
    saveAs(jsonBlob, "accessibility-issues-report.json");
  };

  return (
    <div className="flex size-full flex-col">
      <div className="grid">
        <div className="flex w-full items-center justify-between gap-x-0.5">
          <div className="group inline-flex items-center justify-start gap-x-0.5">
            <Button
              title="Back to Issues Overview"
              variant="nude"
              size={"icon"}
              className="!w-fit gap-0.5 group-hover:text-accent"
              onClick={() => {
                navigateTo("INDEX");
                setIssues([]);
              }}
            >
              <ChevronLeft className="!size-6 transition-transform delay-100 ease-in-out group-hover:!-translate-x-0.5" />
              <span className="text-base">Back</span>
            </Button>
          </div>

          <span className="font-medium capitalize tracking-wide">
            Scan Results
          </span>
        </div>

        <Separator className="my-2 h-px !bg-rose-50/10" />
      </div>

      {!scanning ? (
        <div className="flex size-full flex-col">
          <Tabs defaultValue="issues">
            <TabsList className="mb-4 mt-2 flex space-x-4 bg-dark-shade !py-6">
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
            </TabsList>

            <TabsContent value="issues">
              <h3
                className={`text-lg font-semibold tracking-wide text-gray ${issues.length > 0 ? "mb-2" : "mb-4"}`}
              >
                Identified Issues
              </h3>

              {groupListRecords.length > 0 && (
                <p className="mb-5 font-open-sans text-sm">
                  There are {groupListRecords.length} issues detected on this
                  screen.
                </p>
              )}

              {filteredIssues.length > 0 ? (
                <ul className="space-y-2 last:!mb-5">
                  {filteredIssues.map((issue) => {
                    // const issueCount = issues.filter(
                    //   (i: IssueX) => i.type === issue.type,
                    // ).length;

                    const issueCount = groupListRecords.filter(
                      (i: IssueX) => i.type === issue.type,
                    ).length;

                    return (
                      <li
                        key={issue.id}
                        title={`View all ${issue.type} issues`}
                        className="group flex items-center justify-between rounded-xl bg-dark-shade text-gray transition-all duration-200 ease-in-out hover:cursor-pointer hover:ring-1 hover:ring-accent"
                      >
                        <button
                          className="flex w-full flex-col gap-y-2 px-4 py-3.5 text-left"
                          aria-label={issue.type}
                          onClick={() =>
                            handleIssuesListClick(issue.type as IssueType)
                          }
                        >
                          <div className="flex w-full items-center justify-between gap-x-2">
                            <div className="flex w-full items-center justify-start space-x-2.5 text-sm">
                              {issue.icon}

                              <span className="group-hover:text-accent">
                                {issue.type}
                              </span>
                            </div>

                            <div className="flex w-auto items-center justify-end space-x-2">
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
                                className={`text-sm !capitalize ${
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
                            <span className="w-full max-w-sm text-pretty font-medium group-hover:text-white">
                              {issue.description}
                            </span>

                            <ChevronRight className="size-5 shrink-0 text-rose-50/55 transition-transform delay-100 ease-in-out group-hover:translate-x-1 group-hover:text-accent" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="w-full text-left font-semibold text-gray">
                  No issues found
                </p>
              )}
            </TabsContent>

            <TabsContent value="report">
              <h3 className="mb-4 text-lg font-semibold tracking-wide text-gray">
                Export Report
              </h3>
              <p className="mb-4 text-sm">
                Generate a detailed report of all identified issues and
                suggestions.
              </p>
              <div className="space-x-4">
                <Button
                  title="Download JSON Report"
                  variant="default"
                  onClick={generateJSON}
                >
                  Download JSON
                </Button>
                <Button
                  title="Download CSV Report"
                  variant="default"
                  onClick={generateCSV}
                >
                  Download CSV
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <LoadingScreen message="Scanning for issues..." />
      )}
    </div>
  );
};

export default IssuesOverviewList;
