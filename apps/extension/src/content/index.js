import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import OrbOverlay from "./components/OrbOverlay";
import "./content.css";
// 1. Create container for the shadow root
const container = document.createElement("div");
container.id = "scamsniff-root";
document.body.appendChild(container);
// 2. Attach shadow root
const shadowRoot = container.attachShadow({ mode: "open" });
// 3. Create app mount point inside shadow root
const appMount = document.createElement("div");
appMount.id = "app-mount";
shadowRoot.appendChild(appMount);
// 4. Inject styles into shadow root
const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = chrome.runtime.getURL("src/content/content.css");
shadowRoot.appendChild(styleLink);
// 5. Mount React
ReactDOM.createRoot(appMount).render(_jsx(React.StrictMode, { children: _jsx(OrbOverlay, {}) }));
