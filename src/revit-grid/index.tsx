import { createRoot } from "react-dom/client";
import App from "./revit-grid";

const rootElement = document.getElementById("revit-grid-root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
