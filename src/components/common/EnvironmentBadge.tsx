// Environment Badge Component
// Shows the current environment mode (only visible in non-production)

import envConfig from '../../config/environment';

export function EnvironmentBadge() {
  // Don't show in production
  if (envConfig.environment === 'production') {
    return null;
  }

  const badgeColors = {
    mock: 'bg-yellow-500 text-yellow-900',
    development: 'bg-blue-500 text-white',
    production: 'bg-green-500 text-white',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-semibold z-50 ${badgeColors[envConfig.environment]}`}
    >
      {envConfig.environment.toUpperCase()}
      {envConfig.useMockAuth && ' (Mock Auth)'}
    </div>
  );
}

export default EnvironmentBadge;
