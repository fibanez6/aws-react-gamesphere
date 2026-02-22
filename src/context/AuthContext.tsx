import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import envConfig, { debugError, debugLog } from '../config/environment';
import authService from '../services/authService';
import { cognitoAuthService } from '../services/cognitoAuthService';
import { User } from '../types';
import userService from '@/services/userService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMockMode: boolean;
  environment: string;
  needsNewPassword: boolean;
  needsConfirmation: boolean;
  pendingEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  confirmSignUp: (code: string) => Promise<void>;
  resendConfirmationCode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    debugLog('AuthContext: Checking authentication state...');
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        debugLog('AuthContext: User found:', currentUser.username);
        setUser(currentUser);
      } else {
        debugLog('AuthContext: No authenticated user found');
      }
    } catch (error) {
      debugError('AuthContext: Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    debugLog('AuthContext: Attempting login for:', email);
    setIsLoading(true);
    try {
      const authenticatedUser = await authService.signIn(email, password);
      const userData = await userService.getUser(authenticatedUser.id);
      authenticatedUser.username = userData?.username || authenticatedUser.username;
      setUser(authenticatedUser);
      setNeedsNewPassword(false);
      debugLog('AuthContext: Login successful:', authenticatedUser.username);
    } catch (error: any) {
      // Check if this is a new password required challenge
      if (error.code === 'NewPasswordRequiredException' || error.message === 'NEW_PASSWORD_REQUIRED') {
        debugLog('AuthContext: New password required for user');
        setNeedsNewPassword(true);
        setIsLoading(false);
        throw error;
      }
      debugError('AuthContext: Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeNewPassword = useCallback(async (newPassword: string) => {
    debugLog('AuthContext: Completing new password challenge');
    setIsLoading(true);
    try {
      const authenticatedUser = await cognitoAuthService.completeNewPasswordChallenge(newPassword);
      setUser(authenticatedUser);
      setNeedsNewPassword(false);
      debugLog('AuthContext: New password set successfully:', authenticatedUser.username);
    } catch (error) {
      debugError('AuthContext: Complete new password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    debugLog('AuthContext: Logging out user');
    try {
      await authService.signOut();
      setUser(null);
      debugLog('AuthContext: Logout successful');
    } catch (error) {
      debugError('AuthContext: Logout error:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    debugLog('AuthContext: Attempting signup for:', { email, username });
    setIsLoading(true);
    try {
      const newUser = await authService.signUp(email, password, username);
      setUser(newUser);
      debugLog('AuthContext: Signup successful:', newUser.username);
    } catch (error: any) {
      // Check if confirmation is required
      if (error.message?.includes('confirm your email')) {
        debugLog('AuthContext: Email confirmation required for:', email);
        setPendingEmail(email);
        setPendingPassword(password);
        setNeedsConfirmation(true);
        setIsLoading(false);
        throw error;
      }
      debugError('AuthContext: SignUp error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmSignUp = useCallback(async (code: string) => {
    if (!pendingEmail) {
      throw new Error('No pending email to confirm');
    }
    debugLog('AuthContext: Confirming signup for:', pendingEmail);
    setIsLoading(true);
    try {
      await cognitoAuthService.confirmSignUp(pendingEmail, code);
      debugLog('AuthContext: Email confirmed successfully');
      
      // Auto-login after confirmation if we have the password
      if (pendingPassword) {
        const authenticatedUser = await authService.signIn(pendingEmail, pendingPassword);
        setUser(authenticatedUser);
        debugLog('AuthContext: Auto-login successful after confirmation');
      }
      
      setNeedsConfirmation(false);
      setPendingEmail(null);
      setPendingPassword(null);
    } catch (error) {
      debugError('AuthContext: Confirm signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pendingEmail, pendingPassword]);

  const resendConfirmationCode = useCallback(async () => {
    if (!pendingEmail) {
      throw new Error('No pending email to resend code to');
    }
    debugLog('AuthContext: Resending confirmation code to:', pendingEmail);
    try {
      await cognitoAuthService.resendConfirmationCode(pendingEmail);
      debugLog('AuthContext: Confirmation code resent');
    } catch (error) {
      debugError('AuthContext: Resend code error:', error);
      throw error;
    }
  }, [pendingEmail]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isMockMode: envConfig.useMockAuth,
        environment: envConfig.environment,
        needsNewPassword,
        needsConfirmation,
        pendingEmail,
        login,
        logout,
        signUp,
        completeNewPassword,
        confirmSignUp,
        resendConfirmationCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
