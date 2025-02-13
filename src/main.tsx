import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

//  <div className="container mx-auto flex min-h-screen w-full flex-col p-5 lg:max-w-xl">
//    <MemoryRouter>
//      <LocationLogger />

//      <Routes>
//        {/* Main Accessibility Validator Page */}
//        <Route path="/" element={<AccessibilityValidator />} />

//        {/* Detailed Issue Page (Dynamic Route for Type) */}
//        <Route path="/issues/:type" element={<IssuesNavigator />} />

//        <Route path="/issues/:type" element={<p>IssuesNavigator Page</p>} />
//      </Routes>
//    </MemoryRouter>
//  </div>
