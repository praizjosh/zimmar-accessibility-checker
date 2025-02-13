import { useLocation } from "react-router";

export default function LocationLogger() {
  const location = useLocation();
  // eslint-disable-next-line no-console
  console.log("Current location: ", location.pathname);
  return null;
}
