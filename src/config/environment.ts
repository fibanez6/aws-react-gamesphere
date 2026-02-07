// Environment Configuration
// Controls whether the app uses mock data or real AWS services

export type AppEnvironment = 'mock' | 'development' | 'production';
export type AuthProvider = 'mock' | 'amplify' | 'cognito';

interface EnvironmentConfig {
  environment: AppEnvironment;
  authProvider: AuthProvider;
  useMockAuth: boolean;
  useMockData: boolean;
  enableDebugLogs: boolean;
  apiTimeout: number;
}

const getEnvironment = (): AppEnvironment => {
  const env = import.meta.env.VITE_APP_ENV as AppEnvironment;
  if (env && ['mock', 'development', 'production'].includes(env)) {
    return env;
  }
  // Default to 'mock' for local development without .env
  return import.meta.env.DEV ? 'mock' : 'production';
};

const getAuthProvider = (environment: AppEnvironment): AuthProvider => {
  // Check for explicit auth provider override
  const provider = import.meta.env.VITE_AUTH_PROVIDER as AuthProvider;
  if (provider && ['mock', 'amplify', 'cognito'].includes(provider)) {
    return provider;
  }
  // Default based on environment
  return environment === 'mock' ? 'mock' : 'cognito';
};

const createEnvironmentConfig = (): EnvironmentConfig => {
  const environment = getEnvironment();
  const authProvider = getAuthProvider(environment);

  const configs: Record<AppEnvironment, Omit<EnvironmentConfig, 'authProvider' | 'useMockAuth'>> = {
    mock: {
      environment: 'mock',
      useMockData: true,
      enableDebugLogs: true,
      apiTimeout: 1000,
    },
    development: {
      environment: 'development',
      useMockData: false,
      enableDebugLogs: true,
      apiTimeout: 10000,
    },
    production: {
      environment: 'production',
      useMockData: false,
      enableDebugLogs: false,
      apiTimeout: 30000,
    },
  };

  return {
    ...configs[environment],
    authProvider,
    useMockAuth: authProvider === 'mock',
  };
};

export const envConfig = createEnvironmentConfig();

// Helper functions
export const isMockMode = () => envConfig.useMockAuth || envConfig.useMockData;
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
