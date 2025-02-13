import AccessibilityValidator from "./components/ui/accessibilityValidator";
import IssuesNavigator from "./components/ui/issuesNavigator";
import { ROUTES_LIST } from "./lib/types";
import useIssuesStore from "./lib/useIssuesStore";

export default function App() {
  const { currentRoute } = useIssuesStore();

  const RoutesMap: ROUTES_LIST = {
    INDEX: <AccessibilityValidator />,
    ISSUE_LIST_VIEW: <IssuesNavigator />,
  };

  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col p-5 lg:max-w-xl">
      {/* Main Accessibility Validator Page */}
      {/* <AccessibilityValidator /> */}

      {/* <NavigationButtons /> */}
      {/* <br /> */}

      {RoutesMap[currentRoute]}
    </div>
  );
}
