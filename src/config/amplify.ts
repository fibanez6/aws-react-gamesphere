// AWS Amplify Configuration
// Replace these values with your actual AWS AppSync configuration

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_APPSYNC_ENDPOINT || 'https://xxxxxxxxxxxxxxxxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'userPool' as const,
    },
  },
};

export default amplifyConfig;
