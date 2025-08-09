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

          if (altTextArea.current) {
            altTextArea.current.textContent = altText;
          }
          setTextIsCopied(false);
          setLoading(false);
        } catch (error) {
          console.error("Error generating alt text:", error);
          setError(true);

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
              altTextArea.current.textContent =
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
    <button
      type="button"
      aria-label="Alt Text Generator"
      className={cn(
        "flex items-center justify-between rounded-xl bg-dark-shade transition-all duration-200 ease-in-out ",
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
    >
      <div className="flex w-full flex-col gap-y-2 px-4 py-3.5 text-left">
        <div className="flex w-full items-center justify-between space-x-2.5 ">
          <div className="flex w-full items-center justify-start space-x-2.5 text-sm group-hover:text-accent">
            <Camera className="size-[1.1rem]" />
            <span>Alt Text Generator</span>
          </div>

          {isExpanded && (
            <ChevronRight
              strokeWidth={1.5}
              className="size-5 shrink-0 -rotate-90 text-rose-50/55 transition-transform delay-100 ease-in-out hover:text-accent"
              onClick={() => {
                if (setIsExpanded && isExpanded) {
                  setIsExpanded(!isExpanded);
                }
              }}
            />
          )}
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
            </div>

            <Button
              className="w-full bg-dark-alt text-white"
              title="Generate alt text for selected images"
              onClick={generateAltText}
              disabled={loading}
            >
              Generate alt text
            </Button>
          </>
        )}
      </div>
    </button>
  );
}
