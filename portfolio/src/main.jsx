import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/animations.css";
import "./styles/id-card.css";
import "./styles/balance-scale.css";
import "./styles/printer-projects.css";
import "./styles/git-graph.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
