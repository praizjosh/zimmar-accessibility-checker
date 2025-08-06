/* eslint-disable no-console */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { ISSUES_DATA_SCHEMA } from "@/lib/schemas";
import { IssueType } from "@/lib/types";
import useIssuesStore from "@/lib/useIssuesStore";
import { ChevronRight, Radar } from "lucide-react";
import { useEffect } from "react";

export default function AccessibilityValidator() {
  const { scanning, startScan, setSelectedType, navigateTo } = useIssuesStore();

  // onmessage = (event: MessageEvent) => {
  //   const { type, data } = event.data.pluginMessage || {};
  //   console.log("Received message:", type, data);

  //   if (type === "GENERATE_ALT_TEXT") {
  //     console.log("Received GENERATE_ALT_TEXT message:", data);
  //   }
  // };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const { type, data } = event.data.pluginMessage || {};
      // console.log("Received message:", type, data);

      if (type === "GENERATE_ALT_TEXT") {
        try {
          // Update the UI to show loading state
          const altTextArea = document.getElementById(
            "altTextArea",
          ) as HTMLTextAreaElement;

          if (altTextArea) {
            altTextArea.value = "Generating alt text...";
          }

          // Make API call to your endpoint
          const response = await fetch(
            "http://localhost:8005/generate-alt-text",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...data }),
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          const { altText } = result;

          // Update the textarea with the generated alt text
          if (altTextArea) {
            altTextArea.value = altText || "No alt text generated";
          }
        } catch (error) {
          console.error("Error generating alt text:", error);
          const altTextArea = document.getElementById(
            "altTextArea",
          ) as HTMLTextAreaElement;
          if (altTextArea) {
            if (error instanceof Error && error.message.includes("413")) {
              altTextArea.value =
                "Image too large. Please use or select a smaller element and try again.";
            } else if (
              error instanceof Error &&
              error.message.includes("Failed to fetch")
            ) {
              altTextArea.value =
                "Network error. Please check your API server and try again.";
            } else {
              altTextArea.value =
                "Error generating alt text. Please try again.";
            }
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleIssuesListClick = (type: IssueType) => {
    postMessageToBackend("start-quickcheck");
    setSelectedType(type);
    navigateTo(
      type === "Touch Target Size" || type === "Touch Target Spacing"
        ? "TOUCH_TARGET_ISSUE_LIST_VIEW"
        : "ISSUE_LIST_VIEW",
    );
  };

  function generateAltText() {
    parent.postMessage({ pluginMessage: { type: "get-image-data" } }, "*");
  }

  return (
    <div className="flex size-full flex-col space-y-5">
      <Card className="border border-rose-50/10 bg-dark-shade text-white">
        <CardContent className="flex flex-col items-center p-4">
          <Button
            className="w-full bg-accent"
            title="Scan design for accessibility issues"
            onClick={startScan}
            disabled={scanning}
          >
            <Radar className="mr-2" />
            <span>Scan entire page</span>
          </Button>
        </CardContent>
      </Card>

      <div className="relative m-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-rose-50/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-dark px-5 text-sm text-gray">
            or scan a layer for
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {/* {ISSUES_DATA_SCHEMA.filter(
          (issue) => issue.type !== "Touch Target Spacing",
        ).map((issue) => { */}
        {ISSUES_DATA_SCHEMA.map((issue) => {
          return (
            <li
              key={issue.id}
              title={`Find ${issue.type} issues`}
              className="group flex items-center justify-between rounded-xl bg-dark-shade text-gray transition-all duration-200 ease-in-out hover:cursor-pointer hover:ring-1 hover:ring-accent"
            >
              <button
                className="flex w-full flex-col gap-y-2 px-4 py-3.5 text-left text-sm"
                aria-label={issue.type}
                onClick={() => handleIssuesListClick(issue.type as IssueType)}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex w-full items-center justify-start space-x-2.5">
                    {issue.icon}
                    <span className="group-hover:text-accent">
                      {issue.type} issues
                    </span>
                  </div>
                  <ChevronRight
                    strokeWidth={1.5}
                    className="size-5 shrink-0 text-rose-50/55 transition-transform delay-100 ease-in-out group-hover:translate-x-1 group-hover:text-accent"
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <hr />
      <h3>🤖 AI Assistant Tools</h3>

      {/* <!-- Alt Text Generator --> */}
      <div className="flex flex-col items-center space-y-2">
        <label htmlFor="altButton">📷 Alt Text Generator</label>
        <br />
        <button id="altButton" onClick={generateAltText}>
          Generate Alt Text
        </button>
        <textarea
          className="w-full rounded p-2 text-sm text-black/75"
          aria-label="Generated alt text"
          id="altTextArea"
          rows={2}
          placeholder="Generated alt text will appear here..."
        ></textarea>
      </div>

      {/* <!-- Accessibility Q&A --> */}
      <div className="mt-4 flex flex-col items-center space-y-2">
        <label htmlFor="question">💬 Ask Accessibility AI</label>
        <br />
        <input
          aria-label="Ask a question about accessibility"
          type="text"
          id="question"
          placeholder="E.g. Is this button accessible?"
        />
        <button id="askAI">Send</button>
        <div
          id="aiResponse"
          className="w-full whitespace-pre-wrap rounded bg-dark-shade p-2 text-sm text-gray"
        ></div>
      </div>

      <div className="mt-auto flex size-full flex-col items-center text-xs text-rose-50/40">
        <p className="mt-auto">
          &copy; {new Date().getFullYear()} Zimmar Technologies. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
