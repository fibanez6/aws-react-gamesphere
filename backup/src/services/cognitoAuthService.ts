// Direct Cognito Authentication Service
// Uses amazon-cognito-identity-js without Amplify

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { debugError, debugLog } from '../config/environment';
import { User } from '../types';

const STORAGE_KEY = 'gamesphere_user';

// Store for pending challenges (e.g., newPasswordRequired)
let pendingCognitoUser: CognitoUser | null = null;
let pendingUserAttributes: Record<string, string> = {};

// Get Cognito configuration from environment
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

const getUserPool = () => {
  if (!poolData.UserPoolId || !poolData.ClientId) {
    throw new Error('Cognito User Pool not configured. Check VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID.');
  }
  return new CognitoUserPool(poolData);
};

// Helper to convert Cognito user to app User type
const cognitoUserToAppUser = (
  cognitoUser: CognitoUser,
  attributes: Record<string, string> = {}
): User => {
  debugLog('Cognito: Converting Cognito user to app user', { username: cognitoUser.getUsername(), attributes });
  const username = attributes.preferred_username || cognitoUser.getUsername();
  const avatar = attributes.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const rank = attributes['custom:rank'] || 'BRONZE';
  return {
    id: attributes.sub || cognitoUser.getUsername(),
    username,
    email: attributes.email || '',
    avatar,
    level: 1,
    rank,
    xp: 0,
    xpToNextLevel: 1000,
    isOnline: true,
    isPublicProfile: true,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
};

// Get user attributes as a record
const getUserAttributes = (cognitoUser: CognitoUser): Promise<Record<string, string>> => {
  return new Promise((resolve, reject) => {
    cognitoUser.getUserAttributes((err, attributes) => {
      if (err) {
        reject(err);
        return;
      }
      const attrs: Record<string, string> = {};
      attributes?.forEach((attr) => {
        attrs[attr.getName()] = attr.getValue();
      });
      resolve(attrs);
    });
  });
};

export const cognitoAuthService = {

  async getCurrentUser(): Promise<User | null> {
    debugLog('Cognito: Checking auth state');
    try {
      const userPool = getUserPool();
      const cognitoUser = userPool.getCurrentUser();

      if (!cognitoUser) {
        debugLog('Cognito: No current user');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Get session to verify user is authenticated
      return new Promise((resolve) => {
        cognitoUser.getSession(async (err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session?.isValid()) {
            debugLog('Cognito: Session invalid or error', err);
            localStorage.removeItem(STORAGE_KEY);
            resolve(null);
            return;
          }

          try {
            const attributes = await getUserAttributes(cognitoUser);
            const user = cognitoUserToAppUser(cognitoUser, attributes);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            debugLog('Cognito: User authenticated', { id: user.id, username: user.username });
            resolve(user);
          } catch (attrErr) {
            debugError('Cognito: Error getting attributes', attrErr);
            // Return basic user without attributes
            const user = cognitoUserToAppUser(cognitoUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            resolve(user);
          }
        });
      });
    } catch (error) {
      debugError('Cognito: Error checking auth state', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<User> {
    debugLog('Cognito: Signing in user', email);

    const userPool = getUserPool();
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: async (_session) => {
          debugLog('Cognito: Sign in successful');
          try {
            const attributes = await getUserAttributes(cognitoUser);
            const user = cognitoUserToAppUser(cognitoUser, attributes);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            resolve(user);
          } catch (attrErr) {
            const user = cognitoUserToAppUser(cognitoUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            resolve(user);
          }
        },
        onFailure: (err) => {
          debugError('Cognito: Sign in error', err);
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          debugLog('Cognito: New password required', { userAttributes, requiredAttributes });
          // Store the cognitoUser for completing the challenge later
          pendingCognitoUser = cognitoUser;
          pendingUserAttributes = userAttributes;
          // Create a special error that the UI can detect
          const error = new Error('NEW_PASSWORD_REQUIRED');
          (error as any).code = 'NewPasswordRequiredException';
          (error as any).userAttributes = userAttributes;
          (error as any).requiredAttributes = requiredAttributes;
          reject(error);
        },
        mfaRequired: (_challengeName, _challengeParameters) => {
          debugLog('Cognito: MFA required');
          reject(new Error('MFA verification required.'));
        },
        totpRequired: (_challengeName, _challengeParameters) => {
          debugLog('Cognito: TOTP required');
          reject(new Error('TOTP verification required.'));
        },
      });
    });
  },

  async completeNewPasswordChallenge(newPassword: string, requiredAttributes: Record<string, string> = {}): Promise<User> {
    debugLog('Cognito: Completing new password challenge');

    if (!pendingCognitoUser) {
      throw new Error('No pending password challenge. Please sign in first.');
    }

    const cognitoUser = pendingCognitoUser;

    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(newPassword, requiredAttributes, {
        onSuccess: async (_session) => {
          debugLog('Cognito: New password set successfully');
          pendingCognitoUser = null;
          pendingUserAttributes = {};

          try {
            const attributes = await getUserAttributes(cognitoUser);
            const user = cognitoUserToAppUser(cognitoUser, attributes);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            resolve(user);
          } catch (attrErr) {
            const user = cognitoUserToAppUser(cognitoUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            resolve(user);
          }
        },
        onFailure: (err) => {
          debugError('Cognito: Complete new password error', err);
          reject(err);
        },
      });
    });
  },

  // Check if there's a pending new password challenge
  hasPendingNewPasswordChallenge(): boolean {
    return pendingCognitoUser !== null;
  },

  // Get the pending user attributes (useful for showing which fields are required)
  getPendingUserAttributes(): Record<string, string> {
    return { ...pendingUserAttributes };
  },

  // Cancel the pending challenge
  cancelPendingChallenge(): void {
    pendingCognitoUser = null;
    pendingUserAttributes = {};
  },

  async signUp(email: string, password: string, username: string): Promise<User> {
    debugLog('Cognito: Signing up user', { email });

    const userPool = getUserPool();

    // TODO: fix picture and rank attributes - they are currently required by the user pool but should be optional. For now, we set defaults here.
    // Only include email - preferred_username may not be writable by the client
    // If you need preferred_username, enable it in Cognito User Pool Client settings
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'preferred_username', Value: username }),
      new CognitoUserAttribute({ Name: 'picture', Value: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` }),
      new CognitoUserAttribute({ Name: 'custom:rank', Value: 'BRONZE' }),
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          debugError('Cognito: Sign up error', err);
          reject(err);
          return;
        }

        if (!result) {
          reject(new Error('Sign up failed - no result'));
          return;
        }

        debugLog('Cognito: Sign up successful', { userConfirmed: result.userConfirmed });

        if (!result.userConfirmed) {
          reject(new Error('Please confirm your email. Check your inbox for a verification code.'));
          return;
        }

        // If confirmed, create user object (use email prefix as display name)
        const displayName = email.split('@')[0];
        const user: User = {
          id: result.userSub,
          username: displayName,
          email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`,
          level: 1,
          rank: 'Bronze',
          xp: 0,
          xpToNextLevel: 1000,
          isOnline: true,
          isPublicProfile: true,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        resolve(user);
      });
    });
  },

  async confirmSignUp(email: string, code: string): Promise<void> {
    debugLog('Cognito: Confirming sign up', email);

    const userPool = getUserPool();
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          debugError('Cognito: Confirm sign up error', err);
          reject(err);
          return;
        }
        debugLog('Cognito: Sign up confirmed', result);
        resolve();
      });
    });
  },

  async resendConfirmationCode(email: string): Promise<void> {
    debugLog('Cognito: Resending confirmation code', email);

    const userPool = getUserPool();
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          debugError('Cognito: Resend code error', err);
          reject(err);
          return;
        }
        debugLog('Cognito: Confirmation code resent', result);
        resolve();
      });
    });
  },

  async forgotPassword(email: string): Promise<void> {
    debugLog('Cognito: Initiating forgot password', email);

    const userPool = getUserPool();
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess: (data) => {
          debugLog('Cognito: Forgot password initiated', data);
          resolve();
        },
        onFailure: (err) => {
          debugError('Cognito: Forgot password error', err);
          reject(err);
        },
      });
    });
  },

  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    debugLog('Cognito: Confirming forgot password', email);

    const userPool = getUserPool();
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          debugLog('Cognito: Password reset successful');
          resolve();
        },
        onFailure: (err) => {
          debugError('Cognito: Password reset error', err);
          reject(err);
        },
      });
    });
  },

  async signOut(): Promise<void> {
    debugLog('Cognito: Signing out user');
    try {
      const userPool = getUserPool();
      const cognitoUser = userPool.getCurrentUser();

      if (cognitoUser) {
        cognitoUser.signOut();
      }
      localStorage.removeItem(STORAGE_KEY);
      debugLog('Cognito: Sign out successful');
    } catch (error) {
      debugError('Cognito: Sign out error', error);
      localStorage.removeItem(STORAGE_KEY);
      throw error;
    }
  },

  async globalSignOut(): Promise<void> {
    debugLog('Cognito: Global sign out');
    const userPool = getUserPool();
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    return new Promise((resolve, reject) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          localStorage.removeItem(STORAGE_KEY);
          resolve();
          return;
        }

        cognitoUser.globalSignOut({
          onSuccess: (_msg) => {
            debugLog('Cognito: Global sign out successful');
            localStorage.removeItem(STORAGE_KEY);
            resolve();
          },
          onFailure: (err) => {
            debugError('Cognito: Global sign out error', err);
            localStorage.removeItem(STORAGE_KEY);
            reject(err);
          },
        });
      });
    });
  },

  // Get current session tokens (useful for API calls)
  async getSession(): Promise<CognitoUserSession | null> {
    const userPool = getUserPool();
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      return null;
    }

    return new Promise((resolve) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          resolve(null);
          return;
        }
        resolve(session);
      });
    });
  },

  // Get ID token for API authorization
  async getIdToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.getIdToken().getJwtToken() || null;
  },

  // Get access token
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.getAccessToken().getJwtToken() || null;
  },
};

export default cognitoAuthService;
