// Environment Configuration
// Controls whether the app uses mock data or real AWS services

export type AppEnvironment = 'development' | 'production';

interface EnvironmentConfig {
  environment: AppEnvironment;
  enableDebugLogs: boolean;
  apiTimeout: number;
}

const getEnvironment = (): AppEnvironment => {
  const env = import.meta.env.VITE_APP_ENV as AppEnvironment;
  if (env && ['development', 'production'].includes(env)) {
    return env;
  }
  // Default to 'development' for local development without .env
  return import.meta.env.DEV ? 'development' : 'production';
};

const createEnvironmentConfig = (): EnvironmentConfig => {
  const environment = getEnvironment();

  const configs: Record<AppEnvironment,EnvironmentConfig> = {
    development: {
      environment: 'development',
      enableDebugLogs: true,
      apiTimeout: 1000,
    },
    production: {
      environment: 'production',
      enableDebugLogs: false,
      apiTimeout: 30000,
    },
  };

  return {
    ...configs[environment],
  };
};

export const envConfig = createEnvironmentConfig();

// Helper functions
export const isDevelopment = () => envConfig.environment === 'development';
export const isProduction = () => envConfig.environment === 'production';

// Debug logger that only logs in non-production
export const debugLog = (message: string, ...args: unknown[]) => {
  if (envConfig.enableDebugLogs) {
    console.log(`[GameSphere ${envConfig.environment}]`, message, ...args);
  }
};

export const debugError = (message: string, ...args: unknown[]) => {
  if (envConfig.enableDebugLogs) {
    console.error(`[GameSphere ${envConfig.environment}]`, message, ...args);
  }
};

export default envConfig;
