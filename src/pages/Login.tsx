import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUser } from '../context/UserContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authStatus } = useAuthenticator();
  const { userProfile, loading } = useUser();

  // Redirect to the original destination (or home) once the user profile is ready
  useEffect(() => {
    if (authStatus === 'authenticated' && userProfile && !loading) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [authStatus, userProfile, loading, navigate, location.state]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          GameSphere
        </h1>
        <Authenticator />
        {authStatus === 'authenticated' && loading && (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Setting up your profile...
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
