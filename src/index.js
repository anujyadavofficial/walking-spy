import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Walker } from "./walker";

import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

console.log(Walker.greet);
Walker.greet("Walker It is");
