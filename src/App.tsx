import AccessibilityValidator from "./components/organisms/AccessibilityValidator";
import IssuesNavigator from "./components/organisms/IssuesNavigator";
import IssuesOverviewList from "./components/organisms/IssuesOverviewList";
import TouchTargetNavigator from "./components/organisms/TouchTargetNavigator";
import { ROUTES_LIST } from "./lib/types";
import useIssuesStore from "./lib/useIssuesStore";
import { cn } from "./lib/utils";

export default function App() {
  const { currentRoute } = useIssuesStore();
  const RoutesMap: ROUTES_LIST = {
    INDEX: <AccessibilityValidator />,
    ISSUE_OVERVIEW_LIST_VIEW: <IssuesOverviewList />,
    ISSUE_LIST_VIEW: <IssuesNavigator />,
    TOUCH_TARGET_ISSUE_LIST_VIEW: <TouchTargetNavigator />,
  };

  return (
    <div
      className={cn("mx-auto grid size-full max-w-3xl items-center p-4", {
        "!mb-6": currentRoute === "ISSUE_OVERVIEW_LIST_VIEW",
      })}
    >
      <div className="container flex size-full flex-col items-center">
        {RoutesMap[currentRoute]}
      </div>
    </div>
  );
}
