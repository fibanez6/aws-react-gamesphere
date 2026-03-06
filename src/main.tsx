import { Authenticator } from '@aws-amplify/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from "aws-amplify";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import outputs from "../amplify_outputs.json";
import App from "./App.tsx";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
// import "@aws-amplify/ui-react/styles.css";
import envConfig, { debugLog } from './config/environment';
import "./index.css";

// Configure Amplify with the outputs from the Amplify CLI
Amplify.configure(outputs);

debugLog(`GameSphere starting in ${envConfig.environment} mode`);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // data considered fresh for 30 s
      gcTime: 1000 * 60 * 5,       // cache kept for 5 min after unmount
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Authenticator.Provider>
            <UserProvider>
              <App />
            </UserProvider>
          </Authenticator.Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
