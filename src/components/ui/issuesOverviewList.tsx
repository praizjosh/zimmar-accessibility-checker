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

const IssuesOverviewList: React.FC = () => {
  const { issues, setIssues, setSelectedType, navigateTo } = useIssuesStore();

  // onmessage = (event) => {
  //   const { type, issues } = event.data.pluginMessage;
  //   if (type === "loadIssues") {
  //     setIssues(issues);
  //     setScanning(false);
  //   }
  // };

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
    return issues.map((issue) => {
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
        wcagContrastScore: issue.nodeData?.contrastScore || "N/A",
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
    <div className="size-full">
      <div className="flex w-full items-center justify-start gap-x-0.5">
        <Button
          title="Back to Issues Overview"
          variant="nude"
          size={"icon"}
          className="!w-fit transition-transform delay-100 ease-in-out hover:!-translate-x-0.5 hover:text-plum-light"
          onClick={() => {
            navigateTo("INDEX");
            setIssues([]);
          }}
        >
          <ChevronLeft className="!size-6" />
        </Button>
        <p className="font-open-sans text-lg capitalize tracking-wide text-white">
          Scan Results
        </p>
      </div>

      <Separator className="my-2 h-px !bg-rose-50/10" />

      <div className="flex size-full flex-col space-y-5">
        <Tabs defaultValue="issues">
          <TabsList className="mb-2 flex space-x-4 bg-dark-shade !py-6">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            {/* <TabsTrigger value="simulate">Simulate</TabsTrigger> */}
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          <TabsContent value="issues">
            <h3 className="mb-4 font-open-sans text-lg font-semibold tracking-wide text-[#C9C9E0]">
              Identified Issues
            </h3>

            {issues.length > 0 && (
              <p className="mb-4 font-open-sans text-sm">
                There are {issues.length} issues detected on this screen.
              </p>
            )}

            {filteredIssues.length > 0 ? (
              <ul className="space-y-2">
                {filteredIssues.map((issue) => {
                  const issueCount = issues.filter(
                    (i: IssueX) => i.type === issue.type,
                  ).length;

                  return (
                    <li
                      key={issue.id}
                      title={`View all ${issue.type} issues`}
                      className="group flex items-center justify-between rounded-xl bg-dark-shade transition-all duration-200 ease-in-out hover:cursor-pointer hover:ring-1 hover:ring-plum-light"
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
                            <span>{issue.type}</span>
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
                          <span className="w-full max-w-sm text-pretty font-medium">
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

          {/* <TabsContent value="simulate">
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
        </TabsContent> */}

          <TabsContent value="report">
            <h3 className="mb-4 text-lg font-semibold tracking-wide text-[#C9C9E0]">
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
          {/* <TabsContent value="report">
            <h3 className="mb-4 text-lg font-semibold tracking-wide text-[#C9C9E0]">
              Export Report
            </h3>
            <p className="mb-4 text-sm">
              Generate a detailed report of all identified issues and
              suggestions.
            </p>
            <Button title="Download Report" variant="default">
              Download Report
            </Button>
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
};

export default IssuesOverviewList;
