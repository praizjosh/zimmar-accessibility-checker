import LoadingSpinner from "@/components/ui/loadingSpinner";

export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="inset-0 z-50 flex size-full flex-col items-center justify-center">
      <LoadingSpinner className="mb-4 size-16" />
      {message && <p className="text-base text-white">{message}</p>}
    </div>
  );
}
