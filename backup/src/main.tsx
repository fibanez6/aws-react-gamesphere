import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import amplifyConfig from './config/amplify';
import envConfig, { debugLog } from './config/environment';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Configure AWS Amplify only when not using mock auth
if (!envConfig.useMockAuth) {
  debugLog('Configuring AWS Amplify...');
  Amplify.configure(amplifyConfig);
} else {
  debugLog('Running in mock mode - Amplify not configured');
}

debugLog(`GameSphere starting in ${envConfig.environment} mode`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
