import { debugLog } from '@/config/environment';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Schema } from '../../amplify/data/resource';
import { dataClient } from '../config/amplifyClient';

type UserProfile = Schema['User']['type'];

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (fields: Partial<Pick<UserProfile, 'username' | 'avatar' | 'status'>>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, authStatus } = useAuthenticator((ctx) => [ctx.user, ctx.authStatus]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch or create the User record linked to the currently authenticated Cognito user.
   * The owner field (automatically managed by Amplify) ties the record to the Cognito sub.
   */
  const syncUser = useCallback(async () => {
    if (authStatus !== 'authenticated' || !user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = user.username; // Cognito sub – used as the DynamoDB record id

      // Try to fetch the existing User record by id (direct key lookup)
      const { data: existingUser, errors: getErrors } = await dataClient.models.User.get({
        id: userId,
      });

      if (getErrors?.length) {
        throw new Error(getErrors.map((e) => e.message).join(', '));
      }

      if (existingUser) {
        // User record already exists – use it
        debugLog('User record found for authenticated user:', existingUser);
        setUserProfile(existingUser);
      } else {
        // First login – create the User record with the Cognito sub as id
        const email =
          user.signInDetails?.loginId ??
          user.username ??
          '';

        const username = email.split('@')[0]; // sensible default

        const { data: newUser, errors: createErrors } = await dataClient.models.User.create({
          id: userId,
          email,
          username,
          rank: 'BRONZE',
          xp: 0,
          level: 1,
          status: 'ONLINE',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=default`
        });

        if (createErrors?.length) {
          throw new Error(createErrors.map((e) => e.message).join(', '));
        }

        debugLog('Created new user record for authenticated user:', newUser);
        setUserProfile(newUser);
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [authStatus, user]);

  // Sync whenever auth state changes
  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const refreshProfile = useCallback(async () => {
    await syncUser();
  }, [syncUser]);

  const updateProfile = useCallback(
    async (fields: Partial<Pick<UserProfile, 'username' | 'avatar' | 'status'>>) => {
      if (!userProfile) return;

      setError(null);

      try {
        const { data: updated, errors } = await dataClient.models.User.update({
          id: userProfile.id,
          ...fields,
        });

        if (errors?.length) {
          throw new Error(errors.map((e) => e.message).join(', '));
        }

        setUserProfile(updated);
      } catch (err) {
        console.error('Failed to update user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to update profile');
        throw err;
      }
    },
    [userProfile],
  );

  return (
    <UserContext.Provider value={{ userProfile, loading, error, refreshProfile, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
