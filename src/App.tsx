import AccessibilityValidator from "./components/ui/accessibilityValidator";
import IssuesNavigator from "./components/ui/issuesNavigator";
import IssuesOverviewList from "./components/ui/issuesOverviewList";
import TouchTargetNavigator from "./components/ui/touchTargetNavigator";
import { ROUTES_LIST } from "./lib/types";
import useIssuesStore from "./lib/useIssuesStore";

export default function App() {
  const { currentRoute } = useIssuesStore();

  const RoutesMap: ROUTES_LIST = {
    INDEX: <AccessibilityValidator />,
    ISSUE_OVERVIEW_LIST_VIEW: <IssuesOverviewList />,
    ISSUE_LIST_VIEW: <IssuesNavigator />,
    TOUCH_TARGET_ISSUE_LIST_VIEW: <TouchTargetNavigator />,
  };

  return (
    <div className="mx-auto grid size-full max-w-3xl items-center p-5">
      <div className="container flex size-full flex-col items-center">
        {RoutesMap[currentRoute]}
      </div>
    </div>
  );
}
