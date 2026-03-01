import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App.tsx";
import outputs from "../amplify_outputs.json";
// import "@aws-amplify/ui-react/styles.css";
import envConfig, { debugLog } from './config/environment';
import "./index.css";

// Configure Amplify with the outputs from the Amplify CLI
Amplify.configure(outputs);

debugLog(`GameSphere starting in ${envConfig.environment} mode`);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Authenticator.Provider>
          <App />
        </Authenticator.Provider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
