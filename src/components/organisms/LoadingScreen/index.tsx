import LoadingSpinner from "@/components/ui/loadingSpinner";
import { ReactNode } from "react";

export type LoadingScreenProps = {
	message?: string;
	/** e.g. a cancel button - rendered below the message. */
	children?: ReactNode;
};

export default function LoadingScreen({ message, children }: LoadingScreenProps) {
	return (
		<div className="inset-0 z-50 flex size-full flex-col items-center justify-center">
			<LoadingSpinner className="mb-4 size-16" />
			{message && <p className="text-base text-white">{message}</p>}
			{children}
		</div>
	);
}
