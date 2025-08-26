import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, Check, ChevronRight, Copy } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

type AltTextGeneratorProps = {
  isExpanded?: boolean;
  setIsExpanded?: Dispatch<SetStateAction<boolean>>;
};

export default function AltTextGenerator({
  isExpanded,
  setIsExpanded,
}: AltTextGeneratorProps) {
  const altTextArea = useRef<HTMLDivElement>(null);
  const [remainingQuotaValue, setRemainingQuotaValue] = useState<string | null>(
    null,
  );
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState<boolean>(false);
  const [textIsCopied, setTextIsCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const { type, data } = event.data.pluginMessage || {};

      if (type === "GENERATE_ALT_TEXT") {
        try {
          if (altTextArea.current) {
            altTextArea.current.textContent = "Generating alt text...";
          }
          setLoading(true);
          setError(false);
          setHasResult(false); // Reset result state

          const response = await fetch(
            "http://localhost:8787/generate-alt-text",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...data }),
            },
          );

          if (!response.ok) {
            const result = await response.json();

            if (result.data.remaining === 0) {
              setRemainingQuotaValue(result.data.remaining);
            }
            setIsQuotaExceeded(result.error);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          const { altText, remaining } = result.data;
          setRemainingQuotaValue(remaining);

          if (altTextArea.current) {
            altTextArea.current.textContent = altText;
          }
          setTextIsCopied(false);
          setLoading(false);
          setHasResult(true);
        } catch (error) {
          console.error("Error generating alt text:", error);
          setError(true);
          setHasResult(false); // No result on error
          setLoading(false);

          if (altTextArea.current) {
            if (error instanceof Error && error.message.includes("413")) {
              altTextArea.current.textContent =
                "Image too large. Please use or select a smaller element and try again.";
            } else if (
              error instanceof Error &&
              error.message.includes("Failed to fetch")
            ) {
              altTextArea.current.textContent =
                "Network error. Please try again.";
            } else {
              altTextArea.current.textContent = null;
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

  function generateAltText() {
    parent.postMessage({ pluginMessage: { type: "get-image-data" } }, "*");
  }

  function handleCopyClick() {
    if (altTextArea.current) {
      const range = document.createRange();
      range.selectNodeContents(altTextArea.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
      selection?.removeAllRanges(); // Clear selection after copying
      setTextIsCopied(true);
      setTimeout(() => {
        setTextIsCopied(false);
      }, 1500);
    }
  }

  return (
    <div
      role={!isExpanded ? "button" : "presentation"}
      aria-live={isExpanded ? "polite" : undefined}
      tabIndex={0}
      aria-label="Alt Text Generator"
      className={cn(
        "flex items-center justify-between rounded-xl bg-dark-shade transition-all duration-200 ease-in-out delay-1000",
        {
          "group text-grey hover:cursor-pointer hover:ring-1 hover:ring-accent":
            !isExpanded,
        },
      )}
      onClick={() => {
        if (setIsExpanded && !isExpanded) {
          setIsExpanded(!isExpanded);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (setIsExpanded && !isExpanded) {
            setIsExpanded(!isExpanded);
          }
        }
      }}
    >
      <div className="flex w-full flex-col gap-y-2 px-4 py-3.5 text-left">
        <div className="flex w-full items-center justify-between space-x-2.5 ">
          <div className="flex w-full items-center justify-start space-x-2.5 text-sm group-hover:text-accent">
            <Camera className="size-[1.1rem]" />
            <span>Alt Text Generator</span>
          </div>

          <ChevronRight
            strokeWidth={1.5}
            className={cn(
              "size-5 shrink-0 text-rose-50/55 transition-transform ease-in-out group-hover:translate-x-1 group-hover:text-accent",
              {
                "-rotate-90 hover:text-accent": isExpanded,
              },
            )}
            onClick={() => {
              if (setIsExpanded && isExpanded) {
                setIsExpanded(!isExpanded);
              }
            }}
          />
        </div>

        {isExpanded && (
          <>
            <span className="text-sm text-grey">
              Generate alternate text for selected images
            </span>

            <div className="flex items-center justify-between gap-1.5">
              <div
                className={cn(
                  "flex size-full min-h-10 overflow-y-auto rounded-md border border-gray-500/55 px-3 py-2 text-sm text-white/75",
                  {
                    "text-red-500": error,
                  },
                )}
                aria-live="polite"
                ref={altTextArea}
              >
                Generated alt text will appear here...
              </div>

              {hasResult && (
                <span className="rounded-md p-2 transition-all duration-200 ease-in-out hover:bg-dark">
                  {textIsCopied ? (
                    <Check
                      className=" text-green-500"
                      aria-label="Text copied to clipboard"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Copy
                      className="cursor-pointer text-grey hover:text-accent"
                      aria-label="Copy generated alt text to clipboard"
                      onClick={handleCopyClick}
                      strokeWidth={1.2}
                    />
                  )}
                </span>
              )}
            </div>

            <Button
              className="w-full bg-dark-alt text-white"
              title="Generate alt text for selected images"
              onClick={generateAltText}
              disabled={loading}
            >
              Generate alt text
            </Button>

            {remainingQuotaValue !== null &&
              remainingQuotaValue !== undefined && (
                <div className="text-xs text-grey">
                  Remaining requests today:{" "}
                  <span
                    className={cn({
                      "text-red-500": error,
                    })}
                  >
                    {remainingQuotaValue}
                  </span>
                </div>
              )}

            {isQuotaExceeded && (
              <div
                className={cn("text-xs text-grey", {
                  "text-red-500": error,
                })}
              >
                {isQuotaExceeded}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
