import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { dataClient } from '../config/amplifyClient';
import type { Schema } from '../../amplify/data/resource';

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
      // List the owner's User records (should be 0 or 1)
      const { data: users, errors: listErrors } = await dataClient.models.User.list();

      if (listErrors?.length) {
        throw new Error(listErrors.map((e) => e.message).join(', '));
      }

      if (users.length > 0) {
        // User record already exists – use it
        setUserProfile(users[0]);
      } else {
        // First login – create the User record with defaults
        const email =
          user.signInDetails?.loginId ??
          user.username ??
          '';

        const username = email.split('@')[0]; // sensible default

        const { data: newUser, errors: createErrors } = await dataClient.models.User.create({
          email,
          username,
          rank: 'BRONZE',
          xp: 0,
          level: 1,
          status: 'ONLINE',
        });

        if (createErrors?.length) {
          throw new Error(createErrors.map((e) => e.message).join(', '));
        }

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
