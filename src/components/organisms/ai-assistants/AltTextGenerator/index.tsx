import { Button } from "@/components/ui/button";
import { MESSAGE_TYPES } from "@/lib/constants";
import { postMessageToBackend } from "@/lib/figmaUtils";
import { cn, copyToClipboard } from "@/lib/utils";
import { Camera, Check, ChevronRight, Copy, Sparkles } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

type AltTextGeneratorProps = {
	isExpanded?: boolean;
	setIsExpanded?: Dispatch<SetStateAction<boolean>>;
};

export default function AltTextGenerator({ isExpanded, setIsExpanded }: AltTextGeneratorProps) {
	const altTextArea = useRef<HTMLDivElement>(null);
	const [remainingQuotaValue, setRemainingQuotaValue] = useState<string | null>(null);
	const [isQuotaExceeded, setIsQuotaExceeded] = useState<string | null>(null);
	const [hasResult, setHasResult] = useState<boolean>(false);
	const [textIsCopied, setTextIsCopied] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<boolean>(false);

	useEffect(() => {
		const handleMessage = async (event: MessageEvent) => {
			const { type, data } = event.data.pluginMessage || {};

			if (type === MESSAGE_TYPES.GENERATE_ALT_TEXT) {
				try {
					if (altTextArea.current) {
						altTextArea.current.textContent = "Generating alt text...";
					}
					setLoading(true);
					setError(false);
					setHasResult(false); // Reset result state

					const response = await fetch(
						"https://zimmar-d1.praizjosh.workers.dev/generate-alt-text",
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ ...data }),
						},
					);

					if (!response.ok) {
						const result = await response.json().catch(() => null);

						if (result?.data?.remaining === 0) {
							setRemainingQuotaValue(result.data.remaining);
						}
						setIsQuotaExceeded(result?.error ?? null);
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
							altTextArea.current.textContent = "Network error. Please try again.";
						} else {
							altTextArea.current.textContent =
								"Something went wrong generating alt text. Please try again.";
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
		postMessageToBackend(MESSAGE_TYPES.GET_IMAGE_DATA);
	}

	function handleCopyClick() {
		const text = altTextArea.current?.textContent;
		if (!text) return;

		copyToClipboard({
			text,
			onSuccess: () => {
				setTextIsCopied(true);
				setTimeout(() => setTextIsCopied(false), 1500);
				postMessageToBackend(MESSAGE_TYPES.NOTIFY, {
					message: "Alt text copied to clipboard",
				});
			},
			onError: (error) => {
				console.error("Failed to copy alt text to clipboard:", error);
			},
		});
	}

	return (
		<div
			role={!isExpanded ? "button" : "presentation"}
			title={!isExpanded ? "Generate alternate text for selected images" : undefined}
			aria-live={isExpanded ? "polite" : undefined}
			tabIndex={0}
			aria-label="Alt Text Generator"
			className={cn(
				"flex items-center justify-between rounded-xl border border-rose-50/10 bg-dark-shade transition-all delay-1000 duration-200 ease-in-out",
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
						<Camera aria-hidden="true" className="size-[1.1rem]" />
						<span>Alt Text Generator</span>
					</div>

					{isExpanded ? (
						<Button
							title="Collapse Alt Text Generator"
							variant="ghost"
							size="icon"
							className="size-5! w-fit! shrink-0 p-0 hover:bg-transparent hover:text-accent"
							onClick={() => setIsExpanded?.(false)}
						>
							<ChevronRight
								strokeWidth={1.5}
								aria-hidden="true"
								className="size-5 shrink-0 -rotate-90 text-rose-50/55"
							/>
						</Button>
					) : (
						<ChevronRight
							strokeWidth={1.5}
							aria-hidden="true"
							className="size-5 shrink-0 text-rose-50/55 transition-transform ease-in-out group-hover:translate-x-1 group-hover:text-accent"
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
							className="group w-full bg-dark-alt text-white"
							title="Generate alt text for selected images"
							onClick={generateAltText}
							disabled={loading}
						>
							<Sparkles
								aria-hidden="true"
								className="text-pink-300 group-hover:text-white"
							/>
							<span>Generate alt text</span>
						</Button>

						{remainingQuotaValue !== null && remainingQuotaValue !== undefined && (
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
