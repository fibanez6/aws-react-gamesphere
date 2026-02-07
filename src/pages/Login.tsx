import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    login, 
    signUp, 
    completeNewPassword, 
    confirmSignUp, 
    resendConfirmationCode,
    isLoading, 
    needsNewPassword,
    needsConfirmation,
    pendingEmail,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        await signUp(email, password, username);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      // Don't show error for flows that switch UI
      if (err.code !== 'NewPasswordRequiredException' && 
          err.message !== 'NEW_PASSWORD_REQUIRED' &&
          !err.message?.includes('confirm your email')) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }
  };

  const handleConfirmationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await confirmSignUp(confirmationCode);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    }
  };

  const handleResendCode = async () => {
    setError('');
    setMessage('');
    try {
      await resendConfirmationCode();
      setMessage('Confirmation code resent! Check your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await completeNewPassword(newPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set new password');
    }
  };

  // Show new password form if required
  if (needsNewPassword) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient">GameSphere</h1>
            <p className="text-dark-400 mt-2">Set Your New Password</p>
          </div>

          {/* New Password Form Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-2 text-center">Password Reset Required</h2>
            <p className="text-dark-400 text-sm text-center mb-6">
              Please set a new password to continue
            </p>

            <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-5 h-5" />
                    Setting Password...
                  </>
                ) : (
                  'Set New Password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation code form if required
  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient">GameSphere</h1>
            <p className="text-dark-400 mt-2">Verify Your Email</p>
          </div>

          {/* Confirmation Code Form Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-2 text-center">Check Your Email</h2>
            <p className="text-dark-400 text-sm text-center mb-6">
              We sent a verification code to<br />
              <span className="text-white font-medium">{pendingEmail}</span>
            </p>

            <form onSubmit={handleConfirmationSubmit} className="space-y-4">
              <div>
                <label htmlFor="confirmationCode" className="block text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="confirmationCode"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="input text-center text-lg tracking-widest"
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-5 h-5" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-dark-400 text-sm">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Resend Code
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient">GameSphere</h1>
          <p className="text-dark-400 mt-2">Your Social Gaming Dashboard</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your gaming name"
                  className="input"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-5 h-5" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {/* Demo Login */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-xs text-dark-500 text-center mb-3">
              For demo purposes, use any email/password
            </p>
            <button
              onClick={() => {
                setEmail('demo@gamesphere.io');
                setPassword('demo123');
              }}
              className="btn-secondary w-full text-sm"
            >
              Fill Demo Credentials
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-dark-500 text-sm mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
