/* eslint-disable no-console */
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  // AlertCircle,
  // CheckCircle,
  CaseSensitive,
  Eye,
  Keyboard,
  TextCursorInput,
  Radar,
} from "lucide-react";

const issuesData = [
  {
    type: "Contrast",
    description: "Text contrast is below WCAG AA standard.",
    severity: "High",
    id: "1",
    fontSize: 14,
    nodeType: "TEXT",
    icon: CaseSensitive,
  },
  {
    type: "Typography",
    description: "Text size is too small for readability.",
    severity: "Medium",
    id: "2",
    fontSize: 10,
    nodeType: "TEXT",
    icon: CaseSensitive,
  },
  {
    type: "Touch Target",
    description: "Button touch target is smaller than 44px.",
    severity: "Low",
    id: "3",
    fontSize: 12,
    nodeType: [
      "COMPONENT",
      "COMPONENT_SET",
      "ELLIPSE",
      "FRAME",
      "GROUP",
      "INSTANCE",
      "POLYGON",
      "RECTANGLE",
      "VECTOR",
      "WIDGET",
    ],
    icon: CaseSensitive,
  },
];

export interface Issue {
  type: string;
  description: string;
  severity: string; // Options: High, Medium, Low
  id: string;
  fontSize: number;
  nodeType: string | string[];
  node?: unknown;
}

const AccessibilityValidator: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issues, setIssues] = useState<Issue[] | null>([]); // List of issues
  // const [issueIndex, setIssueIndex] = useState(0);
  const [showCard, setShowCard] = useState<boolean>(false);

  // Start the scan by sending a message to the backend
  const startScan = () => {
    parent.postMessage({ pluginMessage: { type: "scan" } }, "*");
  };

  // Listen for messages from the backend
  onmessage = (event) => {
    // eslint-disable-next-line no-console
    console.log("window event data ==> ", event.data);
    const { pluginMessage } = event.data;

    if (pluginMessage?.type === "results") {
      setSelectedIssue(pluginMessage.issues); // Update state with identified issues
    }
  };

  const handleNavigation = (type: string) => {
    parent.postMessage({ pluginMessage: { type } }, "*");
  };

  // Communicate with backend
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMessage = (event: any) => {
      const { pluginMessage } = event.data;

      if (pluginMessage?.type === "results") {
        console.log("Issues loaded:", pluginMessage.issues);
        setIssues(pluginMessage.issues || []);
        setSelectedIssue(pluginMessage.issues?.[0] || null);
      }

      // if (pluginMessage?.type === "loadIssues") {
      //   console.log("Issues loaded:", pluginMessage.issues);
      //   setIssues(pluginMessage.issues);
      // }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  console.log("main issues: ", issues);
  console.log("selectedIssue: ", selectedIssue);

  const handleIdentifiedIssuesListClick = () => {
    console.log("issue list clicked: ");
    parent.postMessage(
      { pluginMessage: { type: "identifiedIssuesListClick" } },
      "*",
    );
    setShowCard(true);
  };

  return (
    <div className="w-full p-4">
      <h1 className="mb-4 text-xl font-bold">Accessibility Validator</h1>

      <Card className="mb-4 bg-transparent text-white">
        <CardContent className="flex flex-col items-center">
          <h2 className="text-lg font-semibold">Accessibility Score</h2>
          <Progress value={68} className="mb-4 mt-2 h-4 w-full" />
          <span className="mb-4 text-sm">68% Compliance</span>

          <Button title="Start scan" onClick={startScan}>
            <Radar className="mr-1" /> Scan Issues
          </Button>

          <div className="mt-4 flex justify-start gap-4">
            <Button
              title="Goto previous issue"
              onClick={() => handleNavigation("previous")}
            >
              Previous
            </Button>

            <Button
              title="Goto next issue"
              onClick={() => handleNavigation("next")}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="issues" className="mb-4">
        <TabsList className="flex space-x-4">
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="simulate">Simulate</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          {issuesData.map((issue) => {
            if (!issues || issues.length === 0) return null;

            const isMatch = issues.some((i) => i.type === issue.type);

            if (!isMatch) return null;

            const filteredIssues = issuesData.filter((issue) =>
              issues?.some((i) => i.type === issue.type),
            );

            return (
              <>
                <h3 className="mb-2 text-lg font-semibold">
                  Identified Issues
                </h3>
                <ul className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <li key={issue.id} className="rounded-md border p-2">
                      <button
                        className="w-full cursor-pointer text-left"
                        aria-label={issue.type}
                        onClick={handleIdentifiedIssuesListClick}
                      >
                        <div className="flex items-start justify-between">
                          <span>
                            {issue.icon && <issue.icon />} {issue.type}:{" "}
                            {issue.description}
                          </span>
                          <span
                            className={`${
                              issue.severity === "High"
                                ? "text-red-500"
                                : issue.severity === "Medium"
                                  ? "text-amber-500"
                                  : "text-orange-500"
                            } font-bold`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            );
          })}
        </TabsContent>

        <TabsContent value="simulate">
          <h3 className="mb-4 text-lg font-semibold">Simulations</h3>
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
          <h3 className="mb-4 text-lg font-semibold">Export Report</h3>
          <p className="mb-4 text-sm">
            Generate a detailed report of all identified issues and suggestions.
          </p>
          <Button title="Download Report" variant="default">
            Download Report
          </Button>
        </TabsContent>
      </Tabs>

      {showCard && selectedIssue && (
        <Card className="fixed bottom-4 right-4 w-96 border shadow-lg">
          <CardContent>
            <div className="mb-0.5 flex items-center justify-between">
              <h4 className="text-lg font-bold">{selectedIssue.type} Issue</h4>
              <Button
                title="Close"
                variant="ghost"
                onClick={() => setShowCard(false)}
              >
                Close
              </Button>
            </div>

            <div className="mb-4 flex items-center justify-between space-x-2">
              <Button
                title="Goto previous issue"
                variant="ghost"
                onClick={() => handleNavigation("previous")}
              >
                Prev
              </Button>
              <span className="text-sm">Issue 1 of {issues?.length}</span>
              <Button
                title="Goto next issue"
                variant="ghost"
                onClick={() => handleNavigation("next")}
              >
                Next
              </Button>
            </div>

            <p className="mb-4 text-sm">{selectedIssue.description}</p>

            <div className="mb-2 flex flex-col justify-center space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">Text: </p>
                <p className="text-sm">text</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm">Font size: </p>
                <p className="text-sm">{selectedIssue.fontSize}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm">WCAG score: </p>
                <p className="text-sm">score</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm">Severity: </p>
                <p
                  className={`${
                    selectedIssue.severity === "High"
                      ? "text-red-500"
                      : selectedIssue.severity === "Medium"
                        ? "text-amber-500"
                        : "text-orange-500"
                  } font-bold`}
                >
                  {selectedIssue.severity}
                </p>
              </div>
            </div>
            <Button title="View Suggestions" variant="outline">
              View Suggestions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccessibilityValidator;
