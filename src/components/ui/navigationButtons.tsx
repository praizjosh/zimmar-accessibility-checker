import useIssuesStore from "@/lib/useIssuesStore";

const NavigationButtons = () => {
  const navigate = useIssuesStore((state) => state.navigateTo);

  return (
    <div className="mt-4 flex justify-between">
      <button
        onClick={() => navigate("INDEX")}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        Go to Index
      </button>
      <button
        onClick={() => navigate("ISSUE_LIST_VIEW")}
        className="rounded bg-green-500 px-4 py-2 text-white"
      >
        Go to Issues List
      </button>

      <button
        onClick={() => navigate("TOUCH_TARGET_ISSUE_LIST_VIEW")}
        className="rounded bg-green-500 px-4 py-2 text-white"
      >
        Go to Touch Target Issues List
      </button>
    </div>
  );
};

export default NavigationButtons;
